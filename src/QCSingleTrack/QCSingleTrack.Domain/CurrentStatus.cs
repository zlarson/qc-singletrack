namespace QCSingleTrack.Domain
{
    public class CurrentStatus
    {
        public int TrailId { get; set; } // PK and FK to Trail

        public string? Status { get; set; }

        public string? Source { get; set; }

        public string? Reason { get; set; }

        public DateTime LastScrapedTime { get; set; }

        // Navigation back to Trail
        public Trail? Trail { get; set; }
    }
}
