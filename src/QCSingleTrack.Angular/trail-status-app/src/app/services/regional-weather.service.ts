import { Injectable, inject, signal } from '@angular/core';
import { WeatherDto } from '../models/weather-dto.model';
import { TrailService } from './trail.service';

/**
 * Weather for the Quad Cities as a whole (all trails share a sunset and roughly the same rain),
 * used by the header's sunset pill and the trail list's rain summary.
 */
@Injectable({
  providedIn: 'root'
})
export class RegionalWeatherService {
  private readonly trailService = inject(TrailService);
  private loadedFor: number | null = null;

  readonly weather = signal<WeatherDto | null>(null);

  /** Loads weather using one trail's location as the reference point. Repeat calls are ignored. */
  load(referenceTrailId: number): void {
    if (this.loadedFor !== null) return;
    this.loadedFor = referenceTrailId;
    this.trailService.getTrailWeather(referenceTrailId).subscribe({
      next: data => this.weather.set(data),
      error: err => {
        this.loadedFor = null;
        console.error('Error loading regional weather:', err);
      }
    });
  }

  /** "1h 28m of light" in the last six hours before sunset, otherwise "Sunset 6:40 PM". */
  sunsetLabel(now: Date): string | null {
    const sunset = this.weather()?.today.sunset;
    if (!sunset) return null;
    // Open-Meteo returns local wall-clock time without a zone, which Date parses as local.
    const at = new Date(sunset);
    const minutesLeft = Math.round((at.getTime() - now.getTime()) / 60_000);
    if (minutesLeft <= 0 || minutesLeft > 6 * 60) {
      return `Sunset ${at.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    const h = Math.floor(minutesLeft / 60);
    const m = minutesLeft % 60;
    return `${h ? h + 'h ' : ''}${m}m of light`;
  }
}
