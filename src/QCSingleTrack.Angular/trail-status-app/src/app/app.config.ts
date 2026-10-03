import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';

import { routes, SameComponentReuseStrategy } from './app.routes';
import { apiKeyInterceptor } from './interceptors/api-key.interceptor';
import { AppInsightsService } from './services/app-insights.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: RouteReuseStrategy, useClass: SameComponentReuseStrategy },
    provideHttpClient(withXhr(), withInterceptors([apiKeyInterceptor])),
    provideAppInitializer(() => {
        const initializerFn = ((appInsights: AppInsightsService) => () => {})(inject(AppInsightsService));
        return initializerFn();
      })
  ]
};
