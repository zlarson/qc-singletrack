using System.Collections.Generic;

namespace QCSingleTrack.Application.Services;

public interface IWeatherCodeLookup
{
    /// <summary>
    /// Returns the human-readable description for the provided WMO weather code.
    /// Returns null if the code is unknown.
    /// </summary>
    string? GetDescription(int code);
}

public class WeatherCodeLookup : IWeatherCodeLookup
{
    private static readonly IReadOnlyDictionary<int, string> _map = new Dictionary<int, string>
    {
        // 00-19
        [0] = "Cloud development not observed or not observable",
        [1] = "Clouds generally dissolving or becoming less developed",
        [2] = "State of sky on the whole unchanged",
        [3] = "Clouds generally forming or developing",
        [4] = "Visibility reduced by smoke (e.g. veldt or forest fires, industrial smoke or volcanic ashes)",
        [5] = "Haze",
        [6] = "Widespread dust in suspension in the air, not raised by wind at or near the station at the time of observation",
        [7] = "Dust or sand raised by wind at or near the station (no well developed dust whirl(s) or sand whirl(s), and no duststorm or sandstorm seen)",
        [8] = "Well developed dust whirl(s) or sand whirl(s) seen at or near the station during the preceding hour or at the time of observation, but no duststorm or sandstorm",
        [9] = "Duststorm or sandstorm within sight at the time of observation, or at the station during the preceding hour",
        [10] = "Mist",
        [11] = "Patches of shallow fog or ice fog at the station (not deeper than about 2 metres on land or 10 metres at sea)",
        [12] = "More or less continuous shallow fog or ice fog",
        [13] = "Lightning visible, no thunder heard",
        [14] = "Precipitation within sight, not reaching the ground or the surface of the sea",
        [15] = "Precipitation within sight, reaching the ground or the surface of the sea, but distant (> 5 km from station)",
        [16] = "Precipitation within sight, reaching the ground or the surface of the sea, near to but not at the station",
        [17] = "Thunderstorm, but no precipitation at the time of observation",
        [18] = "Squalls at or within sight of the station during the preceding hour or at the time of observation",
        [19] = "Funnel cloud(s) (tornado cloud or water-spout)",

        // 20-29
        [20] = "Drizzle (not freezing) or snow grains, not falling as shower(s)",
        [21] = "Rain (not freezing)",
        [22] = "Snow",
        [23] = "Rain and snow or ice pellets",
        [24] = "Freezing drizzle or freezing rain",
        [25] = "Shower(s) of rain",
        [26] = "Shower(s) of snow, or of rain and snow",
        [27] = "Shower(s) of hail, or of rain and hail",
        [28] = "Fog or ice fog",
        [29] = "Thunderstorm (with or without precipitation)",

        // 30-39 blowing/ drifting snow and duststorm details
        [30] = "Slight or moderate duststorm or sandstorm - has decreased during the preceding hour",
        [31] = "Slight or moderate duststorm or sandstorm - no appreciable change during the preceding hour",
        [32] = "Slight or moderate duststorm or sandstorm - has begun or has increased during the preceding hour",
        [33] = "Severe duststorm or sandstorm - has decreased during the preceding hour",
        [34] = "Severe duststorm or sandstorm - no appreciable change during the preceding hour",
        [35] = "Severe duststorm or sandstorm - has begun or has increased during the preceding hour",
        [36] = "Slight or moderate blowing snow (generally low, below eye level)",
        [37] = "Heavy drifting snow",
        [38] = "Slight or moderate blowing snow (generally high, above eye level)",
        [39] = "Heavy drifting snow",

        // 40-49 fog variations
        [40] = "Fog or ice fog at a distance at the time of observation, but not at the station during the preceding hour (fog extends above observer level)",
        [41] = "Fog or ice fog in patches",
        [42] = "Fog or ice fog, sky visible - has become thinner during the preceding hour",
        [43] = "Fog or ice fog, sky invisible",
        [44] = "Fog or ice fog, sky visible - no appreciable change during the preceding hour",
        [45] = "Fog or ice fog, sky invisible",
        [46] = "Fog or ice fog, sky visible - has begun or become thicker during the preceding hour",
        [47] = "Fog or ice fog, sky invisible",
        [48] = "Fog, depositing rime, sky visible",
        [49] = "Fog, depositing rime, sky invisible",

        // 50-59 Drizzle
        [50] = "Drizzle, not freezing, intermittent (slight at time of observation)",
        [51] = "Drizzle, not freezing, continuous",
        [52] = "Drizzle, not freezing, intermittent (moderate at time of observation)",
        [53] = "Drizzle, not freezing, continuous",
        [54] = "Drizzle, not freezing, intermittent (heavy/dense at time of observation)",
        [55] = "Drizzle, not freezing, continuous",
        [56] = "Drizzle, freezing, slight",
        [57] = "Drizzle, freezing, moderate or heavy (dense)",
        [58] = "Drizzle and rain, slight",
        [59] = "Drizzle and rain, moderate or heavy",

        // 60-69 Rain
        [60] = "Rain, not freezing, intermittent (slight at time of observation)",
        [61] = "Rain, not freezing, continuous",
        [62] = "Rain, not freezing, intermittent (moderate at time of observation)",
        [63] = "Rain, not freezing, continuous",
        [64] = "Rain, not freezing, intermittent (heavy at time of observation)",
        [65] = "Rain, not freezing, continuous",
        [66] = "Rain, freezing, slight",
        [67] = "Rain, freezing, moderate or heavy (dense)",
        [68] = "Rain or drizzle and snow, slight",
        [69] = "Rain or drizzle and snow, moderate or heavy",

        // 70-79 Solid precipitation
        [70] = "Intermittent fall of snowflakes (slight at time of observation)",
        [71] = "Continuous fall of snowflakes",
        [72] = "Intermittent fall of snowflakes (moderate at time of observation)",
        [73] = "Continuous fall of snowflakes",
        [74] = "Intermittent fall of snowflakes (heavy at time of observation)",
        [75] = "Continuous fall of snowflakes (heavy)",
        [76] = "Diamond dust (with or without fog)",
        [77] = "Snow grains (with or without fog)",
        [78] = "Isolated star-like snow crystals (with or without fog)",
        [79] = "Ice pellets",

        // 80-99 Showery precipitation / thunderstorms
        [80] = "Rain shower(s), slight",
        [81] = "Rain shower(s), moderate or heavy",
        [82] = "Rain shower(s), violent",
        [83] = "Shower(s) of rain and snow mixed, slight",
        [84] = "Shower(s) of rain and snow mixed, moderate or heavy",
        [85] = "Snow shower(s), slight",
        [86] = "Snow shower(s), moderate or heavy",
        [87] = "Shower(s) of snow pellets or small hail, with or without rain and snow mixed (slight)",
        [88] = "Shower(s) of snow pellets or small hail, moderate or heavy",
        [89] = "Shower(s) of hail, with or without rain and snow mixed, not associated with thunder (slight)",
        [90] = "Shower(s) of hail, moderate or heavy",
        [91] = "Slight rain at time of observation (Thunderstorm during preceding hour but not at time of observation)",
        [92] = "Moderate or heavy rain at time of observation",
        [93] = "Slight snow, or rain and snow mixed or hail at time of observation",
        [94] = "Moderate or heavy snow, or rain and snow mixed or hail at time of observation",
        [95] = "Thunderstorm, slight or moderate, without hail but with rain and/or snow at time of observation (Thunderstorm at time of observation)",
        [96] = "Thunderstorm, slight or moderate, with hail at time of observation",
        [97] = "Thunderstorm, heavy, without hail but with rain and/or snow at time of observation",
        [98] = "Thunderstorm combined with duststorm or sandstorm at time of observation",
        [99] = "Thunderstorm, heavy, with hail at time of observation"
    };

    public string? GetDescription(int code)
    {
        return _map.TryGetValue(code, out var desc) ? desc : null;
    }
}
