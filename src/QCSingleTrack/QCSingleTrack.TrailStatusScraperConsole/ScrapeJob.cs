using Microsoft.Extensions.Logging;
using QCSingleTrack.Application.Services;

namespace QCSingleTrack.TrailStatusScraperConsole;

/// <summary>
/// Console equivalent of ScraperTimerFunction: scrape once, then upsert trail statuses.
/// </summary>
public class ScrapeJob
{
    private readonly ITrailScraper _scraper;
    private readonly ITrailService _trailService;
    private readonly ILogger<ScrapeJob> _logger;

    public ScrapeJob(ITrailScraper scraper, ITrailService trailService, ILogger<ScrapeJob> logger)
    {
        _scraper = scraper;
        _trailService = trailService;
        _logger = logger;
    }

    /// <returns>true on success, false if an error occurred.</returns>
    public async Task<bool> RunAsync()
    {
        _logger.LogInformation("Scrape job started at {Time}", DateTime.UtcNow);

        try
        {
            var results = await _scraper.ScrapeForcAsync();

            var count = results?.Count() ?? 0;

            _logger.LogInformation("Scraped {Count} results", count);

            if (results != null)
                await _trailService.UpdateTrailStatusesAsync(results);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in scrape job");
            return false;
        }
    }
}
