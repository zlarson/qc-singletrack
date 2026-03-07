using System.Threading.Tasks;

namespace QCSingleTrack.Application.Services;

public interface IWeatherService
{
    // Gets current weather for the specified latitude/longitude.
    Task<WeatherResult?> GetCurrentWeatherAsync(double latitude, double longitude);
}
