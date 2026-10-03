using Microsoft.ApplicationInsights;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using QCSingleTrack.Application.Services;
using QCSingleTrack.Application.Settings;
using QCSingleTrack.Infrastructure.Data;
using QCSingleTrack.TrailStatusScraperConsole;

// Use the exe's folder as the content root so appsettings.json is found when run from Task Scheduler
// (whose working directory defaults to C:\Windows\System32).
var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings
{
    Args = args,
    ContentRootPath = AppContext.BaseDirectory,
});

// Host.CreateApplicationBuilder already loads appsettings.json, appsettings.{Environment}.json,
// user secrets (Development only), environment variables and command-line args.
builder.Configuration.AddUserSecrets<ScrapeJob>(optional: true);

builder.Services
    .AddOptions<ScraperOptions>()
    .Configure<IConfiguration>((options, config) =>
    {
        config.GetSection("Scraper").Bind(options);
    });

builder.Services.AddHttpClient("ScraperClient", (sp, client) =>
{
    var opts = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<ScraperOptions>>().Value;
    if (!string.IsNullOrWhiteSpace(opts.BaseUrl))
    {
        client.BaseAddress = new Uri(opts.BaseUrl);
    }

    // Browser-like defaults (most important is User-Agent)
    client.DefaultRequestHeaders.UserAgent.ParseAdd(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/123.0.0.0 Safari/537.36");

    client.DefaultRequestHeaders.Accept.ParseAdd(
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8");

    client.DefaultRequestHeaders.AcceptLanguage.ParseAdd("en-US,en;q=0.9");

    // Optional: some servers look for this
    client.DefaultRequestHeaders.TryAddWithoutValidation("Upgrade-Insecure-Requests", "1");
});

// EF Core: register DbContextFactory using a connection string from configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("ConnectionStrings:DefaultConnection is not configured.");
    return 1;
}

builder.Services.AddDbContextFactory<TrailStatusDbContext>(options =>
{
    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null);

        sqlOptions.CommandTimeout(60);
    });
});

// Application layer services
builder.Services.AddScoped<ITrailScraper, AngleSharpTrailScraper>();
builder.Services.AddScoped<ITrailService, TrailService>();
builder.Services.AddScoped<ScrapeJob>();

// Application Insights - reads APPLICATIONINSIGHTS_CONNECTION_STRING (env var or config); no-op if absent
builder.Services.AddApplicationInsightsTelemetryWorkerService();

using var host = builder.Build();

bool success;
using (var scope = host.Services.CreateScope())
{
    success = await scope.ServiceProvider.GetRequiredService<ScrapeJob>().RunAsync();
}

// Short-lived process: flush telemetry before exiting so it isn't lost
var telemetry = host.Services.GetService<TelemetryClient>();
if (telemetry != null)
{
    await telemetry.FlushAsync(CancellationToken.None);
}

return success ? 0 : 1;
