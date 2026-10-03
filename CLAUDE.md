# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

QC SingleTrack shows live mountain-bike trail status for the Quad Cities. Three deployable pieces share one .NET data/application layer:

1. **Scraper Function** (`src/QCSingleTrack/QCSingleTrack.TrailStatusScraperFn`) — Azure Functions isolated worker; `ScraperTimerFunction` (cron `*/30 * * * *`) calls `ITrailScraper.ScrapeForcAsync()` then `ITrailService.UpdateTrailStatusesAsync()` to upsert status into SQL Server.
2. **Web API** (`src/QCSingleTrack/QCSingleTrack.Api`) — ASP.NET Core controllers serving `GET /api/trails` and `GET /api/trails/{trailId}/weather` (weather cached in `IMemoryCache` for 10 min).
3. **Angular SPA** (`src/QCSingleTrack.Angular/trail-status-app`) — standalone-component Angular app with Tailwind + Leaflet, deployed to Azure Static Web Apps.

## Commands

Backend (solution file is `src/QCSingleTrack/QCSingleTrack.slnx`; target is .NET 10):

```bash
dotnet build src/QCSingleTrack/QCSingleTrack.slnx
dotnet run --project src/QCSingleTrack/QCSingleTrack.Api
```

Run the Functions host from `src/QCSingleTrack/QCSingleTrack.TrailStatusScraperFn` with `func start` (needs Azure Functions Core Tools and a `local.settings.json`, which is gitignored).

EF Core migrations live in `QCSingleTrack.Infrastructure.Data` and use `DesignTime/DesignTimeDbContextFactory.cs`:

```bash
dotnet ef migrations add <Name> --project src/QCSingleTrack/QCSingleTrack.Infrastructure.Data
dotnet ef database update --project src/QCSingleTrack/QCSingleTrack.Infrastructure.Data
```

There are no .NET test projects.

Frontend (run from `src/QCSingleTrack.Angular/trail-status-app`):

```bash
npm start            # ng serve on :4200
npm run build        # production build -> dist/trail-status-app/browser
npm test             # Vitest (jsdom) via @angular/build:unit-test, watch mode
npx ng test --watch=false
```

Single spec: `npx ng test --watch=false --include src/app/app.component.spec.ts`. jsdom lacks `window.matchMedia`, which `ThemeService` uses, so specs that render the header have to stub it (see `app.component.spec.ts`).

Angular 22 needs Node `^22.22.3 || ^24.15.0`; `engines.node` in `package.json` is also what Azure Static Web Apps uses to choose its build Node version.

## Architecture notes

- **Layering**: `Domain` (entities `Trail`, `CurrentStatus`, `Photo`) ← `Infrastructure.Data` (`TrailStatusDbContext`, fluent configs, migrations) ← `Application` (scraper, `TrailService`, `OpenMeteoWeatherService`, `WeatherCodeLookup`) ← `Api` / `TrailStatusScraperFn`. Note `Application` references `Infrastructure.Data` directly (services use `IDbContextFactory<TrailStatusDbContext>`), not the other way around.
- **DbContext usage**: always via `IDbContextFactory` — create a context per operation (`await using var db = _dbFactory.CreateDbContext()`).
- **Trail matching**: scraped results are matched to existing trails case-insensitively on `Trail.TrailNameForLookup`; unknown names create new `Trail` rows. Renaming a trail for display should change `TrailName`, not the lookup name.
- **Scraper**: `AngleSharpTrailScraper` parses the source HTML and infers status (Open/Closed/Caution/Freeze-Thaw). Base URL comes from the `Scraper` config section (`ScraperOptions`); the named HttpClient `ScraperClient` sends browser-like headers.
- **Connection string**: `ConnectionStrings:DefaultConnection` or env var `ConnectionStrings__DefaultConnection`. If absent, the API silently falls back to an EF in-memory database (empty data); the Function does not.
- **API key**: `ApiKeyMiddleware` requires header `X-Api-Key` on `/api/*`, compared against `ApiKeys:ClientKey`. The Angular app sets this header per-request in `services/trail.service.ts` (the `api-key.interceptor.ts` only logs). CORS origins are hardcoded in `Api/Program.cs`.
- **Dev docs**: Swagger + Scalar UI are enabled only in Development.
- **Frontend config**: `src/environments/environment.ts` points `apiUrl` at the deployed Azure API (not localhost); `environment.prod.ts` is swapped in for production builds. `proxy.conf.json` exists for a local API at `https://localhost:60997` but is not wired into `angular.json`. The deployed API's CORS only allows port 4200, so the dev server must run on 4200 to load data.
- **Angular style**: standalone components only, built-in control flow (`@if`/`@for`), and explicit `ChangeDetectionStrategy.Eager` (added by the v22 migration to keep pre-v22 behavior; the app still uses zone.js).
- **Tailwind v4**: CSS-first config with no `tailwind.config.js`. Everything lives in `src/styles.css` (`@import 'tailwindcss'` plus an `@theme` block of design tokens such as `bg-ink`, `bg-card`, `text-dim`, `bg-brand` and `bg-status-*`), loaded through `@tailwindcss/postcss` in `.postcssrc.json`. The global stylesheet must stay `.css`, because Tailwind v4 does not support Sass.
- **Dark only**: there is no light theme or theme toggle; don't add `dark:` variants. The brand green (`--color-brand`) matches the logo and is also the "open" status color. Status labels, colors and sorting live in `models/trail-status.ts`; a trail with no status (one FORC doesn't monitor, e.g. Credit Island) counts as open. The page background is a soft glow in `components/page-backdrop.component.ts`: brand green by default, tinted to the open trail's status color via `BackdropService`.
- **Trail list routing**: `/` and `/trails/:id` both render `TrailListComponent`, and `SameComponentReuseStrategy` (in `app.routes.ts`) keeps it alive between them, so the route param alone opens or closes the details (a bottom sheet on phones, a side panel at `lg`). `CurrentStatus.LastScrapedTime` is only written when a status changes, so the UI uses it as "status since".
- **Deployment**: `.github/workflows/azure-static-web-apps-*.yml` builds and deploys only the Angular app on pushes to `main` touching `src/**`. The API and Function are deployed separately (not via this repo's CI).

`docs/gemini-original-plan.md` holds the original design plan.
