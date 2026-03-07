using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace QCSingleTrack.Application.Services;

public class WeatherResult
{
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? Elevation { get; set; }

    // Today's detailed weather
    public DailyWeatherResult? Today { get; set; }

    // Previous days (older than Today), ordered most-recent-first
    public List<DailyWeatherResult> PreviousDays { get; set; } = new();

    // Parse the weather JSON (structure matches the provided example)
    public static WeatherResult FromJson(string json)
    {
        // Backwards compatible: create a default lookup
        var lookup = new WeatherCodeLookup();
        return FromJson(json, lookup);
    }

    public static WeatherResult FromJson(string json, IWeatherCodeLookup lookup)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var result = new WeatherResult
        {
            Latitude = root.GetPropertyOrNullDouble("latitude"),
            Longitude = root.GetPropertyOrNullDouble("longitude"),
            Elevation = root.GetPropertyOrNullDouble("elevation")
        };

        // prefer current.temperature_2m when available for today's temperature
        double? currentTemp = null;
        if (root.TryGetProperty("current", out var currentEl) && currentEl.ValueKind != JsonValueKind.Null && currentEl.TryGetProperty("temperature_2m", out var curTempEl))
        {
            if (curTempEl.ValueKind == JsonValueKind.Number && curTempEl.TryGetDouble(out var ct)) currentTemp = ct;
        }

        // Build hourly points
        var hourly = root.TryGetProperty("hourly", out var hourlyEl) ? hourlyEl : default;
        var hourlyTimes = hourly.TryGetArray("time");
        var temps = hourly.TryGetArray("temperature_2m");
        var precips = hourly.TryGetArray("precipitation");
        var codes = hourly.TryGetArray("weather_code");

        var hourlyPoints = new List<HourlyWeatherPoint>();
        if (hourlyTimes is not null)
        {
            for (int i = 0; i < hourlyTimes.Length; i++)
            {
                var timeStr = hourlyTimes[i].GetString() ?? string.Empty;
                if (!DateTime.TryParse(timeStr, out var time))
                {
                    continue;
                }

                double? temp = JsonElementExtensions.GetNullableDoubleFromArray(temps, i);
                double? precip = JsonElementExtensions.GetNullableDoubleFromArray(precips, i);
                int? code = JsonElementExtensions.GetNullableIntFromArray(codes, i);

                hourlyPoints.Add(new HourlyWeatherPoint
                {
                    Time = time,
                    Temperature = temp,
                    Precipitation = precip,
                    WeatherCode = code
                });
            }
        }

        // Group hourly points by date for daily results
        var daily = root.TryGetProperty("daily", out var dailyEl) ? dailyEl : default;
        var dailyDates = daily.TryGetArray("time");
        var dailySunsets = daily.TryGetArray("sunset");

        var dailyResults = new List<DailyWeatherResult>();
        if (dailyDates is not null)
        {
            for (int d = 0; d < dailyDates.Length; d++)
            {
                var dateStr = dailyDates[d].GetString() ?? string.Empty;
                if (!DateTime.TryParse(dateStr, out var dateOnly))
                {
                    continue;
                }

                DateTime? sunset = JsonElementExtensions.GetNullableDateFromArray(dailySunsets, d);

                var pointsForDay = hourlyPoints.Where(h => h.Time.Date == dateOnly.Date).ToList();

                var tempValues = pointsForDay.Select(p => p.Temperature).WhereNotNull().ToList();
                var precipValues = pointsForDay.Select(p => p.Precipitation).WhereNotNull().ToList();
                var uniqueCodesInt = pointsForDay.Select(p => p.WeatherCode).Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToList();

                // Map codes to descriptions using lookup
                var uniqueCodeDescriptions = uniqueCodesInt
                    .Select(c => lookup.GetDescription(c))
                    .Where(desc => !string.IsNullOrWhiteSpace(desc))
                    .Distinct()
                    .ToList()!;

                var avgTemp = tempValues.Any() ? (double?)Math.Round(tempValues.Average(), 2) : null;
                // Sum precipitation over the day rather than averaging
                var totalPrecip = precipValues.Any() ? (double?)precipValues.Sum() : null;

                var dailyResult = new DailyWeatherResult
                {
                    Date = dateOnly.Date,
                    Sunset = sunset,
                    AverageTemperature = avgTemp,
                    AveragePrecipitation = totalPrecip,
                    UniqueWeatherCodes = uniqueCodeDescriptions
                };

                dailyResults.Add(dailyResult);
            }
        }

        if (dailyResults.Count > 0)
        {
            // Assume last entry is the most recent day (Today)
            var today = dailyResults.Last();
            result.Today = today;
            // For Today, prefer current.temperature_2m if available, otherwise use the last hourly reading
            var lastPoint = hourlyPoints.Where(h => h.Time.Date == today.Date).OrderBy(h => h.Time).LastOrDefault();
            if (currentTemp.HasValue)
            {
                result.Today.AverageTemperature = Math.Round(currentTemp.Value, 2);
            }
            else if (lastPoint is not null)
            {
                result.Today.AverageTemperature = lastPoint.Temperature is double t ? Math.Round(t, 2) : (double?)null;
                //result.Today.AveragePrecipitation = lastPoint.Precipitation;
            }

            // previous days: all except last, ordered most-recent-first
            result.PreviousDays = dailyResults.Take(dailyResults.Count - 1).Reverse().ToList();
        }
        else
        {
            // fallback: if no daily grouping, consider last 24 hours as Today
            var latestDay = hourlyPoints.GroupBy(h => h.Time.Date).OrderBy(g => g.Key).LastOrDefault();
            if (latestDay is not null)
            {
                var pointsForDay = latestDay.ToList();
                var tempValues = pointsForDay.Select(p => p.Temperature).WhereNotNull().ToList();
                var precipValues = pointsForDay.Select(p => p.Precipitation).WhereNotNull().ToList();
                var uniqueCodesInt = pointsForDay.Select(p => p.WeatherCode).Where(x => x.HasValue).Select(x => x!.Value).Distinct().ToList();

                var uniqueCodeDescriptions = uniqueCodesInt
                    .Select(c => lookup.GetDescription(c))
                    .Where(desc => !string.IsNullOrWhiteSpace(desc))
                    .Distinct()
                    .ToList()!;

                var avgTemp = tempValues.Any() ? (double?)Math.Round(tempValues.Average(), 2) : null;
                var totalPrecip = precipValues.Any() ? (double?)precipValues.Sum() : null;

                result.Today = new DailyWeatherResult
                {
                    Date = latestDay.Key,
                    AverageTemperature = avgTemp,
                    AveragePrecipitation = totalPrecip,
                    UniqueWeatherCodes = uniqueCodeDescriptions
                };

                // prefer current.temperature_2m to override Today's averages; otherwise use last reading
                var lastPoint = pointsForDay.OrderBy(h => h.Time).LastOrDefault();
                if (currentTemp.HasValue)
                {
                    result.Today.AverageTemperature = Math.Round(currentTemp.Value, 2);
                }
                else if (lastPoint is not null)
                {
                    result.Today.AverageTemperature = lastPoint.Temperature is double t ? Math.Round(t, 2) : (double?)null;
                    result.Today.AveragePrecipitation = lastPoint.Precipitation;
                }
            }
        }

        return result;
    }
}

public class DailyWeatherResult
{
    public DateTime Date { get; set; }
    public DateTime? Sunset { get; set; }

    // Aggregated values
    public double? AverageTemperature { get; set; }
    public double? AveragePrecipitation { get; set; }
    public List<string> UniqueWeatherCodes { get; set; } = new();
}

public class HourlyWeatherPoint
{
    public DateTime Time { get; set; }
    public double? Temperature { get; set; }
    public double? Precipitation { get; set; }
    public int? WeatherCode { get; set; }
}

// --- Helper extension methods for JsonElement handling ---
internal static class JsonElementExtensions
{
    public static JsonElement[]? TryGetArray(this JsonElement element, string propertyName)
    {
        if (element.ValueKind == JsonValueKind.Undefined || element.ValueKind == JsonValueKind.Null) return null;
        return element.TryGetProperty(propertyName, out var prop) && prop.ValueKind == JsonValueKind.Array
            ? prop.EnumerateArray().ToArray()
            : null;
    }

    public static double? GetPropertyOrNullDouble(this JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var prop) && prop.ValueKind != JsonValueKind.Null
            ? prop.GetDouble()
            : null;
    }

    public static double? GetNullableDoubleFromArray(JsonElement[]? array, int index)
    {
        var el = GetElementAtOrNull(array, index);
        if (el is null) return null;
        if (el.Value.ValueKind == JsonValueKind.Number && el.Value.TryGetDouble(out var d)) return d;
        return null;
    }

    public static int? GetNullableIntFromArray(JsonElement[]? array, int index)
    {
        var el = GetElementAtOrNull(array, index);
        if (el is null) return null;
        if (el.Value.ValueKind == JsonValueKind.Number && el.Value.TryGetInt32(out var i)) return i;
        return null;
    }

    public static DateTime? GetNullableDateFromArray(JsonElement[]? array, int index)
    {
        var el = GetElementAtOrNull(array, index);
        if (el is null) return null;
        var s = el.Value.GetString();
        if (s is null) return null;
        return DateTime.TryParse(s, out var dt) ? dt : null;
    }

    private static JsonElement? GetElementAtOrNull(JsonElement[]? array, int index)
    {
        if (array == null || index < 0 || index >= array.Length) return null;
        return array[index];
    }

    public static IEnumerable<double> WhereNotNull(this IEnumerable<double?> seq)
    {
        return seq.Where(x => x.HasValue).Select(x => x!.Value);
    }
}
