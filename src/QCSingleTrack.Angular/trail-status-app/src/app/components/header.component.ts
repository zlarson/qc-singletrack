import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ThemeService } from '../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],  template: `
    <header class="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
      <nav class="container mx-auto px-4">        <div class="flex items-center justify-between h-16">          <!-- Logo/Brand -->
          <div class="flex-shrink-0">
            <a routerLink="/" class="flex items-center hover:opacity-80 transition-opacity cursor-pointer">
              <img src="assets/logo-horizontal-black.png" alt="QC Bike Trails" class="h-10 dark:hidden">
              <img src="assets/logo-horizontal-white.png" alt="QC Bike Trails" class="h-10 hidden dark:block">
            </a>
          </div>
          
          <!-- Right Side: Navigation Links, Theme Toggle & Mobile menu -->
          <div class="flex items-center gap-6">
            <!-- Navigation Links -->
            <div class="hidden md:flex items-baseline space-x-6">
              <a 
                routerLink="/" 
                routerLinkActive="text-green-600 border-b-2 border-green-600" 
                [routerLinkActiveOptions]="{exact: true}"
                class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                HOME
              </a>
              <a 
                routerLink="/about" 
                routerLinkActive="text-green-600 border-b-2 border-green-600"
                class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 text-sm font-medium transition-colors">
                ABOUT
              </a>
            </div>
            
            <!-- Theme Toggle & Mobile menu -->
            <div class="flex items-center gap-3">
            <!-- Dark mode toggle -->
            <button 
              (click)="toggleTheme()"
              class="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              [title]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'">
              <!-- Sun icon for light mode -->
              <svg *ngIf="!isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              <!-- Moon icon for dark mode -->
              <svg *ngIf="isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
              </svg>            </button>
            
              <!-- Mobile menu button -->
              <div class="md:hidden">
                <button 
                  (click)="toggleMobileMenu()"
                  class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Mobile menu -->
        <div [class.hidden]="!isMobileMenuOpen" class="md:hidden">
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 dark:bg-gray-800">            <a 
              routerLink="/" 
              (click)="closeMobileMenu()"
              class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white block px-3 py-2 text-base font-medium">
              HOME
            </a>
            <a 
              routerLink="/about" 
              (click)="closeMobileMenu()"
              class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white block px-3 py-2 text-base font-medium">
              ABOUT
            </a>
          </div>
        </div>
      </nav>
    </header>
  `
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  isDarkMode = false;
  private themeSubscription?: Subscription;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeSubscription = this.themeService.darkMode$.subscribe(
      isDark => this.isDarkMode = isDark
    );
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode();
  }
}
