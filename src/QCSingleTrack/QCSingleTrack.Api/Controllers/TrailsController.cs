using Microsoft.AspNetCore.Mvc;
using QCSingleTrack.Application.Services;
using System.Threading.Tasks;
using System.Linq;
using System;
using QCSingleTrack.Api.Models;
using Microsoft.Extensions.Caching.Memory;

namespace QCSingleTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrailsController : ControllerBase
{
    private readonly ITrailService _trailService;
    private readonly IWeatherService _weatherService;
    private readonly IMemoryCache _cache;

    public TrailsController(ITrailService trailService, IWeatherService weatherService, IMemoryCache cache)
    {
        _trailService = trailService;
        _weatherService = weatherService;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var trails = await _trailService.GetAllTrailsAsync();

        var dtos = trails.Select(t => new TrailDto
        {
            TrailId = t.TrailId,
            TrailName = t.TrailName,
            Description = t.Description,
            Latitude = t.Latitude,
            Longitude = t.Longitude,
            CurrentStatus = t.CurrentTrailStatus?.Status,
            CurrentSource = t.CurrentTrailStatus?.Source,
            CurrentReason = t.CurrentTrailStatus?.Reason,
            LastScrapedTime = t.CurrentTrailStatus?.LastScrapedTime,
            Photos = t.Photos?.Select(p => new TrailPhotoDto
            {
                PhotoUrl = p.PhotoUrl,
                ThumbnailUrl = p.ThumbnailUrl,
                Caption = p.Caption
            })
        });

        return Ok(dtos);
    }

    [HttpGet("{trailId:int}/weather")]
    [ProducesResponseType(typeof(WeatherResult), 200)]
    [ProducesResponseType(typeof(string), 502)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetWeather(int trailId)
    {
        var cacheKey = $"weather:{trailId}";
        if (_cache.TryGetValue(cacheKey, out WeatherResult? cached) && cached is not null)
        {
            return Ok(cached);
        }

        var trail = await _trailService.GetTrailByIdAsync(trailId);

        if (trail == null) return NotFound();

        var lat = Convert.ToDouble(trail.Latitude);
        var lon = Convert.ToDouble(trail.Longitude);

        if (Math.Abs(lat) < double.Epsilon && Math.Abs(lon) < double.Epsilon)
        {
            return BadRequest("Trail does not have valid latitude/longitude.");
        }

        var result = await _weatherService.GetCurrentWeatherAsync(lat, lon);
        if (result == null) return StatusCode(502, "Error querying weather provider.");

        // cache for 10 minutes
        var cacheEntryOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(10));

        _cache.Set(cacheKey, result, cacheEntryOptions);

        return Ok(result);
    }
}
