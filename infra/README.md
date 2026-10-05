# Infrastructure

`main.bicep` describes every Azure resource in the `QC-SingleTrack-RG` resource group as it's deployed:

- **Storage** `qcsingletracksa`: the `Trails` table, the public `trail-photos` container, and `sql-backups` (the final backup of the retired SQL database)
- **API**: App Service plan `qc-singletrack-asp` (Free F1) and app `QCSingleTrackApi20251126134734`, with its managed identity and app settings
- **Website**: Static Web App `qc-singletrack` (Free) with the `qcbiketrails.com` custom domain
- **DNS** zone `qcbiketrails.com`
- **Application Insights** `qc-singletrack-appinsights`
- **GitHub deploy identity** `qcbiketrails-github-deploy`, trusted only for workflow runs on `main`
- **Role assignments**: the API reads the Trails table, the scheduled scraper's user writes it, and the deploy identity deploys the API

Not included: the `qcbiketrails.com` domain registration (a purchase) and the auto-created Application Insights smart detection alerts.

Nothing deploys this automatically. Neither GitHub workflow runs for changes in `infra/`.

## Preview changes

`what-if` is read-only. It shows what a deployment would change without changing anything. The API key is the one in the frontend's `environment.prod.ts`.

```bash
az deployment group what-if -g QC-SingleTrack-RG --template-file infra/main.bicep --parameters apiClientKey=<api key>
```

With the template in sync, the preview creates and deletes nothing. These lines still appear, and they're expected:

- **Role assignments and app settings** show values as `[reference(...)]`. The preview can't resolve values read from other resources ahead of time; the deployed values are the same.
- **The API app** shows `siteConfig` settings as created. The preview reads the app without its full site config, and the template's values match the live ones.
- **Read-only fields Azure sets itself** show as deleted: the plan's `freeOfferExpirationTime`, the Static Web App's `stableInboundIP`, `trafficSplitting` and `deploymentAuthPolicy`, and the custom domain's certificate details.

## Deploy

```bash
az deployment group create -g QC-SingleTrack-RG --template-file infra/main.bicep --parameters apiClientKey=<api key>
```

Run the preview first. Deploying restarts the API.

To build these resources from scratch in a new resource group, a few things need extra steps: the Static Web App needs a GitHub `repositoryToken` to connect to the repo, the custom domain's TXT validation value changes, and the GitHub repo secrets (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`) need the new deploy identity's IDs.
