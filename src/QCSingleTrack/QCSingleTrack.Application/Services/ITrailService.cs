using System.Collections.Generic;
using System.Threading.Tasks;
using QCSingleTrack.Domain;

namespace QCSingleTrack.Application.Services;

public interface ITrailService
{
    Task<Trail?> GetTrailByIdAsync(int id);

    Task UpdateTrailStatusesAsync(IEnumerable<ScrapedTrailResult> results);

    Task<IEnumerable<Trail>> GetAllTrailsAsync();
}
