using Azure.Core;
using Azure.Data.Tables;
using Azure.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace QCSingleTrack.Application.Storage;

/// <summary>Binds the "Storage" config section.</summary>
public sealed class StorageOptions
{
    /// <summary>Full connection string (Azurite, or an account key kept in user secrets). Takes precedence.</summary>
    public string? ConnectionString { get; set; }

    /// <summary>Storage account name, used with Entra ID (managed identity in Azure, az login locally).</summary>
    public string? AccountName { get; set; }

    public string TableName { get; set; } = "Trails";
}

public static class TrailStorageServiceCollectionExtensions
{
    /// <summary>
    /// Registers the trails <see cref="TableClient"/> from the "Storage" config section: a connection string
    /// when one is set, otherwise the account name with <paramref name="credential"/>, or <see cref="DefaultAzureCredential"/>
    /// if none is given.
    /// </summary>
    public static IServiceCollection AddTrailTableStorage(this IServiceCollection services, IConfiguration configuration, TokenCredential? credential = null)
    {
        var options = configuration.GetSection("Storage").Get<StorageOptions>() ?? new StorageOptions();

        TableClient client;
        if (!string.IsNullOrWhiteSpace(options.ConnectionString))
        {
            client = new TableClient(options.ConnectionString, options.TableName);
        }
        else if (!string.IsNullOrWhiteSpace(options.AccountName))
        {
            client = new TableClient(new Uri($"https://{options.AccountName}.table.core.windows.net"), options.TableName, credential ?? new DefaultAzureCredential());
        }
        else
        {
            throw new InvalidOperationException("Configure Storage:ConnectionString or Storage:AccountName.");
        }

        return services.AddSingleton(client);
    }
}
