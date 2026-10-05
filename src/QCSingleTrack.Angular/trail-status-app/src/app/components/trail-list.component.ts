import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, DestroyRef, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe, Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { TrailService } from '../services/trail.service';
import { MapService } from '../services/map.service';
import { RegionalWeatherService } from '../services/regional-weather.service';
import { BackdropService } from '../services/backdrop.service';
import { TrailDto, TrailPhotoDto } from '../models/trail-dto.model';
import { DayWeatherDto, WeatherDto } from '../models/weather-dto.model';
import { byStatusThenName, statusDetail, statusDotClass, statusOf, statusSince, statusTextClass } from '../models/trail-status';

/** Matches Tailwind's lg breakpoint, where details sit beside the list instead of in a sheet. */
const DESKTOP_MIN_WIDTH = 1024;

interface RainDay {
  label: string;
  inches: number;
}

@Component({
  selector: 'app-trail-list',
  imports: [DecimalPipe],
  templateUrl: './trail-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager
})
export class TrailListComponent implements OnInit, OnDestroy {
  private readonly trailService = inject(TrailService);
  private readonly mapService = inject(MapService);
  private readonly regionalWeather = inject(RegionalWeatherService);
  private readonly backdrop = inject(BackdropService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  /** The page title from index.html, restored when no trail is open. */
  private readonly defaultTitle = this.title.getTitle();

  @ViewChild('map') private mapEl?: ElementRef<HTMLElement>;

  trails: TrailDto[] = [];
  loading = true;
  error: string | null = null;

  selectedTrail: TrailDto | null = null;
  sheetOpen = false;
  weather: WeatherDto | null = null;
  weatherLoading = false;
  weatherError = false;
  linkCopied = false;

  now = new Date();

  selectedImage: TrailPhotoDto | null = null;
  currentImageIndex = -1;

  private routeTrailId: number | null = null;
  private openedFromList = false;
  private clockTimer?: ReturnType<typeof setInterval>;
  private mapTimers: ReturnType<typeof setTimeout>[] = [];

  readonly statusDetail = statusDetail;
  readonly statusDotClass = statusDotClass;
  readonly statusTextClass = statusTextClass;
  readonly statusOf = statusOf;

  ngOnInit(): void {
    this.loadTrails();
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      this.routeTrailId = id ? parseInt(id, 10) : null;
      this.applyRoute();
    });
    this.clockTimer = setInterval(() => (this.now = new Date()), 60_000);
  }

  ngOnDestroy(): void {
    this.title.setTitle(this.defaultTitle);
    this.backdrop.status.set(null);
    clearInterval(this.clockTimer);
    this.mapTimers.forEach(clearTimeout);
    this.mapService.destroy();
    this.lockScroll(false);
  }

  private loadTrails(): void {
    this.loading = true;
    this.error = null;
    this.trailService.getTrails().subscribe({
      next: trails => {
        this.trails = (trails || []).sort(byStatusThenName);
        this.loading = false;
        this.applyRoute();
        this.loadRegionalWeather();
      },
      error: err => {
        this.error = "Couldn't load trail status. Check your connection and try again.";
        this.loading = false;
        console.error('Error loading trails:', err);
      }
    });
  }

  retry(): void {
    this.loadTrails();
  }

  // ---- List ----

  get openCount(): number {
    return this.trails.filter(t => statusOf(t) === 'Open').length;
  }

  /** The most recent status change, e.g. "Sunderbruch Park closed Oct 2". */
  get latestChange(): string | null {
    let latest: { trail: TrailDto; since: Date } | null = null;
    for (const trail of this.trails) {
      const since = statusSince(trail, this.now);
      if (since && (!latest || since > latest.since)) latest = { trail, since };
    }
    if (!latest) return null;
    const verb = statusOf(latest.trail) === 'Freeze/Thaw' ? 'went freeze/thaw' : statusOf(latest.trail).toLowerCase();
    return `${latest.trail.trailName} ${verb} ${this.relativeDay(latest.since)}`;
  }

  get regionalRain(): string | null {
    const weather = this.regionalWeather.weather();
    if (!weather) return null;
    const days = this.rainDays(weather);
    const total = days.reduce((sum, d) => sum + d.inches, 0);
    return total < 0.01 ? `No rain in ${days.length} days` : `${total.toFixed(1)}" rain in ${days.length} days`;
  }

  private loadRegionalWeather(): void {
    const reference = this.trails.find(t => t.latitude && t.longitude);
    if (reference) this.regionalWeather.load(reference.trailId);
  }

  // ---- Selection and routing ----

  openTrail(trail: TrailDto): void {
    this.openedFromList = true;
    // Replace rather than push when switching trails, so closing always returns to the list.
    this.router.navigate(['/trails', trail.trailId], { replaceUrl: this.routeTrailId !== null });
  }

  closeSheet(): void {
    if (this.openedFromList) {
      this.location.back();
    } else {
      this.router.navigate(['/'], { replaceUrl: true });
    }
  }

  private applyRoute(): void {
    if (this.loading) return;

    if (this.routeTrailId === null) {
      this.openedFromList = false;
      this.sheetOpen = false;
      this.title.setTitle(this.defaultTitle);
      this.backdrop.status.set(null);
      this.lockScroll(false);
      return;
    }

    const trail = this.trails.find(t => t.trailId === this.routeTrailId);
    if (!trail) {
      this.router.navigate(['/'], { replaceUrl: true });
      return;
    }
    this.select(trail);
  }

  private select(trail: TrailDto): void {
    const changed = this.selectedTrail !== trail;
    this.selectedTrail = trail;
    this.sheetOpen = true;
    this.title.setTitle(`${trail.trailName} | QCBikeTrails`);
    this.backdrop.status.set(statusOf(trail));
    this.lockScroll(!this.isDesktop());
    if (!changed) return;

    this.loadWeather(trail);
    this.mapTimers.forEach(clearTimeout);
    this.mapTimers = [
      setTimeout(() => this.mapEl && this.mapService.showTrail(this.mapEl.nativeElement, trail)),
      // The sheet slides up over 300ms; let Leaflet re-measure once it lands.
      setTimeout(() => this.mapService.refreshSize(), 350)
    ];
  }

  private loadWeather(trail: TrailDto): void {
    this.weather = null;
    this.weatherError = false;
    this.weatherLoading = true;
    this.trailService.getTrailWeather(trail.trailId).subscribe({
      next: data => {
        if (this.selectedTrail !== trail) return;
        this.weather = data;
        this.weatherLoading = false;
      },
      error: err => {
        if (this.selectedTrail !== trail) return;
        this.weatherError = true;
        this.weatherLoading = false;
        console.error('Error loading weather:', err);
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedImage) this.closeImageModal();
    else if (this.sheetOpen && !this.isDesktop()) this.closeSheet();
  }

  private isDesktop(): boolean {
    return window.innerWidth >= DESKTOP_MIN_WIDTH;
  }

  private lockScroll(lock: boolean): void {
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  // ---- Details ----

  get selectedSince(): string | null {
    if (!this.selectedTrail) return null;
    const since = statusSince(this.selectedTrail, this.now);
    return since ? `since ${this.relativeDay(since)}` : null;
  }

  get selectedRain(): RainDay[] {
    return this.weather ? this.rainDays(this.weather) : [];
  }

  get selectedRainTotal(): number {
    return this.selectedRain.reduce((sum, d) => sum + d.inches, 0);
  }

  rainBarHeight(inches: number): number {
    const max = Math.max(1, ...this.selectedRain.map(d => d.inches));
    return inches > 0 ? Math.max(6, Math.round((inches / max) * 48)) : 3;
  }

  directionsUrl(trail: TrailDto): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${trail.latitude},${trail.longitude}`;
  }

  async share(trail: TrailDto): Promise<void> {
    const url = `${window.location.origin}/trails/${trail.trailId}`;
    const status = statusOf(trail).toLowerCase();
    if (navigator.share) {
      try {
        await navigator.share({ title: `${trail.trailName} is ${status}`, text: `${trail.trailName} is ${status} on QC Bike Trails`, url });
      } catch {
        // The user dismissed the share sheet.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      this.linkCopied = true;
      setTimeout(() => (this.linkCopied = false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  }

  formatTime(localIso: string): string {
    // Open-Meteo returns local wall-clock time without a zone, which Date parses as local.
    return new Date(localIso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  private rainDays(weather: WeatherDto): RainDay[] {
    const days: DayWeatherDto[] = [...weather.previousDays].sort((a, b) => a.date.localeCompare(b.date));
    return [
      ...days.map(d => ({ label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }), inches: d.averagePrecipitation })),
      { label: 'Today', inches: weather.today.averagePrecipitation }
    ];
  }

  private relativeDay(date: Date): string {
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const days = Math.round((startOfDay(this.now) - startOfDay(date)) / 86_400_000);
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ---- Photo lightbox ----

  openImageModal(index: number): void {
    const photos = this.selectedTrail?.photos;
    if (!photos?.[index]) return;
    this.selectedImage = photos[index];
    this.currentImageIndex = index;
  }

  closeImageModal(): void {
    this.selectedImage = null;
    this.currentImageIndex = -1;
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    this.openImageModal(this.currentImageIndex + 1);
  }

  previousImage(event: Event): void {
    event.stopPropagation();
    this.openImageModal(this.currentImageIndex - 1);
  }
}
