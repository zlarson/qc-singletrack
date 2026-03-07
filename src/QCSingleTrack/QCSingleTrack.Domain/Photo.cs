namespace QCSingleTrack.Domain
{
    public class Photo
    {
        public int Id { get; set; }
        public int TrailId { get; set; }
        public string? PhotoUrl { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? Caption { get; set; }
    }
}
