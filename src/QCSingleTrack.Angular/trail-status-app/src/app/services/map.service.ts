import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { TrailDto } from '../models/trail-dto.model';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map?: L.Map;
  private markers: L.Marker[] = [];  // Quad Cities area coordinates (Davenport, IA) - fallback center
  private defaultCenter: [number, number] = [41.5236, -90.5776];
  private defaultZoom = 12;

  constructor() {
    // Fix for default marker icons in Leaflet
    this.fixLeafletIcons();
  }

  initMap(containerId: string): L.Map {
    // Clear existing map if it exists
    if (this.map) {
      this.map.remove();
    }    this.map = L.map(containerId, {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      dragging: true,
      touchZoom: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    return this.map;
  }  addTrailMarkers(trails: TrailDto[], selectedTrail?: TrailDto): void {
    if (!this.map) return;

    // Clear existing markers
    this.clearMarkers();

    // Only show marker for selected trail
    if (selectedTrail) {
      const lat = selectedTrail.latitude;
      const lng = selectedTrail.longitude;

      // Skip if invalid coordinates
      if (!lat || !lng || lat === 0 || lng === 0) {
        console.warn(`Selected trail ${selectedTrail.trailName} has invalid coordinates:`, { lat, lng });
        // Fallback to default view if selected trail has no coordinates
        this.map!.setView(this.defaultCenter, this.defaultZoom);
        return;
      }

      const marker = this.createTrailMarker(selectedTrail, lat, lng, true);
      this.markers.push(marker);
      marker.addTo(this.map!);

      // Center map on the selected trail
      this.map!.setView([lat, lng], Math.max(this.defaultZoom, 13));
    } else {
      // No trail selected, show default view
      this.map!.setView(this.defaultCenter, this.defaultZoom);
    }
  }
  highlightTrail(trail: TrailDto): void {
    // Simply refresh the markers to show only the selected trail
    this.addTrailMarkers([], trail);
  }

  private createTrailMarker(trail: TrailDto, lat: number, lng: number, isSelected: boolean): L.Marker {
    const icon = this.createTrailIcon(trail.currentStatus, isSelected);
    
    const marker = L.marker([lat, lng], { icon })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-lg">${trail.trailName}</h3>
          <p class="text-sm text-gray-600 mb-2">${trail.shortDescription || 'No description available'}</p>
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 rounded text-xs font-medium uppercase ${this.getStatusPopupClass(trail.currentStatus)}">
              ${trail.currentStatus}
            </span>
          </div>
        </div>
      `);

    // Store trail data with marker for later reference
    (marker as any)._trailData = trail;

    return marker;
  }

  private createTrailIcon(status: string, isSelected: boolean): L.DivIcon {
    const color = this.getStatusColor(status);
    const size = isSelected ? 30 : 20;
    
    // Create a simple colored circle icon
    const svgIcon = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" 
                fill="${color}" 
                stroke="${isSelected ? '#000' : '#fff'}" 
                stroke-width="${isSelected ? 3 : 2}"/>
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: 'trail-marker',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'Open': return '#22c55e';
      case 'Closed': return '#ef4444';
      case 'Caution': return '#f59e0b';
      case 'Freeze/Thaw': return '#06b6d4';
      default: return '#6b7280';
    }
  }

  private getStatusPopupClass(status: string): string {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-red-100 text-red-800';
      case 'Caution': return 'bg-yellow-100 text-yellow-800';
      case 'Freeze/Thaw': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  private clearMarkers(): void {
    this.markers.forEach(marker => {
      if (this.map) {
        this.map.removeLayer(marker);
      }
    });
    this.markers = [];
  }


  private fixLeafletIcons(): void {
    // Fix for missing marker icons in Leaflet with Angular
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png',
    });
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
    this.markers = [];
  }
}
