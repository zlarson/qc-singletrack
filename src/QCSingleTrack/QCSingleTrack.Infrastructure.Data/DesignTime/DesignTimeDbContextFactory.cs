using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace QCSingleTrack.Infrastructure.Data.DesignTime;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<TrailStatusDbContext>
{
    public TrailStatusDbContext CreateDbContext(string[] args)
    {
        var builder = new DbContextOptionsBuilder<TrailStatusDbContext>();

        // Prefer environment variable (matches local.settings.json -> Values via Functions host)
        var conn = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                   ?? "Server=(localdb)\\mssqllocaldb;Database=QCSingleTrack;Trusted_Connection=True;";

        builder.UseSqlServer(conn);
        return new TrailStatusDbContext(builder.Options);
    }
}
