import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { apiKeyInterceptor } from './interceptors/api-key.interceptor';
import { AppInsightsService } from './services/app-insights.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiKeyInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: (appInsights: AppInsightsService) => () => {},
      deps: [AppInsightsService],
      multi: true
    }
  ]
};
