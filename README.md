# QC SingleTrack

QC SingleTrack is a full-stack trail status platform for the Quad Cities biking community.  
It aggregates trail conditions from source data, stores normalized status history in SQL, exposes a secured API, and serves a modern Angular frontend for riders.

---

## Purpose

This project exists to answer one practical question quickly:

**“Can I ride right now, and what are trail conditions?”**

It does that by combining:

- Automated status scraping (timer-driven)
- Centralized trail data and status persistence
- Weather enrichment for each trail location
- API delivery to web/mobile clients
- A map-based, user-friendly frontend

---

## High-level architecture

1. A timer-triggered Azure Function runs on schedule.
2. The scraper pulls trail status information from source pages.
3. The application layer upserts status data into SQL via EF Core.
4. The API reads trail + status + photos and serves DTOs.
5. The Angular app calls the API (with `X-Api-Key`) and renders list/detail/map views.

---

## Repository layout

- [src/QCSingleTrack](src/QCSingleTrack) — .NET solution and backend projects
- [src/QCSingleTrack.Angular/trail-status-app](src/QCSingleTrack.Angular/trail-status-app) — Angular frontend app
- [docs/gemini-original-plan.md](docs/gemini-original-plan.md) — original implementation plan

### .NET projects

- [src/QCSingleTrack/QCSingleTrack.Api](src/QCSingleTrack/QCSingleTrack.Api)
	- ASP.NET Core API
	- API key middleware
	- trail and weather endpoints

- [src/QCSingleTrack/QCSingleTrack.TrailStatusScraperFn](src/QCSingleTrack/QCSingleTrack.TrailStatusScraperFn)
	- Azure Functions isolated worker
	- timer trigger + scraping orchestration

- [src/QCSingleTrack/QCSingleTrack.Application](src/QCSingleTrack/QCSingleTrack.Application)
	- scraping services (`AngleSharp`)
	- weather service (`Open-Meteo`)
	- core orchestration/business logic (`TrailService`)

- [src/QCSingleTrack/QCSingleTrack.Infrastructure.Data](src/QCSingleTrack/QCSingleTrack.Infrastructure.Data)
	- EF Core `DbContext`
	- configurations + migrations

- [src/QCSingleTrack/QCSingleTrack.Domain](src/QCSingleTrack/QCSingleTrack.Domain)
	- domain entities (`Trail`, `CurrentStatus`, `Photo`)

---

## Key functionality

### 1) Scheduled scraping and updates

- Trigger entry point: [src/QCSingleTrack/QCSingleTrack.TrailStatusScraperFn/Functions/ScraperTimerFunction.cs](src/QCSingleTrack/QCSingleTrack.TrailStatusScraperFn/Functions/ScraperTimerFunction.cs)
- Scraper implementation: [src/QCSingleTrack/QCSingleTrack.Application/Services/AngleSharpTrailScraper.cs](src/QCSingleTrack/QCSingleTrack.Application/Services/AngleSharpTrailScraper.cs)
- Persistence orchestration: [src/QCSingleTrack/QCSingleTrack.Application/Services/TrailService.cs](src/QCSingleTrack/QCSingleTrack.Application/Services/TrailService.cs)

The scraper parses trail blocks, infers status (Open/Closed/Caution/Freeze-Thaw), and updates current status data.

### 2) API delivery

API bootstrapping and DI: [src/QCSingleTrack/QCSingleTrack.Api/Program.cs](src/QCSingleTrack/QCSingleTrack.Api/Program.cs)

Controller: [src/QCSingleTrack/QCSingleTrack.Api/Controllers/TrailsController.cs](src/QCSingleTrack/QCSingleTrack.Api/Controllers/TrailsController.cs)

Main endpoints:

- `GET /api/trails` — trail list with current status and photos
- `GET /api/trails/{trailId}/weather` — weather summary for a single trail

Weather endpoint uses in-memory caching (10 minutes) to reduce external API calls.

### 3) API security

Middleware: [src/QCSingleTrack/QCSingleTrack.Api/Middleware/ApiKeyMiddleware.cs](src/QCSingleTrack/QCSingleTrack.Api/Middleware/ApiKeyMiddleware.cs)

- Requests to `/api/*` require header `X-Api-Key`
- Key is read from configuration (`ApiKeys:ClientKey`)

### 4) Weather enrichment

Service: [src/QCSingleTrack/QCSingleTrack.Application/Services/OpenMeteoWeatherService.cs](src/QCSingleTrack/QCSingleTrack.Application/Services/OpenMeteoWeatherService.cs)

- Uses `Open-Meteo` API
- Maps and aggregates hourly/daily weather
- Converts weather codes using lookup service

---

## Tech stack

### Backend

- .NET 10
- ASP.NET Core Web API
- Azure Functions (isolated worker)
- Entity Framework Core + SQL Server
- AngleSharp (HTML parsing)
- Application Insights

### Frontend

- Angular 22
- TypeScript
- Tailwind CSS 4
- Leaflet/OpenStreetMap

---

## Configuration and secrets

This repo uses configuration files plus environment variables.  
Examples include connection strings, API keys, telemetry values, and publish metadata.

Recommended approach:

- Keep production secrets in Azure App Settings / Key Vault
- Keep local secrets in local-only files
- Do not commit sensitive values

Current `.gitignore` has been updated to exclude common sensitive/local artifacts (`.vs`, publish profiles, service dependencies, appsettings variants, etc.).

---

## Local development

## Prerequisites

- .NET SDK 10
- Node.js 24.15+ and npm
- SQL Server (local or Azure SQL)
- Azure Functions Core Tools (for local Functions host)

## 1) Backend setup

Use the solution at [src/QCSingleTrack/QCSingleTrack.slnx](src/QCSingleTrack/QCSingleTrack.slnx).

Typical workflow:

- restore/build .NET projects
- apply migrations to your target DB
- run API project
- run Functions project

Configuration values expected:

- `ConnectionStrings:DefaultConnection` (or `ConnectionStrings__DefaultConnection` env var)
- `ApiKeys:ClientKey`

## 2) Frontend setup

Frontend location: [src/QCSingleTrack.Angular/trail-status-app](src/QCSingleTrack.Angular/trail-status-app)

Typical workflow:

- install packages
- run Angular dev server
- point environment config to your API URL

---

## Operational notes

- Scraper timer schedule is defined in the Function trigger attribute.
- API allows configured CORS origins for local dev and deployed frontend hosts.
- Weather endpoint is cached to protect both latency and provider quota.
- API OpenAPI/Scalar docs are enabled in development mode.

---

## Project status

The core platform is in place:

- Domain + EF data model
- Scheduled scraping
- Status persistence and updates
- Secured API endpoints
- Angular client integration

Remaining evolution areas typically include:

- stronger history/auditing model for status changes
- admin workflows for trail metadata/photos
- stronger secret rotation + CI secret scanning
- improved test coverage and deployment hardening

---

## License

No explicit license file is currently defined in this repository.