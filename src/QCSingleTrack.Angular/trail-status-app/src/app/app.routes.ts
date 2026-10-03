import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, BaseRouteReuseStrategy, Routes } from '@angular/router';
import { TrailListComponent } from './components/trail-list.component';

export const routes: Routes = [
  { path: '', component: TrailListComponent },
  { path: 'trails/:id', component: TrailListComponent },
  { path: 'trails', redirectTo: '' },
  { path: 'trail/:id', redirectTo: 'trails/:id' },
  { path: '**', redirectTo: '' }
];

/**
 * Keeps the trail list alive when moving between "/" and "/trails/:id", so opening or closing
 * a trail's details doesn't rebuild the page and reload every trail.
 */
@Injectable()
export class SameComponentReuseStrategy extends BaseRouteReuseStrategy {
  override shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig || (!!future.component && future.component === curr.component);
  }
}
