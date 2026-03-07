using Microsoft.EntityFrameworkCore;
using QCSingleTrack.Domain;
using QCSingleTrack.Infrastructure.Data.Configurations;

namespace QCSingleTrack.Infrastructure.Data;

public class TrailStatusDbContext : DbContext
{
    public TrailStatusDbContext(DbContextOptions<TrailStatusDbContext> options) : base(options)
    {
    }

    public DbSet<Trail> Trails { get; set; } = null!;

    public DbSet<CurrentStatus> CurrentStatuses { get; set; } = null!;

    public DbSet<Photo> Photos { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new TrailConfiguration());
        modelBuilder.ApplyConfiguration(new CurrentTrailStatusConfiguration());
        modelBuilder.ApplyConfiguration(new PhotoConfiguration());
        base.OnModelCreating(modelBuilder);
    }
}
