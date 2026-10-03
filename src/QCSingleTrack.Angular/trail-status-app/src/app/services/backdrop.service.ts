import { Injectable, signal } from '@angular/core';
import { TrailStatus } from '../models/trail-dto.model';

/** Lets the page backdrop glow take on the status colour of the trail being viewed. */
@Injectable({
  providedIn: 'root'
})
export class BackdropService {
  /** Null means no trail is open, so the glow uses the brand green. */
  readonly status = signal<TrailStatus | null>(null);
}
