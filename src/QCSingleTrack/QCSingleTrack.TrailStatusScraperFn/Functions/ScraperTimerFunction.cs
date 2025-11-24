using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using QCSingleTrack.Application.Services;

namespace QCSingleTrack.TrailStatusScraperFn.Functions;

public class ScraperTimerFunction
{
    private readonly ITrailScraper _scraper;
    private readonly ITrailService _trailService;
    private readonly ILogger<ScraperTimerFunction> _logger;

    public ScraperTimerFunction(ITrailScraper scraper, ITrailService trailService, ILogger<ScraperTimerFunction> logger)
    {
        _scraper = scraper;
        _trailService = trailService;
        _logger = logger;
    }

    // Runs every 20 seconds
    [Function("ScrapeTimer")]
    public async Task Run([TimerTrigger("*/20 * * * * *")] TimerInfo timer)
    {
        _logger.LogInformation("ScrapeTimer fired at {Time}", DateTime.UtcNow);

        try
        {
            var results = await _scraper.ScrapeForcAsync();

            var count = results?.Count() ?? 0;

            _logger.LogInformation("Scraped {Count} results", count);

            if(results != null) 
                await _trailService.UpdateTrailStatusesAsync(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in ScrapeTimer");
        }
    }
}
