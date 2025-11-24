using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QCSingleTrack.Domain;

namespace QCSingleTrack.Infrastructure.Data.Configurations;

public class CurrentTrailStatusConfiguration : IEntityTypeConfiguration<CurrentStatus>
{
    public void Configure(EntityTypeBuilder<CurrentStatus> builder)
    {
        builder.ToTable("CurrentStatus");
        builder.HasKey(s => s.TrailId);

        builder.Property(s => s.Status).HasMaxLength(50);
        builder.Property(s => s.Source).HasMaxLength(50);
        builder.Property(s => s.Reason).HasMaxLength(1000);
        builder.Property(s => s.LastScrapedTime).IsRequired();

        // Configure one-to-one relationship with Trail
        builder.HasOne(s => s.Trail)
            .WithOne(t => t.CurrentTrailStatus)
            .HasForeignKey<CurrentStatus>(s => s.TrailId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
