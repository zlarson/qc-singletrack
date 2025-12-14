import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { TrailService } from '../services/trail.service';
import { MapService } from '../services/map.service';
import { TrailDto, TrailPhotoDto } from '../models/trail-dto.model';
import { WeatherDto } from '../models/weather-dto.model';

@Component({
  selector: 'app-trail-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './trail-list.component.html',
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.2s ease-out;
    }

    .animate-scaleIn {
      animation: scaleIn 0.25s ease-out;
    }

    /* Custom scrollbar for gallery */
    .overflow-y-auto::-webkit-scrollbar {
      width: 8px;
    }

    .overflow-y-auto::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 10px;
    }

    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background: #555;
    }

    :host-context(.dark) .overflow-y-auto::-webkit-scrollbar-track {
      background: #374151;
    }

    :host-context(.dark) .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #6b7280;
    }

    :host-context(.dark) .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `]
})
export class TrailListComponent implements OnInit, OnDestroy, AfterViewInit {
  trails: TrailDto[] = [];
  selectedTrail: TrailDto | null = null;
  loading = true;
  error: string | null = null;
  linkCopied = false;
  mapInitialized = false;
  selectedImage: TrailPhotoDto | null = null;
  currentImageIndex: number = -1;
  weatherData: WeatherDto | null = null;
  weatherLoading = false;
  weatherError: string | null = null;

  constructor(
    private trailService: TrailService,
    private mapService: MapService,
    private router: Router,
    private route: ActivatedRoute
  ) {}  ngOnInit(): void {
    this.loadTrails();
    
    // Listen for route parameter changes
    this.route.paramMap.subscribe(params => {
      const trailId = params.get('id');
      if (trailId && this.trails.length > 0) {
        this.selectTrailById(parseInt(trailId, 10));
      }
    });
  }

  ngAfterViewInit(): void {
    // Initialize map after view is ready
    setTimeout(() => {
      this.initializeMap();
    }, 0);
  }

  ngOnDestroy(): void {
    // Clean up map resources
    this.mapService.destroy();
  }


  loadTrails(): void {
    this.loading = true;
    this.error = null;      this.trailService.getTrails().subscribe({      next: (trails) => {
        this.trails = (trails || []).sort((a, b) => a.trailName.localeCompare(b.trailName));
        
        // Check for route parameter first
        const trailId = this.route.snapshot.paramMap.get('id');
        if (trailId) {
          this.selectTrailById(parseInt(trailId, 10), false); // Don't update URL since we're already here
        }
        // Don't auto-select first trail - let user choose
        
        this.loading = false;
          // Initialize map after trails are loaded
        setTimeout(() => {
          if (!this.mapInitialized) {
            this.initializeMap();
          }
        }, 100);
      },
      error: (err) => {
        this.error = 'Failed to load trail data. Please check if the API is running.';
        this.loading = false;
        console.error('Error loading trails:', err);
      }
    });
  }
  private initializeMap(): void {
    try {      const mapElement = document.getElementById('trail-map');
      
      if (!mapElement) {
        console.error('Map element not found!');
        return;
      }
        this.mapService.initMap('trail-map');
      this.mapInitialized = true;
        if (this.trails.length > 0) {        this.mapService.addTrailMarkers(this.trails, this.selectedTrail || undefined);
      }
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }

  getGlobalStatus(): string {
    if (this.trails.length === 0) return 'No Data Available';
    
    const closedCount = this.trails.filter(t => (t.currentStatus || 'Open') === 'Closed').length;
    const cautionCount = this.trails.filter(t => (t.currentStatus || 'Open') === 'Caution').length;
    
    if (closedCount === 0 && cautionCount === 0) {
      return 'All Trails Open';
    } else if (closedCount > 0) {
      return `${closedCount} Trail${closedCount > 1 ? 's' : ''} Closed`;
    } else {
      return `${cautionCount} Trail${cautionCount > 1 ? 's' : ''} with Caution`;
    }
  }

  getOpenTrailsCount(): number {
    return this.trails.filter(t => (t.currentStatus || 'Open') === 'Open').length;
  }

  getClosedTrailsCount(): number {
    return this.trails.filter(t => (t.currentStatus || 'Open') === 'Closed').length;
  }

  getCautionTrailsCount(): number {
    return this.trails.filter(t => (t.currentStatus || 'Open') === 'Caution').length;
  }
  getAggregateCountDisplay(): string {
    if (this.trails.length === 0) return 'No trail data available';
    
    const openCount = this.getOpenTrailsCount();
    const closedCount = this.getClosedTrailsCount();
    const cautionCount = this.getCautionTrailsCount();
    
    const parts: string[] = [];
    
    if (openCount > 0) {
      parts.push(`${openCount} Open Trail${openCount > 1 ? 's' : ''}`);
    }
    if (cautionCount > 0) {
      parts.push(`${cautionCount} Caution Trail${cautionCount > 1 ? 's' : ''}`);
    }
    if (closedCount > 0) {
      parts.push(`${closedCount} Closed Trail${closedCount > 1 ? 's' : ''}`);
    }
    
    return parts.join(' & ');
  }  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Open': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-400 dark:border-green-600';
      case 'Closed': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-400 dark:border-red-600';
      case 'Caution': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-400 dark:border-yellow-600';
      case 'Freeze/Thaw': return 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 border border-cyan-400 dark:border-cyan-600';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600';
    }
  }  getTrailCardClass(status: string, isSelected: boolean = false): string {
    let baseClass = '';
    switch (status) {
      case 'Open': 
        baseClass = isSelected ? 'bg-gradient-to-r from-green-200 to-green-500 dark:from-green-800 dark:to-green-600 border-green-500 dark:border-green-400 shadow-lg transform scale-y-110' : 'bg-green-300 dark:bg-green-800 border-green-400 dark:border-green-600'; 
        break;
      case 'Closed': 
        baseClass = isSelected ? 'bg-gradient-to-r from-red-200 to-red-500 dark:from-red-800 dark:to-red-600 border-red-500 dark:border-red-400 shadow-lg transform scale-y-110' : 'bg-red-300 dark:bg-red-800 border-red-400 dark:border-red-600'; 
        break;
      case 'Caution': 
        baseClass = isSelected ? 'bg-gradient-to-r from-yellow-200 to-yellow-500 dark:from-yellow-800 dark:to-yellow-600 border-yellow-500 dark:border-yellow-400 shadow-lg transform scale-y-110' : 'bg-yellow-300 dark:bg-yellow-800 border-yellow-400 dark:border-yellow-600'; 
        break;
      case 'Freeze/Thaw': 
        baseClass = isSelected ? 'bg-gradient-to-r from-cyan-200 to-cyan-500 dark:from-cyan-800 dark:to-cyan-600 border-cyan-500 dark:border-cyan-400 shadow-lg transform scale-y-110' : 'bg-cyan-300 dark:bg-cyan-800 border-cyan-400 dark:border-cyan-600'; 
        break;
      default: 
        baseClass = isSelected ? 'bg-gradient-to-r from-gray-200 to-gray-400 dark:from-gray-700 dark:to-gray-600 border-gray-400 dark:border-gray-500 shadow-lg transform scale-y-110' : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'; 
        break;
    }
    
    return baseClass;
  }
  getStatusBannerClass(status: string): string {
    switch (status) {
      case 'Open': return 'bg-green-600';
      case 'Closed': return 'bg-red-600';
      case 'Caution': return 'bg-yellow-600';
      default: return 'bg-gray-500';
    }
  }
  getChevronClass(status: string): string {
    switch (status) {
      case 'Open': return 'text-black dark:text-white';
      case 'Closed': return 'text-black dark:text-white';
      case 'Caution': return 'text-black dark:text-white';
      default: return 'text-black dark:text-white';
    }
  }  selectTrail(trail: TrailDto): void {
    this.selectedTrail = trail;
    
    // Update URL to reflect selected trail
    this.updateUrlForSelectedTrail(trail.trailId);
    
    // Highlight trail on map
    if (this.mapInitialized) {
      this.mapService.highlightTrail(trail);
    }

    // Load weather data for selected trail
    this.loadWeatherData(trail.trailId);

    // Scroll to trail details on mobile
    this.scrollToDetailsOnMobile();
  }

  private loadWeatherData(trailId: number): void {
    this.weatherLoading = true;
    this.weatherError = null;
    this.weatherData = null;

    this.trailService.getTrailWeather(trailId).subscribe({
      next: (data) => {
        this.weatherData = data;
        this.weatherLoading = false;
      },
      error: (err) => {
        this.weatherError = 'Failed to load weather data';
        this.weatherLoading = false;
        console.error('Error loading weather:', err);
      }
    });
  }

  private scrollToDetailsOnMobile(): void {
    // Check if we're in mobile view (less than lg breakpoint - 1024px)
    if (window.innerWidth < 1024) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const detailsElement = document.getElementById('trail-details');
        if (detailsElement) {
          const headerOffset = 80; // Account for fixed header (64px) + some padding
          const elementPosition = detailsElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }

  scrollToTop(): void {
    const headerOffset = 80;
    window.scrollTo({
      top: headerOffset,
      behavior: 'smooth'
    });
  }selectTrailById(trailId: number, updateUrl: boolean = true): void {
    const trail = this.trails.find(t => t.trailId === trailId);
    if (trail) {
      this.selectedTrail = trail;
      
      if (updateUrl) {
        this.updateUrlForSelectedTrail(trailId);
      }
    } else {
      // Trail not found - redirect to trails list without ID
      console.warn(`Trail with ID ${trailId} not found`);
      if (this.trails.length > 0) {
        this.selectTrail(this.trails[0]);
      } else {
        this.router.navigate(['/trails']);
      }
    }
  }
  private updateUrlForSelectedTrail(trailId: number): void {
    // Update URL without triggering navigation
    this.router.navigate(['/trails', trailId]);
  }


  getLastUpdateTime(): Date | null {
    if (this.trails.length === 0) return null;
    
    const dates = this.trails.map(t => new Date(t.lastScrapedTime));
    return new Date(Math.max(...dates.map(d => d.getTime())));
  }

  formatLastScrapedTime(lastScrapedTime: string): string {
    try {
      const date = new Date(lastScrapedTime);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Unknown';
    }
  }

  getShareableUrl(trail: TrailDto): string {
    return `${window.location.origin}/trails/${trail.trailId}`;
  }
  async copyTrailLink(trail: TrailDto): Promise<void> {
    const url = this.getShareableUrl(trail);
    try {
      await navigator.clipboard.writeText(url);
      this.showCopyFeedback();
      console.log('Trail link copied to clipboard:', url);
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Fallback for older browsers
      this.fallbackCopyTextToClipboard(url);
      this.showCopyFeedback();
    }
  }

  private showCopyFeedback(): void {
    this.linkCopied = true;
    setTimeout(() => {
      this.linkCopied = false;
    }, 2000);
  }

  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      console.log('Fallback: Trail link copied to clipboard');
    } catch (err) {
      console.error('Fallback: Could not copy text: ', err);
    }

    document.body.removeChild(textArea);
  }

  openImageModal(photo: TrailPhotoDto, index: number): void {
    this.selectedImage = photo;
    this.currentImageIndex = index;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  closeImageModal(): void {
    this.selectedImage = null;
    this.currentImageIndex = -1;
    document.body.style.overflow = ''; // Restore scrolling
  }

  formatSunsetTime(sunset: string): string {
    // Extract just the time portion (HH:MM) and convert to 12-hour format
    const timePart = sunset.includes('T') ? sunset.split('T')[1].substring(0, 5) : sunset.substring(0, 5);
    const [hours, minutes] = timePart.split(':');
    const hour = parseInt(hours, 10);
    const hour12 = hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} PM`;
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    if (!this.selectedTrail?.photos) return;
    
    const nextIndex = this.currentImageIndex + 1;
    if (nextIndex < this.selectedTrail.photos.length) {
      this.selectedImage = this.selectedTrail.photos[nextIndex];
      this.currentImageIndex = nextIndex;
    }
  }

  previousImage(event: Event): void {
    event.stopPropagation();
    if (!this.selectedTrail?.photos) return;
    
    const prevIndex = this.currentImageIndex - 1;
    if (prevIndex >= 0) {
      this.selectedImage = this.selectedTrail.photos[prevIndex];
      this.currentImageIndex = prevIndex;
    }
  }
}
