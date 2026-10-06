using Azure.Identity;
using Microsoft.ApplicationInsights;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using QCSingleTrack.Application.Services;
using QCSingleTrack.Application.Settings;
using QCSingleTrack.Application.Storage;
using QCSingleTrack.TrailStatusScraperConsole;

// Use the exe's folder as the content root so appsettings.json is found when run from Task Scheduler
// (whose working directory defaults to C:\Windows\System32).
var builder = Host.CreateApplicationBuilder(new HostApplicationBuilderSettings
{
    // Command-line args are this tool's own commands (--seed), not config overrides.
    ContentRootPath = AppContext.BaseDirectory,
});

// Host.CreateApplicationBuilder already loads appsettings.json, appsettings.{Environment}.json,
// user secrets (Development only) and environment variables.
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

// Trails live in Azure Table Storage: Storage:AccountName signs in with az login; Storage:ConnectionString
// (user secrets or Azurite) takes precedence when set. The console only runs on a PC, so it goes straight to the
// Azure CLI instead of DefaultAzureCredential, which first probes for a managed identity that doesn't exist there.
builder.Services.AddTrailTableStorage(builder.Configuration, new AzureCliCredential());

// Application layer services
builder.Services.AddScoped<ITrailScraper, AngleSharpTrailScraper>();
builder.Services.AddScoped<TableTrailService>();
builder.Services.AddScoped<ITrailService>(sp => sp.GetRequiredService<TableTrailService>());
builder.Services.AddScoped<ScrapeJob>();
builder.Services.AddScoped<DataCommands>();

// Application Insights - reads APPLICATIONINSIGHTS_CONNECTION_STRING (env var or config); no-op if absent
builder.Services.AddApplicationInsightsTelemetryWorkerService();

using var host = builder.Build();

bool success;
using (var scope = host.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var seedIndex = Array.IndexOf(args, "--seed");
    if (seedIndex >= 0)
    {
        if (seedIndex + 1 >= args.Length)
        {
            Console.Error.WriteLine("Usage: --seed <trails.json>, where the file is saved output of GET /api/trails.");
            return 1;
        }
        success = await services.GetRequiredService<DataCommands>().SeedFromApiJsonAsync(args[seedIndex + 1]);
    }
    else
    {
        success = await services.GetRequiredService<ScrapeJob>().RunAsync();
    }
}

// Short-lived process: flush telemetry before exiting so it isn't lost
var telemetry = host.Services.GetService<TelemetryClient>();
if (telemetry != null)
{
    await telemetry.FlushAsync(CancellationToken.None);
}

return success ? 0 : 1;
