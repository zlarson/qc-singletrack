using AngleSharp.Dom;
using AngleSharp.Html.Parser;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using QCSingleTrack.Application.Settings;
using System.Net.Http.Headers;

namespace QCSingleTrack.Application.Services;

public class AngleSharpTrailScraper : ITrailScraper
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AngleSharpTrailScraper> _logger;
    private readonly ScraperOptions _options;

    public AngleSharpTrailScraper(IHttpClientFactory httpClientFactory, ILogger<AngleSharpTrailScraper> logger, IOptions<ScraperOptions> options)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _options = options.Value;
    }

    public async Task<IEnumerable<ScrapedTrailResult>> ScrapeForcAsync()
    {
        var results = new List<ScrapedTrailResult>();

        try
        {
            var client = _httpClientFactory.CreateClient("ScraperClient");
            const int maxRetries = 5;
            int attempt = 0;

            HttpResponseMessage res = null!;
            bool success = false;

            while (attempt < maxRetries && !success)
            {
                attempt++;
                try
                {
                    using var req = new HttpRequestMessage(HttpMethod.Get, "/");

                    res = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);

                    if (res.IsSuccessStatusCode)
                    {
                        success = true;
                    }
                    else
                    {
                        res.Dispose();
                        if (attempt < maxRetries)
                        {
                            // Exponential backoff: 5s, 10s, 20s, 40s
                            var delay = TimeSpan.FromSeconds(5 * Math.Pow(2, attempt - 1));
                            _logger.LogWarning("Scrape attempt {Attempt}/{MaxRetries} failed with status {StatusCode}. Retrying after {DelayMs}ms...", 
                                attempt, maxRetries, res.StatusCode, delay.TotalMilliseconds);
                            await Task.Delay(delay);
                        }
                    }
                }
                catch (HttpRequestException ex) when (attempt < maxRetries)
                {
                    var delay = TimeSpan.FromSeconds(5 * Math.Pow(2, attempt - 1));
                    _logger.LogWarning(ex, "Scrape attempt {Attempt}/{MaxRetries} failed with exception. Retrying after {DelayMs}ms...", 
                        attempt, maxRetries, delay.TotalMilliseconds);
                    await Task.Delay(delay);
                }
            }

            if (!success)
            {
                LogFinalFailure(res, maxRetries);
                res.Dispose();
                return results;
            }

            using (res)
            {
                results = await ParseHtmlResponse(res, client);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error scraping FORC");
        }

        return results;
    }

    private async Task<List<ScrapedTrailResult>> ParseHtmlResponse(HttpResponseMessage res, HttpClient client)
    {
        var results = new List<ScrapedTrailResult>();
        
        var html = await res.Content.ReadAsStringAsync();
        var parser = new HtmlParser();
        var doc = await parser.ParseDocumentAsync(html);

        var containerElement = doc.QuerySelector("#trailblocks") ?? doc.QuerySelector("div#trailblocks");

        IHtmlCollection<IElement>? blocks;
        if (containerElement is not null)
        {
            blocks = containerElement.QuerySelectorAll("div#trailblock");
            if (blocks is null || blocks.Length == 0)
            {
                blocks = containerElement.QuerySelectorAll(".trailblock, div[id='trailblock']");
            }
        }
        else
        {
            blocks = doc.QuerySelectorAll("div#trailblock");
            if (blocks is null || blocks.Length == 0)
            {
                blocks = doc.QuerySelectorAll(".trailblock, div[id='trailblock']");
            }
        }

        if (blocks is null || blocks.Length == 0)
        {
            _logger.LogWarning("No trail blocks found on page {Url}", client.BaseAddress);
            return results;
        }

        foreach (var block in blocks)
        {
            var parkEl = block.QuerySelector("p#park");
            var reasonEl = block.QuerySelector("p#status");

            var name = parkEl?.TextContent?.Trim();
            var reason = reasonEl?.TextContent?.Trim();

            // Derive the actual status from the block's CSS class
            var cls = block.GetAttribute("class");
            string? status = null;

            if (!string.IsNullOrWhiteSpace(cls))
            {
                if (cls.IndexOf("open", StringComparison.OrdinalIgnoreCase) >= 0) status = "Open";
                else if (cls.IndexOf("freeze_thaw", StringComparison.OrdinalIgnoreCase) >= 0) status = "Freeze/Thaw";
                else if (cls.IndexOf("caution", StringComparison.OrdinalIgnoreCase) >= 0) status = "Caution";
                else if (cls.IndexOf("closed", StringComparison.OrdinalIgnoreCase) >= 0) status = "Closed";
            }

            // Fallback: if we couldn't determine status from class, try the status paragraph text
            if (string.IsNullOrWhiteSpace(status) && !string.IsNullOrWhiteSpace(reason))
            {
                status = reason;
                // clear reason since it was actually the status
                //reason = null;
            }

            // If reason is the same as status, clear reason - we only keep reason when it's different
            if (!string.IsNullOrWhiteSpace(status) && !string.IsNullOrWhiteSpace(reason))
            {
                if (string.Equals(status.Trim(), reason.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    reason = null;
                }
            }

            if (string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(status)) continue;

            results.Add(new ScrapedTrailResult
            {
                TrailName = name ?? string.Empty,
                Status = status,
                Reason = reason
            });
        }

        return results;
    }

    private void LogFinalFailure(HttpResponseMessage res, int maxRetries)
    {
        var finalUri = res.RequestMessage?.RequestUri?.ToString() ?? "(unknown)";
        var status = (int)res.StatusCode;

        // Collect response headers (and a few request headers) into a single string
        static string HeadersToString(HttpHeaders headers) =>
            string.Join("; ", headers.Select(h => $"{h.Key}={string.Join(",", h.Value)}"));

        var respHeaders = HeadersToString(res.Headers);
        var contentHeaders = HeadersToString(res.Content.Headers);

        // Read a small body snippet (often contains "Access Denied", "Cloudflare", "Akamai", etc.)
        string bodySnippet = "";
        try
        {
            var body = res.Content.ReadAsStringAsync().Result;
            bodySnippet = body.Length <= 800 ? body : body.Substring(0, 800);
        }
        catch (Exception ex)
        {
            bodySnippet = $"(failed to read body: {ex.GetType().Name}: {ex.Message})";
        }

        // Useful tell" headers to log explicitly (when present)
        string? server = res.Headers.Server?.ToString();
        res.Headers.TryGetValues("cf-ray", out var cfRay);
        res.Headers.TryGetValues("cf-cache-status", out var cfCacheStatus);
        res.Headers.TryGetValues("akamai-grn", out var akamaiGrn);
        res.Headers.TryGetValues("x-akamai-request-id", out var akamaiReqId);
        res.Headers.TryGetValues("x-sucuri-id", out var sucuriId);
        res.Headers.TryGetValues("x-request-id", out var requestId);
        res.Headers.TryGetValues("retry-after", out var retryAfter);

        _logger.LogWarning(
            "Scrape blocked after {MaxRetries} attempts. status={StatusInt} {StatusCode} url={Url} server={Server} " +
            "cf-ray={CfRay} cf-cache={CfCache} akamai-reqid={AkamaiReqId} sucuri={SucuriId} request-id={RequestId} retry-after={RetryAfter} " +
            "respHeaders=[{RespHeaders}] contentHeaders=[{ContentHeaders}] bodySnippet=[{BodySnippet}]",
            maxRetries, status, res.StatusCode, finalUri, server ?? "",
            cfRay != null ? string.Join(",", cfRay) : "",
            cfCacheStatus != null ? string.Join(",", cfCacheStatus) : "",
            akamaiReqId != null ? string.Join(",", akamaiReqId) : (akamaiGrn != null ? string.Join(",", akamaiGrn) : ""),
            sucuriId != null ? string.Join(",", sucuriId) : "",
            requestId != null ? string.Join(",", requestId) : "",
            retryAfter != null ? string.Join(",", retryAfter) : "",
            respHeaders, contentHeaders, bodySnippet
        );
    }
}
