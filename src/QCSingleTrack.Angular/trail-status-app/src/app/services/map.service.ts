import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import { TrailDto } from '../models/trail-dto.model';
import { statusOf } from '../models/trail-status';

const STATUS_COLORS: Record<string, string> = {
  Open: '#33cc33',
  Caution: '#ffb547',
  'Freeze/Thaw': '#5ad1e6',
  Closed: '#ff5c5c'
};

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map?: L.Map;

  /** Draws a small map centered on one trail. Replaces any map already on the page. */
  showTrail(container: HTMLElement, trail: TrailDto): void {
    this.destroy();

    const center: L.LatLngTuple = [trail.latitude, trail.longitude];
    this.map = L.map(container, {
      center,
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true
    });

    // Standard OSM tiles, darkened in styles.css (.trail-map .leaflet-tile-pane).
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      // OSM blocks tile requests without a Referer. The hosted site sends `Referrer-Policy: same-origin`,
      // which strips it from cross-origin requests, so override the policy on the tile images.
      referrerPolicy: 'strict-origin-when-cross-origin',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    L.marker(center, { icon: this.markerIcon(STATUS_COLORS[statusOf(trail)]), keyboard: false }).addTo(this.map);
  }

  /** Call after the map's container finishes resizing or animating into view. */
  refreshSize(): void {
    this.map?.invalidateSize();
  }

  destroy(): void {
    this.map?.remove();
    this.map = undefined;
  }

  private markerIcon(color: string): L.DivIcon {
    const size = 22;
    return L.divIcon({
      html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 3}" fill="${color}" stroke="#0e0e0f" stroke-width="3"/>
      </svg>`,
      className: 'trail-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }
}
