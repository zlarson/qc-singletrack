using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using QCSingleTrack.Infrastructure.Data;
using QCSingleTrack.Application.Services;
using QCSingleTrack.Application.Settings;

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
});

// EF Core: register DbContextFactory using a connection string from configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    // Fall back to env value used by Functions (Values section in local.settings.json)
    connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
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

// Application Insights - worker service integration reads APPLICATIONINSIGHTS_CONNECTION_STRING env var
builder.Services
    .AddApplicationInsightsTelemetryWorkerService()
    .ConfigureFunctionsApplicationInsights();

// Optionally configure SDK logging/telemetry further via TelemetryConfiguration or ILogger filters.

builder.Build().Run();
