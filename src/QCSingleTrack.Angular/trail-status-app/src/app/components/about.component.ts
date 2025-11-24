import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],  template: `
    <div class="container mx-auto px-4 py-6">      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">About</h1>
        
        <div class="prose max-w-none">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">QC Single Track Trail Status</h2>
            
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Welcome to the QC Single Track trail status system. This application provides real-time 
              information about trail conditions in the Quad Cities area, helping mountain bikers and 
              outdoor enthusiasts make informed decisions about their rides.
            </p>
            
            <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Features</h3>
            <ul class="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 mb-6">
              <li>Real-time trail status updates</li>
              <li>Weather conditions and rainfall data</li>
              <li>Trail difficulty and length information</li>
              <li>Interactive maps and directions</li>
              <li>Trail photos and gallery</li>
            </ul>
            
            <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Status Indicators</h3>
            <div class="space-y-2 mb-6">
              <div class="flex items-center">
                <span class="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide mr-3">Open</span>
                <span class="text-gray-600 dark:text-gray-300">Trail is in good condition and open for riding</span>
              </div>
              <div class="flex items-center">
                <span class="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide mr-3">Caution</span>
                <span class="text-gray-600 dark:text-gray-300">Trail may have some issues, ride with caution</span>
              </div>
              <div class="flex items-center">
                <span class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide mr-3">Closed</span>
                <span class="text-gray-600 dark:text-gray-300">Trail is closed due to conditions or maintenance</span>
              </div>
            </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
              Data is automatically updated every 10 minutes from various trail monitoring sources.
            </p></div>
    </div>
  `
})
export class AboutComponent {}
