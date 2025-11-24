import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { TrailService } from '../services/trail.service';
import { MapService } from '../services/map.service';
import { TrailDto } from '../models/trail-dto.model';

@Component({
  selector: 'app-trail-list',
  standalone: true,
  imports: [CommonModule, RouterModule],  template: `    <div class="container mx-auto px-4 py-6">
      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-300">Loading trail status...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
        <p class="font-bold">Error loading trail data:</p>
        <p>{{ error }}</p>
      </div>

      <!-- Master-Detail Layout -->
      <div *ngIf="!loading && !error" class="flex gap-6">        <!-- Left: Trail List (narrow) -->
        <div class="w-1/3 space-y-3">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Our Trails</h2>
          
          <div *ngFor="let trail of trails"
               [ngClass]="getTrailCardClass(trail.currentStatus, trail === selectedTrail)"
               class="rounded-lg shadow-sm border hover:shadow-md transition-all cursor-pointer p-3"
               (click)="selectTrail(trail)">            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ trail.trailName }}</h3>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0 ml-2">                <span [ngClass]="getStatusBadgeClass(trail.currentStatus)" 
                      class="px-2 py-1 rounded-full text-xs font-medium uppercase">
                  {{ trail.currentStatus }}
                </span>
                <svg [ngClass]="getChevronClass(trail.currentStatus)" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>        <!-- Right: Trail Details -->
        <div class="flex-1 p-6">
          <div *ngIf="!selectedTrail" class="text-center text-gray-500 dark:text-gray-400 py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
            </svg>
            <h3 class="text-lg font-medium dark:text-gray-300">Select a trail</h3>
            <p class="dark:text-gray-400">Choose a trail from the list to view its details</p>
          </div><div *ngIf="selectedTrail">            <!-- Trail Name Header -->
            <div class="mb-4 flex items-center justify-between">              <div class="flex items-center gap-3">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ selectedTrail.trailName }}</h2>
                <div class="relative">
                  <button 
                    (click)="copyTrailLink(selectedTrail)" 
                    [class]="linkCopied ? 'p-2 text-green-600 bg-green-50 dark:bg-green-900 rounded-full transition-colors' : 'p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-full transition-colors'"
                    title="Copy link to this trail">
                    <svg *ngIf="!linkCopied" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                    </svg>
                    <svg *ngIf="linkCopied" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </button>
                  <!-- Copy confirmation tooltip -->
                  <div *ngIf="linkCopied" 
                       class="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Link copied!
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-green-600"></div>
                  </div>
                </div>
              </div>
              <span [ngClass]="getStatusBadgeClass(selectedTrail.currentStatus)" 
                    class="px-4 py-2 rounded-full text-base font-semibold uppercase">
                {{ selectedTrail.currentStatus }}
              </span>
            </div>            <!-- Description -->
            <div class="mb-6">
              <p class="text-gray-700 dark:text-gray-300 text-base leading-relaxed">{{ selectedTrail.shortDescription || selectedTrail.description || 'No description available' }}</p>
                <!-- Status Reason (if available) -->
              <div *ngIf="selectedTrail.currentReason" class="mt-4">
                <p class="text-gray-500 dark:text-gray-400 text-sm">Status Reason: {{ selectedTrail.currentReason }}</p>
              </div>
            </div>            <!-- Map Section -->
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Trail Location</h3>
              <div id="trail-map" class="rounded-lg h-80 w-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <p class="text-gray-500 dark:text-gray-400" *ngIf="!mapInitialized">Loading map...</p>
              </div>
            </div><!-- More Information -->
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">More Information</h3>
                <div class="bg-white dark:bg-gray-700 rounded-lg p-4 space-y-3 transition-colors">                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Status Source</label>
                      <p class="text-gray-900 dark:text-gray-100">{{ selectedTrail.currentSource }}</p>
                    </div>
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Status Last Updated</label>
                      <p class="text-gray-900 dark:text-gray-100">{{ formatLastScrapedTime(selectedTrail.lastScrapedTime) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TrailListComponent implements OnInit, OnDestroy, AfterViewInit {
  trails: TrailDto[] = [];
  selectedTrail: TrailDto | null = null;
  loading = true;
  error: string | null = null;
  linkCopied = false;
  mapInitialized = false;

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
        } else if (this.trails.length > 0) {
          // Auto-select first trail if no specific trail requested
          this.selectTrail(this.trails[0]);
        }
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
    
    const closedCount = this.trails.filter(t => t.currentStatus === 'Closed').length;
    const cautionCount = this.trails.filter(t => t.currentStatus === 'Caution').length;
    
    if (closedCount === 0 && cautionCount === 0) {
      return 'All Trails Open';
    } else if (closedCount > 0) {
      return `${closedCount} Trail${closedCount > 1 ? 's' : ''} Closed`;
    } else {
      return `${cautionCount} Trail${cautionCount > 1 ? 's' : ''} with Caution`;
    }
  }

  getOpenTrailsCount(): number {
    return this.trails.filter(t => t.currentStatus === 'Open').length;
  }

  getClosedTrailsCount(): number {
    return this.trails.filter(t => t.currentStatus === 'Closed').length;
  }

  getCautionTrailsCount(): number {
    return this.trails.filter(t => t.currentStatus === 'Caution').length;
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
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600';
    }
  }  getTrailCardClass(status: string, isSelected: boolean = false): string {
    let baseClass = '';
    switch (status) {
      case 'Open': 
        baseClass = isSelected ? 'bg-green-400 dark:bg-green-600 border-green-500 dark:border-green-400 shadow-lg transform scale-y-110' : 'bg-green-200 dark:bg-green-800 border-green-400 dark:border-green-600'; 
        break;
      case 'Closed': 
        baseClass = isSelected ? 'bg-red-400 dark:bg-red-600 border-red-500 dark:border-red-400 shadow-lg transform scale-y-110' : 'bg-red-200 dark:bg-red-800 border-red-400 dark:border-red-600'; 
        break;
      case 'Caution': 
        baseClass = isSelected ? 'bg-yellow-400 dark:bg-yellow-600 border-yellow-500 dark:border-yellow-400 shadow-lg transform scale-y-110' : 'bg-yellow-200 dark:bg-yellow-800 border-yellow-400 dark:border-yellow-600'; 
        break;
      default: 
        baseClass = isSelected ? 'bg-gray-300 dark:bg-gray-600 border-gray-400 dark:border-gray-500 shadow-lg transform scale-y-110' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'; 
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
}
