using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QCSingleTrack.Domain;
using QCSingleTrack.Infrastructure.Data;

namespace QCSingleTrack.Application.Services;

public class TrailService : ITrailService
{
    private readonly IDbContextFactory<TrailStatusDbContext> _dbFactory;

    public TrailService(IDbContextFactory<TrailStatusDbContext> dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task<Trail?> GetTrailByIdAsync(int id)
    {
        await using var db = _dbFactory.CreateDbContext();
        return await db.Trails.Include(t => t.CurrentTrailStatus).FirstOrDefaultAsync(t => t.TrailId == id);
    }

    public async Task<IEnumerable<Trail>> GetAllTrailsAsync()
    {
        await using var db = _dbFactory.CreateDbContext();
        return await db.Trails.Include(t => t.CurrentTrailStatus).ToListAsync();
    }

    public async Task UpdateTrailStatusesAsync(IEnumerable<ScrapedTrailResult> results)
    {
        if (results == null) return;

        await using var db = _dbFactory.CreateDbContext();

        // Normalize and collect names from the results
        var names = results
            .Select(r => r.TrailName?.Trim())
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        // Load existing trails that match any of the scraped names, include current status
        var existingTrails = await db.Trails
            .Include(t => t.CurrentTrailStatus)
            .Where(t => names.Contains(t.TrailName!))
            .ToListAsync();

        var comparer = StringComparer.OrdinalIgnoreCase;

        foreach (var result in results)
        {
            var name = result.TrailName?.Trim();

            if (string.IsNullOrWhiteSpace(name)) continue;

            // Try find an existing trail (case-insensitive)
            var trail = existingTrails.FirstOrDefault(t => comparer.Equals(t.TrailName, name));

            if (trail == null)
            {
                // Create a new trail and attach a CurrentTrailStatus entry
                trail = new Trail
                {
                    TrailName = name
                };

                trail.CurrentTrailStatus = new CurrentStatus
                {
                    Status = result.Status,
                    Source = "FORC",
                    Reason = result.Reason,
                    LastScrapedTime = DateTime.UtcNow
                };

                db.Trails.Add(trail);
                existingTrails.Add(trail);
            }
            else
            {
                // Update existing trail's current status
                if (trail.CurrentTrailStatus == null)
                {
                    trail.CurrentTrailStatus = new CurrentStatus
                    {
                        Status = result.Status,
                        Source = "FORC",
                        Reason = result.Reason,
                        LastScrapedTime = DateTime.UtcNow
                    };
                    db.CurrentStatuses.Add(trail.CurrentTrailStatus);
                }
                else
                {
                    trail.CurrentTrailStatus.Status = result.Status;
                    trail.CurrentTrailStatus.Source = "FORC";
                    trail.CurrentTrailStatus.Reason = result.Reason;
                    trail.CurrentTrailStatus.LastScrapedTime = DateTime.UtcNow;

                    db.CurrentStatuses.Update(trail.CurrentTrailStatus);
                }

                db.Trails.Update(trail);
            }
        }

        await db.SaveChangesAsync();
    }
}
