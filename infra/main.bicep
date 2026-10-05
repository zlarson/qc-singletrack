// QC Bike Trails: every Azure resource in QC-SingleTrack-RG, as deployed in Oct 2026.
// Written to match the live resources, so a what-if against the resource group shows no changes.
// Not managed here: the qcbiketrails.com domain registration (a purchase) and the auto-created
// Application Insights smart detection alerts.

@description('Region for the regional resources.')
param location string = 'centralus'

@description('API key the site sends in X-Api-Key. It ships in the public frontend bundle, so it only deters casual use.')
@secure()
param apiClientKey string

@description('Entra object ID of the person whose scheduled scraper writes trail statuses (signs in with az login).')
param scraperUserObjectId string = 'a8e692be-63ec-4e90-9f5d-ebab9be06e39'

@description('Log Analytics workspace behind Application Insights (Azure\'s default workspace, in another resource group).')
param logAnalyticsWorkspaceId string = '/subscriptions/${subscription().subscriptionId}/resourcegroups/DefaultResourceGroup-CUS/providers/Microsoft.OperationalInsights/workspaces/DefaultWorkspace-${subscription().subscriptionId}-CUS'

var domainName = 'qcbiketrails.com'
var githubRepo = 'zlarson/qc-singletrack'

// Built-in role definition IDs.
var roles = {
  storageTableDataReader: '76199698-9eea-4c19-bc75-cec21354c6b6'
  storageTableDataContributor: '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'
  websiteContributor: 'de139f84-1756-47ae-9be6-808fbbe84772'
}

// ---------- Storage: trail photos (public blobs) and the Trails table ----------

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'qcsingletracksa'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    // trail-photos is served straight to the site, so blob public access stays on.
    allowBlobPublicAccess: true
    allowCrossTenantReplication: false
    allowSharedKeyAccess: true
    defaultToOAuthAuthentication: false
    dnsEndpointType: 'Standard'
    largeFileSharesState: 'Enabled'
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Enabled'
    supportsHttpsTrafficOnly: true
    encryption: {
      keySource: 'Microsoft.Storage'
      requireInfrastructureEncryption: false
      services: {
        blob: {
          enabled: true
          keyType: 'Account'
        }
        file: {
          enabled: true
          keyType: 'Account'
        }
      }
    }
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
      ipRules: []
      virtualNetworkRules: []
    }
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 7
    }
    deleteRetentionPolicy: {
      enabled: true
      days: 7
      allowPermanentDelete: false
    }
    cors: {
      corsRules: []
    }
  }
}

resource trailPhotos 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'trail-photos'
  properties: {
    publicAccess: 'Blob'
    defaultEncryptionScope: '$account-encryption-key'
    denyEncryptionScopeOverride: false
  }
}

// Final backup of the retired SQL database (qc-singletrack-db-20261005.bacpac).
resource sqlBackups 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'sql-backups'
  properties: {
    publicAccess: 'None'
    defaultEncryptionScope: '$account-encryption-key'
    denyEncryptionScopeOverride: false
  }
}

resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource trailsTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-05-01' = {
  parent: tableService
  name: 'Trails'
}

// ---------- Monitoring ----------

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'qc-singletrack-appinsights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Redfield'
    Request_Source: 'IbizaAIExtension'
    RetentionInDays: 90
    IngestionMode: 'Disabled'
    WorkspaceResourceId: logAnalyticsWorkspaceId
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// ---------- API: App Service on the Free tier ----------

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'qc-singletrack-asp'
  location: location
  kind: 'linux'
  sku: {
    name: 'F1'
    tier: 'Free'
  }
  properties: {
    reserved: true // Linux
  }
}

resource api 'Microsoft.Web/sites@2023-12-01' = {
  name: 'QCSingleTrackApi20251126134734'
  location: location
  kind: 'app,linux'
  tags: {
    'hidden-link: /app-insights-resource-id': appInsights.id
    'hidden-related:${plan.id}': 'empty'
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    clientAffinityEnabled: true
    publicNetworkAccess: 'Enabled'
    keyVaultReferenceIdentity: 'SystemAssigned'
    reserved: true
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|10.0'
      alwaysOn: false // not available on Free
      http20Enabled: false
      ftpsState: 'FtpsOnly'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      use32BitWorkerProcess: true
      numberOfWorkers: 1
    }
  }
}

// appsettings is a full replacement, so every setting the app has is listed here.
resource apiSettings 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: api
  name: 'appsettings'
  properties: {
    Storage__AccountName: storage.name
    ApiKeys__ClientKey: apiClientKey
    APPINSIGHTS_INSTRUMENTATIONKEY: appInsights.properties.InstrumentationKey
    APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.properties.ConnectionString
    ApplicationInsightsAgent_EXTENSION_VERSION: '~2'
    XDT_MicrosoftApplicationInsights_Mode: 'recommended'
    APPINSIGHTS_PROFILERFEATURE_VERSION: '1.0.0'
    DiagnosticServices_EXTENSION_VERSION: '~3'
    APPINSIGHTS_SNAPSHOTFEATURE_VERSION: '1.0.0'
    SnapshotDebugger_EXTENSION_VERSION: 'disabled'
    InstrumentationEngine_EXTENSION_VERSION: 'disabled'
    XDT_MicrosoftApplicationInsights_BaseExtensions: 'disabled'
    XDT_MicrosoftApplicationInsights_PreemptSdk: 'disabled'
    IGNORE_APPINSIGHTS_SDK: 'disabled'
    DISABLE_APPINSIGHTS_SDK: 'disabled'
    APPLICATIONINSIGHTS_ENABLESQLQUERYCOLLECTION: 'disabled'
  }
}

// Basic-auth publishing stays off; GitHub Actions deploys with OpenID Connect instead.
resource scmBasicAuth 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01' = {
  parent: api
  name: 'scm'
  properties: {
    allow: false
  }
}

resource ftpBasicAuth 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2023-12-01' = {
  parent: api
  name: 'ftp'
  properties: {
    allow: false
  }
}

// ---------- Website: Static Web App ----------

// The GitHub link is set up by Azure when the app is first connected to the repo; recreating it
// from this template would also need a repositoryToken.
resource site 'Microsoft.Web/staticSites@2024-04-01' = {
  name: 'qc-singletrack'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: 'https://github.com/${githubRepo}'
    branch: 'main'
    provider: 'GitHub'
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

resource siteDomain 'Microsoft.Web/staticSites/customDomains@2024-04-01' = {
  parent: site
  name: domainName
  properties: {}
}

// ---------- DNS ----------

resource dnsZone 'Microsoft.Network/dnsZones@2018-05-01' = {
  name: domainName
  location: 'global'
  properties: {
    zoneType: 'Public'
  }
}

// Apex alias to the Static Web App.
resource apexRecord 'Microsoft.Network/dnsZones/A@2018-05-01' = {
  parent: dnsZone
  name: '@'
  properties: {
    TTL: 3600
    targetResource: {
      id: site.id
    }
  }
}

// Domain ownership check for the Static Web App custom domain.
resource apexTxt 'Microsoft.Network/dnsZones/TXT@2018-05-01' = {
  parent: dnsZone
  name: '@'
  properties: {
    TTL: 3600
    TXTRecords: [
      {
        value: [
          '_2hpgrw7qobakgy04yxch84gfximanq1'
        ]
      }
    ]
  }
}

// ---------- GitHub Actions deploy identity ----------

resource deployIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: 'qcbiketrails-github-deploy'
  location: location
}

// Only workflow runs on main in this repo can sign in as the deploy identity.
resource githubMain 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials@2023-01-31' = {
  parent: deployIdentity
  name: 'github-main'
  properties: {
    issuer: 'https://token.actions.githubusercontent.com'
    subject: 'repo:${githubRepo}:ref:refs/heads/main'
    audiences: [
      'api://AzureADTokenExchange'
    ]
  }
}

// ---------- Role assignments ----------
// The names are the IDs of the existing assignments, so redeploying updates them instead of adding duplicates.

resource apiReadsTrails 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storage
  name: '4eeafabb-5cfd-433b-9833-1a2fad7d64f2'
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.storageTableDataReader)
    principalId: api.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource scraperWritesTrails 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storage
  name: '7267d491-aeac-4567-a91e-1daeb7dc2e96'
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.storageTableDataContributor)
    principalId: scraperUserObjectId
    principalType: 'User'
  }
}

resource githubDeploysApi 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: api
  name: '0917db45-0f31-4209-ac17-f3da35bdabce'
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roles.websiteContributor)
    principalId: deployIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

output apiHostName string = api.properties.defaultHostName
output deployIdentityClientId string = deployIdentity.properties.clientId
