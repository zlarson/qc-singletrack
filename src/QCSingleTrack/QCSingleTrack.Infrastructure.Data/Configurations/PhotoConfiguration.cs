using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using QCSingleTrack.Domain;

namespace QCSingleTrack.Infrastructure.Data.Configurations;

public class PhotoConfiguration : IEntityTypeConfiguration<Photo>
{
    public void Configure(EntityTypeBuilder<Photo> builder)
    {
        builder.ToTable("Photos");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.PhotoUrl).HasMaxLength(1000);
        builder.Property(p => p.ThumbnailUrl).HasMaxLength(1000);
        builder.Property(p => p.Caption).HasMaxLength(500);

        builder.HasOne<Trail>()
            .WithMany(t => t.Photos)
            .HasForeignKey(p => p.TrailId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
