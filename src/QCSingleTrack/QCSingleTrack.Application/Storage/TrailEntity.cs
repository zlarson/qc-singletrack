using System.Globalization;
using System.Text.Json;
using Azure;
using Azure.Data.Tables;
using QCSingleTrack.Domain;

namespace QCSingleTrack.Application.Storage;

/// <summary>
/// One row per trail in the Trails table. The current status is one-to-one with the trail, so it lives on the
/// same row, and the few photos are stored as a small JSON array.
/// </summary>
public sealed class TrailEntity : ITableEntity
{
    /// <summary>Every trail shares one partition, so the whole list is a single partition query.</summary>
    public const string Partition = "trail";

    public string PartitionKey { get; set; } = Partition;
    /// <summary>The trail ID, zero-padded so rows sort numerically. IDs appear in site URLs, so they never change.</summary>
    public string RowKey { get; set; } = "";
    public DateTimeOffset? Timestamp { get; set; }
    public ETag ETag { get; set; }

    public string? TrailName { get; set; }
    /// <summary>Name as it appears on the FORC status page; scraped results match on this, case-insensitively.</summary>
    public string? TrailNameForLookup { get; set; }
    public string? Description { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    /// <summary>Null for trails FORC doesn't report on.</summary>
    public string? Status { get; set; }
    public string? Source { get; set; }
    public string? Reason { get; set; }
    /// <summary>When the status last changed (only written on a change).</summary>
    public DateTimeOffset? LastScrapedTime { get; set; }

    public string? PhotosJson { get; set; }

    public static string RowKeyFor(int trailId) => trailId.ToString("D4", CultureInfo.InvariantCulture);

    public int TrailId => int.Parse(RowKey, CultureInfo.InvariantCulture);

    public static TrailEntity FromTrail(Trail trail) => new()
    {
        RowKey = RowKeyFor(trail.TrailId),
        TrailName = trail.TrailName,
        TrailNameForLookup = trail.TrailNameForLookup,
        Description = trail.Description,
        Latitude = (double)trail.Latitude,
        Longitude = (double)trail.Longitude,
        Status = trail.CurrentTrailStatus?.Status,
        Source = trail.CurrentTrailStatus?.Source,
        Reason = trail.CurrentTrailStatus?.Reason,
        // SQL stored UTC without a kind; make it explicit.
        LastScrapedTime = trail.CurrentTrailStatus is { } s ? new DateTimeOffset(DateTime.SpecifyKind(s.LastScrapedTime, DateTimeKind.Utc)) : null,
        PhotosJson = trail.Photos is { Count: > 0 } photos
            ? JsonSerializer.Serialize(photos.Select(p => new StoredPhoto(p.PhotoUrl, p.ThumbnailUrl, p.Caption)))
            : null
    };

    public Trail ToTrail()
    {
        var id = TrailId;
        var photos = string.IsNullOrEmpty(PhotosJson)
            ? new List<Photo>()
            : (JsonSerializer.Deserialize<List<StoredPhoto>>(PhotosJson) ?? [])
                .Select(p => new Photo { TrailId = id, PhotoUrl = p.Url, ThumbnailUrl = p.ThumbnailUrl, Caption = p.Caption })
                .ToList();

        var trail = new Trail
        {
            TrailId = id,
            TrailName = TrailName,
            TrailNameForLookup = TrailNameForLookup,
            Description = Description,
            Latitude = (decimal)Latitude,
            Longitude = (decimal)Longitude,
            Photos = photos
        };

        if (Status is not null || LastScrapedTime is not null)
        {
            trail.CurrentTrailStatus = new CurrentStatus
            {
                TrailId = id,
                Status = Status,
                Source = Source,
                Reason = Reason,
                LastScrapedTime = LastScrapedTime?.UtcDateTime ?? default
            };
        }

        return trail;
    }

    private sealed record StoredPhoto(string? Url, string? ThumbnailUrl, string? Caption);
}
