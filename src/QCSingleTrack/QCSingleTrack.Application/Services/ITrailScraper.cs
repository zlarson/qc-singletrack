using System.Collections.Generic;
using System.Threading.Tasks;

namespace QCSingleTrack.Application.Services;

public interface ITrailScraper
{
    Task<IEnumerable<ScrapedTrailResult>> ScrapeForcAsync();
}
