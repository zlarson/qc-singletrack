using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using QCSingleTrack.Application.Services;
using QCSingleTrack.Application.Settings;
using QCSingleTrack.Application.Storage;

var builder = FunctionsApplication.CreateBuilder(args);

// Load optional appsettings.json (local development) so appsettings can be used if present
builder.Configuration.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);

builder.ConfigureFunctionsWebApplication();

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

// Trails live in Azure Table Storage (Storage:ConnectionString for Azurite, or Storage:AccountName with managed identity)
builder.Services.AddTrailTableStorage(builder.Configuration);

// Application layer services
builder.Services.AddScoped<ITrailScraper, AngleSharpTrailScraper>();
builder.Services.AddScoped<ITrailService, TableTrailService>();

//// Application Insights - worker service integration reads APPLICATIONINSIGHTS_CONNECTION_STRING env var
builder.Services
    .AddApplicationInsightsTelemetryWorkerService()
    .ConfigureFunctionsApplicationInsights();

// Optionally configure SDK logging/telemetry further via TelemetryConfiguration or ILogger filters.

builder.Build().Run();
