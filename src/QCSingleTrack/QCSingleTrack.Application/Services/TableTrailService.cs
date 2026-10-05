using Azure;
using Azure.Data.Tables;
using Microsoft.Extensions.Logging;
using QCSingleTrack.Application.Storage;
using QCSingleTrack.Domain;

namespace QCSingleTrack.Application.Services;

/// <summary>Trails stored in Azure Table Storage, one row per trail (see <see cref="TrailEntity"/>).</summary>
public sealed class TableTrailService : ITrailService
{
    private readonly TableClient _table;
    private readonly ILogger<TableTrailService> _logger;

    public TableTrailService(TableClient table, ILogger<TableTrailService> logger)
    {
        _table = table;
        _logger = logger;
    }

    public async Task<IEnumerable<Trail>> GetAllTrailsAsync()
    {
        var entities = await LoadAllAsync();
        return entities.Select(e => e.ToTrail()).ToList();
    }

    public async Task<Trail?> GetTrailByIdAsync(int id)
    {
        var response = await _table.GetEntityIfExistsAsync<TrailEntity>(TrailEntity.Partition, TrailEntity.RowKeyFor(id));
        return response.HasValue ? response.Value!.ToTrail() : null;
    }

    public async Task UpdateTrailStatusesAsync(IEnumerable<ScrapedTrailResult> results)
    {
        if (results == null) return;

        // There are only a handful of trails, so load them all and match names in memory.
        var trails = await LoadAllAsync();
        var nextId = trails.Count == 0 ? 1 : trails.Max(t => t.TrailId) + 1;
        var comparer = StringComparer.OrdinalIgnoreCase;

        foreach (var result in results)
        {
            var name = result.TrailName?.Trim();
            if (string.IsNullOrWhiteSpace(name)) continue;

            var trail = trails.FirstOrDefault(t => comparer.Equals(t.TrailNameForLookup, name));
            if (trail == null)
            {
                trail = new TrailEntity
                {
                    RowKey = TrailEntity.RowKeyFor(nextId++),
                    TrailName = name,
                    TrailNameForLookup = name,
                    Status = result.Status,
                    Source = "FORC",
                    Reason = result.Reason,
                    LastScrapedTime = DateTimeOffset.UtcNow
                };
                await _table.AddEntityAsync(trail);
                trails.Add(trail);
                _logger.LogInformation("Added new trail {TrailName} as {TrailId}", name, trail.TrailId);
            }
            else if (trail.Status != result.Status || trail.Reason != result.Reason)
            {
                // Only write on a change, so LastScrapedTime records when the status changed.
                trail.Status = result.Status;
                trail.Source = "FORC";
                trail.Reason = result.Reason;
                trail.LastScrapedTime = DateTimeOffset.UtcNow;
                var response = await _table.UpdateEntityAsync(trail, trail.ETag, TableUpdateMode.Replace);
                trail.ETag = response.Headers.ETag ?? trail.ETag;
                _logger.LogInformation("{TrailName} is now {Status}", trail.TrailName, trail.Status);
            }
        }
    }

    /// <summary>Writes whole trails, replacing any existing rows with the same IDs. Used to copy or seed data.</summary>
    public async Task UpsertTrailsAsync(IEnumerable<Trail> trails)
    {
        await _table.CreateIfNotExistsAsync();
        foreach (var trail in trails)
        {
            await _table.UpsertEntityAsync(TrailEntity.FromTrail(trail), TableUpdateMode.Replace);
        }
    }

    private async Task<List<TrailEntity>> LoadAllAsync()
    {
        var entities = new List<TrailEntity>();
        try
        {
            await foreach (var entity in _table.QueryAsync<TrailEntity>(e => e.PartitionKey == TrailEntity.Partition))
            {
                entities.Add(entity);
            }
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            _logger.LogWarning("Table {Table} doesn't exist yet", _table.Name);
        }
        return entities;
    }
}
