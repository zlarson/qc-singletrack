import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],  template: `
    <div class="container mx-auto px-4 py-6">      
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">About QC Bike Trails</h1>
        
        <div class="prose max-w-none">
           
            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Welcome to the QC Bike Trails trail status system. This application provides real-time 
              information about trail conditions in the Quad Cities area, helping mountain bikers and 
              outdoor enthusiasts make informed decisions about their rides.
            </p>

            <p class="text-gray-600 dark:text-gray-300 mb-4">
              Our trail condition information is sourced directly from the 
              <a href="https://www.qcforc.org/" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">Friends of Off-Road Cycling (FORC)</a>, 
              the dedicated mountain bike club that maintains and advocates for our local trail systems. 
              We couldn't provide this app without the dedication of our local trail stewards who work tirelessly 
              to build, maintain, and monitor trail conditions. If you enjoy these trails, please consider 
              <a href="https://www.qcforc.org/content.php?120" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">joining FORC</a> 
              or volunteering for trail maintenance days to help preserve and improve these incredible riding opportunities 
              for our community.
            </p>
            
            <h3 class="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Application Features</h3>
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
                <span class="bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide mr-3">Freeze/Thaw</span>
                <span class="text-gray-600 dark:text-gray-300">Trail conditions affected by freezing/thawing cycles</span>
              </div>
              <div class="flex items-center">
                <span class="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide mr-3">Closed</span>
                <span class="text-gray-600 dark:text-gray-300">Trail is closed due to conditions or maintenance</span>
              </div>
            </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Data is automatically updated every 10 minutes from various trail monitoring sources.
            </p>
        </div>
    </div>
  `
})
export class AboutComponent {}
