🚀 Full Implementation Plan: Trail Status Tracker
This plan is structured for a solo developer using a robust C#/.NET backend and a modern CI/CD workflow.
🛠️ Phase 1: The Data Foundation (C# & Azure SQL)
This phase establishes the non-negotiable data core using Entity Framework Core (EF Core).
1.0 C# Project Setup (Single Solution)
 * Solution Structure: Create a single Visual Studio Solution to contain all projects:
   * TrailStatus.Core: C# Class Library for shared models and DbContext.
   * TrailStatus.ScraperFn: C# Azure Function (Timer Trigger).
   * TrailStatus.ApiFn: C# Azure Function (HTTP Trigger).
 * Data Model: Define the TrailStatus class in TrailStatus.Core.
   public class TrailStatus
{
    public int TrailId { get; set; } // Primary Key
    public string TrailName { get; set; }
    public string Status { get; set; } // Scraped data
    public string Reason { get; set; }
    public DateTime LastScrapedTime { get; set; }
    public decimal Latitude { get; set; } // Map data
    public decimal Longitude { get; set; }
    public decimal Rain24h { get; set; } // Weather data
    public decimal CurrentTemp { get; set; } // Weather data
}

 * Database & EF Setup: Provision Azure SQL Database. Configure Dependency Injection in both Function Apps to inject the DbContext class.
 * Initial Schema: Use EF Core Migrations (Add-Migration, Update-Database) to create the initial TrailStatus table in Azure SQL.
1.1 QCSingleTrack.TrailStatusScraperFn (Timer Trigger - Every 10 min)
 * Web Scraping: Use HttpClient and the AngleSharp library (NuGet package) to fetch and parse the source website's HTML, extracting the Status and Reason.
 * Weather Integration: Use HttpClient to call a Weather API (e.g., OpenWeatherMap) using the stored Latitude and Longitude to fetch Rain24h and CurrentTemp.
 * Database Write: Use the injected DbContext to update the corresponding trail entry with the new Status, Reason, LastScrapedTime, and all weather metrics.
1.2 TrailStatus.ApiFn (HTTP Trigger - /api/trails)
 * Data Retrieval: Use the injected DbContext to query and retrieve the full list of TrailStatus objects.
 * Output: Return the list as a clean JSON object using C#'s built-in serialization (OkObjectResult(allTrails)).
 * CORS: Configure CORS on this Function App to allow access from your frontend domain.
📸 Phase 2: Frontend & Feature Integration
This phase connects the frontend to the API and implements the core visual features.
 * Frontend Framework: (e.g., Angular/React/Vue) Set up the project and use environment files to store the base URL of your deployed ApiFn.
 * API Consumption: Write a service to call the /api/trails endpoint on page load and store the JSON response.
 * Homepage (Status Hub):
   * Global Banner: Display overall status based on the API data (e.g., "All Open" or "Partial Closures").
   * Trail Cards: Dynamically generate cards, using the API's Status field to apply immediate Color Coding (Green/Red/Yellow).
 * Details Page:
   * Google Map: Embed a simple map using the Google Maps JavaScript API and the trail's Latitude/Longitude to display a single pin.
   * Weather Display: Display the Rain24h and CurrentTemp data, which came directly from your fast C# API call.
   * Gallery: Implement a simple carousel or viewer for the trail images, including the static trail map image, hosted on Azure Blob Storage.
🔒 Phase 3: Application Security & Authentication
Since you don't care about the user, you need to protect the API from other non-authorized apps.
 * Authentication Method: Implement API Key authentication (recommended for simplicity).
 * Key Storage: Store the secret key securely in the Azure Function App Application Settings.
 * Angular: Store the key in your Angular environment variables. Use an HTTP Interceptor to attach the key to every request header (e.g., X-API-Key).
 * C# Backend: Implement an Authorization Middleware in the ApiFn that checks the incoming X-API-Key header against the stored secret before allowing the request to proceed.
☁️ Phase 4: CI/CD with GitHub Actions (The Deployment)
This automates building and deployment upon every code push.
4.1 Initial Setup
 * Azure Service Principal: Create an Azure Service Principal via the Azure CLI to grant GitHub permission to deploy.
 * GitHub Secrets: Store the Service Principal JSON as a repository secret named AZURE_CREDENTIALS.
 * Azure Static Web App (SWA): Create the SWA resource in Azure. Link it to your GitHub repo to automatically generate the deployment YAML file for your frontend.
4.2 GitHub Workflows
 * azure-functions.yml: A workflow file that handles the C# backend.
   * Login: Uses the AZURE_CREDENTIALS secret to authenticate.
   * Build: Uses dotnet build to build the entire solution (including the shared Core).
   * Deploy: Uses the azure/functions-action to publish both the ScraperFn and ApiFn projects to your single Azure Function App resource.
 * SWA Generated Workflow: The automated SWA file handles:
   * Building your Angular/Frontend project.
   * Deploying the static files.
   * Linking: Automatically routing /api requests from the frontend to your deployed Azure Function App.
