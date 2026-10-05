using Azure.Identity;
using QCSingleTrack.Application.Services;
using QCSingleTrack.Application.Storage;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Add in-memory cache for weather results
builder.Services.AddMemoryCache();

// Add CORS policy to allow local frontend (http and https)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins("https://qcbiketrails.com", "https://happy-field-01d863a10.3.azurestaticapps.net", "http://localhost:4200", "https://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add DI for application services
builder.Services.AddScoped<ITrailService, TableTrailService>();
// Register weather service implementation (from Application layer)
builder.Services.AddScoped<IWeatherService, OpenMeteoWeatherService>();
// Register weather code lookup as singleton
builder.Services.AddSingleton<IWeatherCodeLookup, WeatherCodeLookup>();

// Register an HttpClient for Open-Meteo
builder.Services.AddHttpClient("OpenMeteo", client =>
{
    client.BaseAddress = new Uri("https://api.open-meteo.com/");
});

// Trails live in Azure Table Storage (Storage:ConnectionString for Azurite, or Storage:AccountName with managed identity)
builder.Services.AddTrailTableStorage(builder.Configuration);

// Simple API Key middleware - do not register middleware type as a service here; it's invoked via UseMiddleware
// builder.Services.AddSingleton<ApiKeyMiddleware>();

//var keyVaultEndpoint = builder.Configuration["KeyVault:Endpoint"];

//if (!string.IsNullOrWhiteSpace(keyVaultEndpoint))
//{
//    builder.Configuration.AddAzureKeyVault(new Uri(keyVaultEndpoint), new DefaultAzureCredential());
//}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Trails API")
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
            .WithOpenApiRoutePattern("/swagger/v1/swagger.json");
    });
}

app.UseRouting();

// Enable CORS for requests from the frontend
app.UseCors("AllowAngularDev");

// Use API Key middleware
app.UseMiddleware<ApiKeyMiddleware>("X-Api-Key");

app.MapControllers();

app.Run();
