import { Component, ChangeDetectionStrategy, HostListener, OnDestroy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RegionalWeatherService } from '../services/regional-weather.service';

@Component({
  selector: 'app-header',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <header
      class="sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)] transition-[background-color,border-color,backdrop-filter] duration-300"
      [class]="scrolled ? 'border-line bg-ink/85 backdrop-blur-md' : 'border-transparent bg-ink/40'">
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

  /** The bar stays see-through over the top of the page and turns solid once content scrolls under it. */
  scrolled = false;

  @HostListener('window:scroll')
  onScroll(): void {
    const scrolled = window.scrollY > 8;
    if (scrolled !== this.scrolled) this.scrolled = scrolled;
  }

  get sunsetLabel(): string | null {
    return this.regionalWeather.sunsetLabel(this.now);
  }

  ngOnDestroy(): void {
    clearInterval(this.clockTimer);
  }
}
