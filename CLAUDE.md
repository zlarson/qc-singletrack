# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

QC Bike Trails (repo name QC SingleTrack) shows live mountain-bike trail status for the Quad Cities. Trail data lives in Azure Table Storage (table `Trails` in the `qcsingletracksa` account). The deployable pieces share one .NET application layer:

1. **Scraper** (`QCSingleTrack.TrailStatusScraperConsole`) — runs from the Windows scheduled task "QCSingleTrack Scraper" on the owner's PC (every 15 minutes, from `C:\Tools\QCScraper`), calling `ITrailScraper.ScrapeForcAsync()` then `ITrailService.UpdateTrailStatusesAsync()`. It signs in to storage with the owner's `az login`.
2. **Web API** (`src/QCSingleTrack/QCSingleTrack.Api`) — ASP.NET Core controllers serving `GET /api/trails` and `GET /api/trails/{trailId}/weather` (weather cached in `IMemoryCache` for 10 min).
3. **Angular SPA** (`src/QCSingleTrack.Angular/trail-status-app`) — standalone-component Angular app with Tailwind + Leaflet, deployed to Azure Static Web Apps.

## Commands

Backend (solution file is `src/QCSingleTrack/QCSingleTrack.slnx`; projects target `net10.0`, matching the API App Service's `DOTNETCORE|10.0` stack):

```bash
dotnet build src/QCSingleTrack/QCSingleTrack.slnx
dotnet run --project src/QCSingleTrack/QCSingleTrack.Api
```

The scraper console can also load the Trails table: `--seed <file>` loads a saved `GET /api/trails` response (use it to fill Azurite for local dev).

```bash
dotnet run --project src/QCSingleTrack/QCSingleTrack.TrailStatusScraperConsole                       # scrape once
dotnet run --project src/QCSingleTrack/QCSingleTrack.TrailStatusScraperConsole -- --seed trails.json
```

There are no .NET test projects.

Frontend (run from `src/QCSingleTrack.Angular/trail-status-app`):

```bash
npm start            # ng serve on :4200
npm run build        # production build -> dist/trail-status-app/browser
npm test             # Vitest (jsdom) via @angular/build:unit-test, watch mode
npx ng test --watch=false
```

Single spec: `npx ng test --watch=false --include src/app/app.component.spec.ts`.

Angular 22 needs Node `^22.22.3 || ^24.15.0`. CI builds the app with Node 24 itself instead of letting Azure Static Web Apps (Oryx) build it, because Oryx's Node versions lag behind.

## Architecture notes

- **Layering**: `Domain` (entities `Trail`, `CurrentStatus`, `Photo`) ← `Application` (scraper, `TableTrailService`, `OpenMeteoWeatherService`, `WeatherCodeLookup`, `Storage/`) ← `Api` / `TrailStatusScraperConsole`. The original SQL Server database was retired in Oct 2026; a final backup is `sql-backups/qc-singletrack-db-20261005.bacpac` in `qcsingletracksa`.
- **Trails table**: one row per trail (`Storage/TrailEntity.cs`): PartitionKey `trail`, RowKey the zero-padded trail ID (IDs appear in site URLs, so never renumber them), status fields on the same row, photos as a `PhotosJson` array. Edit descriptions and photos with Azure Storage Explorer. `TableTrailService` loads the whole partition and matches in memory, and only writes a row when its status or reason changes, so `LastScrapedTime` means "status since".
- **Trail matching**: scraped results are matched to existing trails case-insensitively on `Trail.TrailNameForLookup`; unknown names create new `Trail` rows. Renaming a trail for display should change `TrailName`, not the lookup name.
- **Scraper**: `AngleSharpTrailScraper` parses the source HTML and infers status (Open/Closed/Caution/Freeze-Thaw). Base URL comes from the `Scraper` config section (`ScraperOptions`); the named HttpClient `ScraperClient` sends browser-like headers.
- **Storage config**: the `Storage` section (`StorageOptions`, registered by `AddTrailTableStorage`). `Storage:ConnectionString` (Azurite, or an account key kept in user secrets) wins; otherwise `Storage:AccountName` with `DefaultAzureCredential` (managed identity in Azure, `az login` locally). `Storage:TableName` defaults to `Trails`. Startup fails if neither is set.
- **API key**: `ApiKeyMiddleware` requires header `X-Api-Key` on `/api/*`, compared against `ApiKeys:ClientKey`. The Angular app sets this header per-request in `services/trail.service.ts`; the key is public (it ships in the frontend bundle), so it only deters casual use. CORS origins are hardcoded in `Api/Program.cs`.
- **Dev docs**: Swagger + Scalar UI are enabled only in Development.
- **Frontend config**: `src/environments/environment.ts` points `apiUrl` at the deployed Azure API (not localhost); `environment.prod.ts` is swapped in for production builds. The deployed API's CORS only allows port 4200, so the dev server must run on 4200 to load data.
- **Angular style**: standalone components only, built-in control flow (`@if`/`@for`), and explicit `ChangeDetectionStrategy.Eager` (added by the v22 migration to keep pre-v22 behavior; the app still uses zone.js).
- **Tailwind v4**: CSS-first config with no `tailwind.config.js`. Everything lives in `src/styles.css` (`@import 'tailwindcss'` plus an `@theme` block of design tokens such as `bg-ink`, `bg-card`, `text-dim`, `bg-brand` and `bg-status-*`), loaded through `@tailwindcss/postcss` in `.postcssrc.json`. The global stylesheet must stay `.css`, because Tailwind v4 does not support Sass.
- **Dark only**: there is no light theme or theme toggle; don't add `dark:` variants. The brand green (`--color-brand`) matches the logo and is also the "open" status color. Status labels, colors and sorting live in `models/trail-status.ts`; a trail with no status (one FORC doesn't monitor, e.g. Credit Island) counts as open. The page background is a soft glow in `components/page-backdrop.component.ts`: brand green by default, tinted to the open trail's status color via `BackdropService`.
- **Trail list routing**: `/` and `/trails/:id` both render `TrailListComponent`, and `SameComponentReuseStrategy` (in `app.routes.ts`) keeps it alive between them, so the route param alone opens or closes the details (a bottom sheet on phones, a side panel at `lg`). `CurrentStatus.LastScrapedTime` is only written when a status changes, so the UI uses it as "status since".
- **Deployment**: `.github/workflows/azure-static-web-apps-*.yml` builds the Angular app with Node 24 in GitHub Actions (Oryx's Node versions lag Angular's requirement) and uploads the prebuilt output with `skip_app_build`, on pushes to `main` touching `src/QCSingleTrack.Angular/**` or the workflow. `.github/workflows/api.yml` publishes the API with .NET 10 and deploys it to App Service `qcsingletrackapi20251126134734` on pushes touching the API, Application or Domain projects (or run it manually). It signs in to Azure with OpenID Connect via the `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` and `AZURE_SUBSCRIPTION_ID` repo secrets. Because `appsettings.json` is gitignored, production config lives in the App Service's app settings (`Storage__AccountName`, `ApiKeys__ClientKey`). The scraper console is deployed by hand: `dotnet publish` it and copy the output into `C:\Tools\QCScraper`, keeping that folder's `appsettings.json`.

`docs/gemini-original-plan.md` holds the original design plan.
