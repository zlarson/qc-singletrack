import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GalleryImage {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  fullUrl: string;
  category: string;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Trail Gallery</h1>
        <p class="text-gray-600 dark:text-gray-400 mb-6">Browse photos from our trail system</p>
        
        <!-- Category Filter -->
        <div class="mb-6 flex flex-wrap gap-2">
          <button 
            *ngFor="let cat of categories"
            (click)="selectedCategory = cat"
            [class.bg-blue-600]="selectedCategory === cat"
            [class.text-white]="selectedCategory === cat"
            [class.bg-gray-200]="selectedCategory !== cat"
            [class.text-gray-700]="selectedCategory !== cat"
            [class.dark:bg-gray-700]="selectedCategory !== cat"
            [class.dark:text-gray-300]="selectedCategory !== cat"
            class="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-blue-500 hover:text-white">
            {{ cat }}
          </button>
        </div>

        <!-- Photo Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div 
            *ngFor="let image of filteredImages"
            (click)="openModal(image)"
            class="relative aspect-square overflow-hidden rounded-lg cursor-pointer group bg-gray-200 dark:bg-gray-700 shadow-md hover:shadow-xl transition-shadow">
            <img 
              [src]="image.thumbnailUrl" 
              [alt]="image.title"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy">
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 class="font-semibold text-sm mb-1">{{ image.title }}</h3>
                <p class="text-xs text-gray-200 line-clamp-2">{{ image.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Overlay -->
        <div 
          *ngIf="selectedImage"
          (click)="closeModal()"
          class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn">
          
          <!-- Close Button -->
          <button 
            (click)="closeModal()"
            class="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          <!-- Previous Button -->
          <button 
            *ngIf="currentIndex > 0"
            (click)="previousImage($event)"
            class="absolute left-4 z-50 text-white hover:text-gray-300 transition-colors">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>

          <!-- Next Button -->
          <button 
            *ngIf="currentIndex < filteredImages.length - 1"
            (click)="nextImage($event)"
            class="absolute right-4 z-50 text-white hover:text-gray-300 transition-colors">
            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>

          <!-- Modal Content -->
          <div 
            (click)="$event.stopPropagation()"
            class="relative max-w-6xl max-h-[90vh] animate-scaleIn">
            <img 
              [src]="selectedImage.fullUrl" 
              [alt]="selectedImage.title"
              class="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl">
            
            <!-- Image Info -->
            <div class="mt-4 text-center text-white">
              <h2 class="text-2xl font-bold mb-2">{{ selectedImage.title }}</h2>
              <p class="text-gray-300 mb-2">{{ selectedImage.description }}</p>
              <span class="inline-block px-3 py-1 bg-blue-600 rounded-full text-sm">
                {{ selectedImage.category }}
              </span>
              <p class="text-gray-400 text-sm mt-2">
                {{ currentIndex + 1 }} / {{ filteredImages.length }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
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
      animation: scaleIn 0.3s ease-out;
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class GalleryComponent {
  selectedImage: GalleryImage | null = null;
  selectedCategory = 'All';
  
  categories = ['All', 'Trails', 'Events', 'Wildlife', 'Landscapes'];

  // Sample images - replace with actual image URLs
  images: GalleryImage[] = [
    {
      id: 1,
      title: 'Sunset Trail Ride',
      description: 'Beautiful sunset view from the main trail',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=400&h=400&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=1920&h=1080&fit=crop',
      category: 'Trails'
    },
    {
      id: 2,
      title: 'Mountain Bike Jump',
      description: 'Rider catching air on the jump line',
      thumbnailUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400&h=400&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=1920&h=1080&fit=crop',
      category: 'Trails'
    },
    {
      id: 3,
      title: 'Fall Colors',
      description: 'Autumn foliage along the creek trail',
      thumbnailUrl: 'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=400&h=400&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=1920&h=1080&fit=crop',
      category: 'Landscapes'
    },
    {
      id: 4,
      title: 'Trail Maintenance Day',
      description: 'Volunteers building new features',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop',
      category: 'Events'
    },
    {
      id: 5,
      title: 'Forest Path',
      description: 'Winding singletrack through the woods',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=400&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1920&h=1080&fit=crop',
      category: 'Trails'
    },
    {
      id: 6,
      title: 'White-tailed Deer',
      description: 'Local wildlife spotted on the trail',
      thumbnailUrl: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?w=400&h=400&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?w=1920&h=1080&fit=crop',
      category: 'Wildlife'
    },
    {
      id: 7,
      title: 'Technical Section',
      description: 'Rock garden challenge on the expert trail',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=1080&fit=crop',
      category: 'Trails'
    },
    {
      id: 8,
      title: 'Spring Wildflowers',
      description: 'Blooming wildflowers along the trail edge',
      thumbnailUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1920&h=1080&fit=crop',
      category: 'Landscapes'
    },
    {
      id: 9,
      title: 'Group Ride',
      description: 'Weekly group ride gathering',
      thumbnailUrl: 'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=400&h=400&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=1920&h=1080&fit=crop',
      category: 'Events'
    },
    {
      id: 10,
      title: 'Misty Morning',
      description: 'Early morning fog on the valley trail',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
      category: 'Landscapes'
    },
    {
      id: 11,
      title: 'Red Fox',
      description: 'Rare sighting of a red fox near the trailhead',
      thumbnailUrl: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&h=400&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=1920&h=1080&fit=crop',
      category: 'Wildlife'
    },
    {
      id: 12,
      title: 'Bermed Turn',
      description: 'Perfectly sculpted berm on the flow trail',
      thumbnailUrl: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400&h=400&fit=crop',
      fullUrl: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=1920&h=1080&fit=crop',
      category: 'Trails'
    }
  ];

  get filteredImages(): GalleryImage[] {
    if (this.selectedCategory === 'All') {
      return this.images;
    }
    return this.images.filter(img => img.category === this.selectedCategory);
  }

  get currentIndex(): number {
    if (!this.selectedImage) return -1;
    return this.filteredImages.findIndex(img => img.id === this.selectedImage!.id);
  }

  openModal(image: GalleryImage): void {
    this.selectedImage = image;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  closeModal(): void {
    this.selectedImage = null;
    document.body.style.overflow = ''; // Restore scrolling
  }

  nextImage(event: Event): void {
    event.stopPropagation();
    const nextIndex = this.currentIndex + 1;
    if (nextIndex < this.filteredImages.length) {
      this.selectedImage = this.filteredImages[nextIndex];
    }
  }

  previousImage(event: Event): void {
    event.stopPropagation();
    const prevIndex = this.currentIndex - 1;
    if (prevIndex >= 0) {
      this.selectedImage = this.filteredImages[prevIndex];
    }
  }
}
