using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Options;
using System;

namespace QCSingleTrack.Infrastructure.Data.DesignTime;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<TrailStatusDbContext>
{
    public TrailStatusDbContext CreateDbContext(string[] args)
    {
        var builder = new DbContextOptionsBuilder<TrailStatusDbContext>();

        // Prefer environment variable (matches local.settings.json -> Values via Functions host)
        var conn = @"Server=tcp:qc-singletrack-sql.database.windows.net,1433;Initial Catalog=qc-singletrack-db;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;Authentication=""Active Directory Default"";";// Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") ?? "Server=(localdb)\\mssqllocaldb;Database=QCSingleTrack;Trusted_Connection=True;";
        //var conn = @"Server=(localdb)\MSSQLLocalDB;Database=QCSingleTrack;Trusted_Connection=True;";

        Console.WriteLine("conn = " + conn);

        builder.UseSqlServer(conn);
        return new TrailStatusDbContext(builder.Options);
    }
}
