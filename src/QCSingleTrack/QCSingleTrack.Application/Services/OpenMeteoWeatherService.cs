using Microsoft.Extensions.Logging;
using System.Net.Http;

namespace QCSingleTrack.Application.Services;

public class OpenMeteoWeatherService : IWeatherService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<OpenMeteoWeatherService> _logger;

    public OpenMeteoWeatherService(IHttpClientFactory httpClientFactory, ILogger<OpenMeteoWeatherService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<WeatherResult?> GetCurrentWeatherAsync(double latitude, double longitude)
    {
        var client = _httpClientFactory.CreateClient("OpenMeteo");
        var url = $"v1/forecast?latitude={latitude}&longitude={longitude}&daily=weather_code,sunset&hourly=temperature_2m,precipitation,weather_code&current=temperature_2m,precipitation,weather_code&timezone=America%2FChicago&past_days=3&forecast_days=1&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch";

        HttpResponseMessage resp;
        try
        {
            resp = await client.GetAsync(url);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "HTTP request to Open-Meteo failed for {Latitude}, {Longitude}", latitude, longitude);
            return null;
        }

        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogWarning("Failed to get weather data from Open-Meteo for {Latitude}, {Longitude}. Status Code: {StatusCode}", latitude, longitude, resp.StatusCode);
            return null;
        }

        string json;
        try
        {
            json = await resp.Content.ReadAsStringAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read weather response content for {Latitude},{Longitude}", latitude, longitude);
            return null;
        }

        try
        {
            var weather = WeatherResult.FromJson(json);
            return weather;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse weather JSON for {Latitude},{Longitude}. Payload: {Payload}", latitude, longitude, json.Length > 2000 ? json[..2000] : json);
            return null;
        }
    }
}
