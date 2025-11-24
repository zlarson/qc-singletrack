import { Routes } from '@angular/router';
import { TrailListComponent } from './components/trail-list.component';
import { TrailDetailComponent } from './components/trail-detail.component';
import { AboutComponent } from './components/about.component';

export const routes: Routes = [
  { path: '', component: TrailListComponent },
  { path: 'trails', component: TrailListComponent },
  { path: 'trails/:id', component: TrailListComponent },
  { path: 'trail/:id', component: TrailDetailComponent },
  { path: 'about', component: AboutComponent },
  { path: '**', redirectTo: '' }
];
