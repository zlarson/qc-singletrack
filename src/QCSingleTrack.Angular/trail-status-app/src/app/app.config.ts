import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';

import { routes, SameComponentReuseStrategy } from './app.routes';
import { AppInsightsService } from './services/app-insights.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: RouteReuseStrategy, useClass: SameComponentReuseStrategy },
    provideHttpClient(withXhr()),
    provideAppInitializer(() => {
        const initializerFn = ((appInsights: AppInsightsService) => () => {})(inject(AppInsightsService));
        return initializerFn();
      })
  ]
};
