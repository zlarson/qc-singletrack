using System.Text.Json;
using Microsoft.Extensions.Logging;
using QCSingleTrack.Application.Services;
using QCSingleTrack.Domain;

namespace QCSingleTrack.TrailStatusScraperConsole;

/// <summary>One-off data commands for loading the Trails table.</summary>
public class DataCommands
{
    private readonly TableTrailService _tables;
    private readonly ILogger<DataCommands> _logger;

    public DataCommands(TableTrailService tables, ILogger<DataCommands> logger)
    {
        _tables = tables;
        _logger = logger;
    }

    /// <summary>--migrate: copies every trail, with its status and photos, from the SQL database.</summary>
    public async Task<bool> MigrateFromSqlAsync(SqlTrailService sql)
    {
        var trails = (await sql.GetAllTrailsAsync()).ToList();
        await _tables.UpsertTrailsAsync(trails);
        _logger.LogInformation("Copied {Count} trails from SQL to Table Storage", trails.Count);
        return true;
    }

    /// <summary>
    /// --seed: loads trails from a saved GET /api/trails response, e.g. to give Azurite real data.
    /// The API doesn't return TrailNameForLookup, so the display name stands in for it.
    /// </summary>
    public async Task<bool> SeedFromApiJsonAsync(string path)
    {
        await using var stream = File.OpenRead(path);
        var dtos = await JsonSerializer.DeserializeAsync<List<ApiTrail>>(stream, new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? [];

        var trails = dtos.Select(d => new Trail
        {
            TrailId = d.TrailId,
            TrailName = d.TrailName,
            TrailNameForLookup = d.TrailName,
            Description = d.Description,
            Latitude = d.Latitude,
            Longitude = d.Longitude,
            CurrentTrailStatus = d.CurrentStatus is null && d.LastScrapedTime is null ? null : new CurrentStatus
            {
                TrailId = d.TrailId,
                Status = d.CurrentStatus,
                Source = d.CurrentSource,
                Reason = d.CurrentReason,
                LastScrapedTime = d.LastScrapedTime ?? default
            },
            Photos = (d.Photos ?? []).Select(p => new Photo { TrailId = d.TrailId, PhotoUrl = p.PhotoUrl, ThumbnailUrl = p.ThumbnailUrl, Caption = p.Caption }).ToList()
        }).ToList();

        await _tables.UpsertTrailsAsync(trails);
        _logger.LogInformation("Seeded {Count} trails from {Path}", trails.Count, path);
        return true;
    }

    private sealed record ApiTrail(
        int TrailId, string? TrailName, string? Description, decimal Latitude, decimal Longitude,
        string? CurrentStatus, string? CurrentSource, string? CurrentReason, DateTime? LastScrapedTime, List<ApiPhoto>? Photos);

    private sealed record ApiPhoto(string? PhotoUrl, string? ThumbnailUrl, string? Caption);
}
