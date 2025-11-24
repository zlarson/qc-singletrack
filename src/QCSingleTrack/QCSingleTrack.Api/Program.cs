using Microsoft.EntityFrameworkCore;
using QCSingleTrack.Application.Services;
using QCSingleTrack.Infrastructure.Data;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Add CORS policy to allow local frontend (http and https)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddOpenApi();

// Add DI for application services
builder.Services.AddScoped<ITrailService, TrailService>();

// DbContext factory (use same connection string as other projects -- environment-based)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContextFactory<TrailStatusDbContext>(options => options.UseSqlServer(connectionString));
}
else
{
    // No connection string provided: register an in-memory provider for development/testing so IDbContextFactory is available
    builder.Services.AddDbContextFactory<TrailStatusDbContext>(options => options.UseInMemoryDatabase("TrailsInMemory"));
}

// Simple API Key middleware - do not register middleware type as a service here; it's invoked via UseMiddleware
// builder.Services.AddSingleton<ApiKeyMiddleware>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Trails API")
            .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
    });
}

app.UseRouting();

// Enable CORS for requests from the frontend
app.UseCors("AllowAngularDev");

// Use API Key middleware
app.UseMiddleware<ApiKeyMiddleware>("X-Api-Key");

app.MapControllers();

app.Run();
