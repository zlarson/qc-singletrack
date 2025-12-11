import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TrailService } from '../services/trail.service';
import { TrailDto } from '../models/trail-dto.model';

interface GalleryImage {
  id: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

@Component({
  selector: 'app-trail-detail',
  standalone: true,
  imports: [CommonModule],  template: `
    <div class="container mx-auto px-4 py-6">      <!-- Back Button -->
      <button 
        (click)="goBack()"
        class="mb-6 flex items-center text-gray-600 hover:text-gray-800 transition-colors">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        All Trails
      </button>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading trail details...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <p class="font-bold">Error loading trail details:</p>
        <p>{{ error }}</p>
      </div>      <!-- Trail Detail Content -->
      <div *ngIf="trail && !loading && !error" class="max-w-4xl">        <!-- Header Banner -->
        <div [ngClass]="getStatusBannerClass(trail.currentStatus || 'Open')" class="rounded-xl p-6 text-white mb-6">
          <h1 class="text-2xl font-bold mb-1">{{ trail.trailName.toUpperCase() }}</h1>
          <p class="text-lg mb-1">STATUS: {{ (trail.currentStatus || 'Open').toUpperCase() }}</p>
          <p class="text-sm opacity-90">
            Last updated: {{ trail.lastScrapedTime | date:'short' }}
          </p>
        </div>

        <!-- Reason Section -->
        <div *ngIf="trail.currentReason" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <p class="text-sm text-gray-700">
            <strong>Reason:</strong> {{ trail.currentReason }}
          </p>
        </div><!-- Trail Info Section -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Trail Info</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Source -->
            <div class="flex items-center">
              <svg class="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p class="text-sm text-gray-600">Source</p>
                <p class="font-medium">{{ trail.currentSource }}</p>
              </div>
            </div>
            
            <!-- Location -->
            <div class="flex items-center">
              <svg class="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              </svg>
              <div>
                <p class="text-sm text-gray-600">Coordinates</p>
                <p class="font-medium">{{ trail.latitude }}, {{ trail.longitude }}</p>
              </div>
            </div>
            
            <!-- Temperature (if available) -->
            <div class="flex items-center" *ngIf="trail.currentTemp">
              <svg class="w-6 h-6 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <div>
                <p class="text-sm text-gray-600">Temperature</p>
                <p class="font-medium">{{ trail.currentTemp }}°F</p>
              </div>
            </div>
          </div>

          <!-- Map Pin Button -->
          <div class="mt-6">
            <button class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              GOOGLE MAP PIN
            </button>
          </div>

          <!-- Additional Trail Info -->
          <div class="mt-6 space-y-2">
            <h3 class="font-medium text-gray-800 mb-3">Trail Info</h3>
            <div class="text-sm text-gray-600 space-y-1">
              <p>• <strong>Difficulty:</strong> BLUE</p>
              <p>• <strong>Length:</strong> 8.5 miles</p>
              <p>• <strong>Elevation:</strong> 750 ft</p>
              <p>• <strong>Parking:</strong> Lot A off Main St</p>
              <p>• <strong>Link:</strong> Local Trail Org</p>
            </div>
          </div>
        </div>

        <!-- Gallery Section -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mt-6">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Trail Photos</h2>
          
          <!-- Scrollable Photo Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto pr-2">
            <div 
              *ngFor="let image of galleryImages"
              (click)="openImageModal(image)"
              class="relative aspect-square overflow-hidden rounded-lg cursor-pointer group bg-gray-200 dark:bg-gray-700 shadow-md hover:shadow-xl transition-all">
              <img 
                [src]="image.thumbnailUrl" 
                [alt]="image.title"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy">
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"></path>
                </svg>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="galleryImages.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p class="text-sm">No photos available for this trail yet</p>
          </div>
        </div>

        <!-- Modal Overlay -->
        <div 
          *ngIf="selectedImage"
          (click)="closeImageModal()"
          class="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fadeIn">
          
          <!-- Close Button -->
          <button 
            (click)="closeImageModal()"
            class="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors p-2">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <!-- Previous Button -->
          <button 
            *ngIf="currentImageIndex > 0"
            (click)="previousImage($event)"
            class="absolute left-4 z-50 text-white hover:text-gray-300 transition-colors p-2">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>

          <!-- Next Button -->
          <button 
            *ngIf="currentImageIndex < galleryImages.length - 1"
            (click)="nextImage($event)"
            class="absolute right-4 z-50 text-white hover:text-gray-300 transition-colors p-2">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>

          <!-- Modal Content -->
          <div 
            (click)="$event.stopPropagation()"
            class="relative max-w-7xl max-h-[90vh] animate-scaleIn">
            <img 
              [src]="selectedImage.url" 
              [alt]="selectedImage.title"
              class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl">
            
            <!-- Image Info -->
            <div class="mt-4 text-center text-white">
              <h3 class="text-xl font-semibold mb-2">{{ selectedImage.title }}</h3>
              <p class="text-gray-300 text-sm">
                {{ currentImageIndex + 1 }} of {{ galleryImages.length }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
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

    .dark .overflow-y-auto::-webkit-scrollbar-track {
      background: #374151;
    }

    .dark .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #6b7280;
    }

    .dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `]
})
export class TrailDetailComponent implements OnInit {
  trail: TrailDto | null = null;
  loading = true;
  error: string | null = null;
  selectedImage: GalleryImage | null = null;
  
  // Sample gallery images - replace with actual trail photos from API
  galleryImages: GalleryImage[] = [
    {
      id: 1,
      title: 'Trail Overview',
      url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&h=1080&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop'
    },
    {
      id: 2,
      title: 'Technical Section',
      url: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=1920&h=1080&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=400&h=400&fit=crop'
    },
    {
      id: 3,
      title: 'Scenic View',
      url: 'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=1920&h=1080&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=400&h=400&fit=crop'
    },
    {
      id: 4,
      title: 'Forest Path',
      url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&h=1080&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop'
    },
    {
      id: 5,
      title: 'Jump Feature',
      url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1920&h=1080&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400&h=400&fit=crop'
    },
    {
      id: 6,
      title: 'Trailhead',
      url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop'
    },
    {
      id: 7,
      title: 'Creek Crossing',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop'
    },
    {
      id: 8,
      title: 'Bermed Turn',
      url: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=1920&h=1080&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400&h=400&fit=crop'
    },
    {
      id: 9,
      title: 'Autumn Colors',
      url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1920&h=1080&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop'
    },
    {
      id: 10,
      title: 'Trail Marker',
      url: 'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=1920&h=1080&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=400&h=400&fit=crop'
    },
    {
      id: 11,
      title: 'Rock Garden',
      url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop'
    },
    {
      id: 12,
      title: 'Summit View',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop'
    }
  ];

  get currentImageIndex(): number {
    if (!this.selectedImage) return -1;
    return this.galleryImages.findIndex(img => img.id === this.selectedImage!.id);
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trailService: TrailService
  ) {}

  ngOnInit(): void {
    const trailId = this.route.snapshot.paramMap.get('id');
    if (trailId) {
      this.loadTrail(+trailId);
    } else {
      this.error = 'Invalid trail ID';
      this.loading = false;
    }
  }

  loadTrail(id: number): void {
    this.loading = true;
    this.error = null;
    
    this.trailService.getTrailById(id).subscribe({
      next: (trail) => {
        this.trail = trail;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load trail details. Please try again.';
        this.loading = false;
        console.error('Error loading trail:', err);
      }
    });
  }
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-red-100 text-red-800';
      case 'Caution': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusBannerClass(status: string): string {
    switch (status) {
      case 'Open': return 'bg-green-600';
      case 'Closed': return 'bg-red-600';
      case 'Caution': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  openImageModal(image: GalleryImage): void {
    this.selectedImage = image;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  closeImageModal(): void {
    this.selectedImage = null;
    document.body.style.overflow = ''; // Restore scrolling
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    const nextIndex = this.currentImageIndex + 1;
    if (nextIndex < this.galleryImages.length) {
      this.selectedImage = this.galleryImages[nextIndex];
    }
  }

  previousImage(event: Event): void {
    event.stopPropagation();
    const prevIndex = this.currentImageIndex - 1;
    if (prevIndex >= 0) {
      this.selectedImage = this.galleryImages[prevIndex];
    }
  }
}
