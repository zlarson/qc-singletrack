using Microsoft.AspNetCore.Mvc;
using QCSingleTrack.Application.Services;
using System.Threading.Tasks;
using QCSingleTrack.Api.Models;

namespace QCSingleTrack.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrailsController : ControllerBase
{
    private readonly ITrailService _trailService;

    public TrailsController(ITrailService trailService)
    {
        _trailService = trailService;
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
            LastScrapedTime = t.CurrentTrailStatus?.LastScrapedTime
        });

        return Ok(dtos);
    }
}
