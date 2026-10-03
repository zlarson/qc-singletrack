import { Component, ChangeDetectionStrategy, OnDestroy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RegionalWeatherService } from '../services/regional-weather.service';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <header class="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <nav class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <a routerLink="/" class="flex shrink-0 items-center" aria-label="QC Bike Trails home">
          <img src="assets/logo-horizontal-white.png" alt="QC Bike Trails" class="h-7">
        </a>
        @if (sunsetLabel) {
          <span class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-card/90 px-3 py-1 text-xs">
            <i class="fa-solid fa-sun text-status-caution"></i>{{ sunsetLabel }}
          </span>
        }
      </nav>
    </header>
  `
})
export class HeaderComponent implements OnDestroy {
  private readonly regionalWeather = inject(RegionalWeatherService);
  private now = new Date();
  private readonly clockTimer = setInterval(() => (this.now = new Date()), 60_000);

  get sunsetLabel(): string | null {
    return this.regionalWeather.sunsetLabel(this.now);
  }

  ngOnDestroy(): void {
    clearInterval(this.clockTimer);
  }
}
