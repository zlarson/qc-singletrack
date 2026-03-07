using System;

namespace QCSingleTrack.Api.Models;

public class TrailPhotoDto
{
    public string? PhotoUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? Caption { get; set; }
}

public class TrailDto
{
    public int TrailId { get; set; }
    public string? TrailName { get; set; }
    public string? Description { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }

    // Current status info
    public string? CurrentStatus { get; set; }
    public string? CurrentSource { get; set; }
    public string? CurrentReason { get; set; }
    public DateTime? LastScrapedTime { get; set; }

    // Photos
    public IEnumerable<TrailPhotoDto>? Photos { get; set; }
}
