import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-2xl font-bold text-gray-800 mb-6">Gallery</h1>
        
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div class="text-center text-gray-600">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <h2 class="text-lg font-medium text-gray-800 mb-2">Trail Gallery Coming Soon</h2>
            <p class="text-gray-600">We're working on collecting trail photos and maps to display here.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GalleryComponent {}
