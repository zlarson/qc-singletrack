import { Injectable } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppInsightsService {
  private appInsights: ApplicationInsights;

  constructor(private router: Router) {
    this.appInsights = new ApplicationInsights({
      config: {
        connectionString: environment.appInsightsConnectionString,
        enableAutoRouteTracking: true,
        autoTrackPageVisitTime: true,
        enableCorsCorrelation: true,
        enableRequestHeaderTracking: true,
        enableResponseHeaderTracking: true
      }
    });
    
    this.appInsights.loadAppInsights();
    this.appInsights.trackPageView();

    // Track route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.appInsights.trackPageView({ uri: event.urlAfterRedirects });
        }
      });
  }

  trackEvent(name: string, properties?: { [key: string]: any }) {
    this.appInsights.trackEvent({ name }, properties);
  }

  trackException(error: Error, properties?: { [key: string]: any }) {
    this.appInsights.trackException({ exception: error }, properties);
  }

  trackMetric(name: string, average: number, properties?: { [key: string]: any }) {
    this.appInsights.trackMetric({ name, average }, properties);
  }

  trackTrace(message: string, properties?: { [key: string]: any }) {
    this.appInsights.trackTrace({ message }, properties);
  }
}
