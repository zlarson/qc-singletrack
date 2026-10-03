import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header.component';
import { PageBackdropComponent } from './components/page-backdrop.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, HeaderComponent, PageBackdropComponent],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'trail-status-app';
}
