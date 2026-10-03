import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { BackdropService } from '../services/backdrop.service';

const GLOW: Record<string, string> = {
  Open: 'bg-status-open/12',
  Caution: 'bg-status-caution/12',
  'Freeze/Thaw': 'bg-status-freeze/12',
  Closed: 'bg-status-closed/12'
};

/**
 * Fixed backdrop behind every page: a soft glow centred at the top, brand green by default and
 * the status colour of the open trail while one is being viewed.
 */
@Component({
  selector: 'app-page-backdrop',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    class: 'pointer-events-none fixed inset-0 -z-10 block overflow-hidden',
    'aria-hidden': 'true'
  },
  template: `
    <div
      class="absolute -top-56 left-1/2 h-[36rem] w-[48rem] max-w-[160%] -translate-x-1/2 rounded-full blur-3xl transition-colors duration-700"
      [class]="glowClass()">
    </div>
  `
})
export class PageBackdropComponent {
  private readonly backdrop = inject(BackdropService);

  readonly glowClass = computed(() => GLOW[this.backdrop.status() ?? ''] ?? 'bg-brand/12');
}
