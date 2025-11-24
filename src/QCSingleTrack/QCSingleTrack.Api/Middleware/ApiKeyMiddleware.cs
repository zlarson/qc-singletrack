public class ApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiKeyMiddleware> _logger;
    private readonly string _headerName;

    public ApiKeyMiddleware(RequestDelegate next, ILogger<ApiKeyMiddleware> logger, string headerName)
    {
        _next = next;
        _logger = logger;
        _headerName = headerName;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // For open endpoints or non-API calls, allow through
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(_headerName, out var extractedApiKey))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsync("API Key missing");
            return;
        }

        // Validate against configuration
        var configKey = context.RequestServices.GetService(typeof(Microsoft.Extensions.Configuration.IConfiguration)) as IConfiguration;
        var configuredKey = configKey?["ApiKeys:ClientKey"];

        if (string.IsNullOrWhiteSpace(configuredKey) || !string.Equals(configuredKey, extractedApiKey.ToString(), StringComparison.Ordinal))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsync("Invalid API Key");
            return;
        }

        await _next(context);
    }
}
