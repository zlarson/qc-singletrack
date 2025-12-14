export interface DayWeatherDto {
  date: string;
  sunset: string;
  averageTemperature: number;
  averagePrecipitation: number;
  uniqueWeatherCodes: string[];
}

export interface WeatherDto {
  latitude: number;
  longitude: number;
  elevation: number;
  today: DayWeatherDto;
  previousDays: DayWeatherDto[];
}
