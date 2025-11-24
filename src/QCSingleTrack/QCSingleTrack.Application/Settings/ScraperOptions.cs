namespace QCSingleTrack.Application.Settings;

public class ScraperOptions
{
    /// <summary>
    /// Base URL to use when scraping trails. Example: "https://www.qcforc.org/content.php"
    /// </summary>
    public string BaseUrl { get; set; } = string.Empty;
}