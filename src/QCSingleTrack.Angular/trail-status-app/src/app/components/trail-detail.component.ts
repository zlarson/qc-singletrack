import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TrailService } from '../services/trail.service';
import { TrailDto } from '../models/trail-dto.model';

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
        <div [ngClass]="getStatusBannerClass(trail.currentStatus)" class="rounded-xl p-6 text-white mb-6">
          <h1 class="text-2xl font-bold mb-1">{{ trail.trailName.toUpperCase() }}</h1>
          <p class="text-lg mb-1">STATUS: {{ trail.currentStatus.toUpperCase() }}</p>
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

        <div class="grid grid-cols-1 lg:grid-cols-1 gap-6">        <!-- Gallery Section -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Gallery</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Static Trail Map Image -->
            <div class="bg-gray-200 rounded-lg h-24 flex items-center justify-center">
              <div class="text-center text-gray-600 text-xs">
                <p>STATIC TRAIL</p>
                <p>MAP IMAGE</p>
              </div>
            </div>
            
            <!-- Photo Placeholders -->
            <div class="bg-gray-200 rounded-lg h-24 flex items-center justify-center">
              <div class="text-center text-gray-600 text-xs">
                <p>IMG</p>
              </div>
            </div>
            
            <div class="bg-gray-200 rounded-lg h-24 flex items-center justify-center">
              <div class="text-center text-gray-600 text-xs">
                <p>PHOTO</p>
              </div>
            </div>
            
            <div class="bg-gray-200 rounded-lg h-24 flex items-center justify-center">
              <div class="text-center text-gray-600 text-xs">
                <p>CAROUSEL</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TrailDetailComponent implements OnInit {
  trail: TrailDto | null = null;
  loading = true;
  error: string | null = null;

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
}
