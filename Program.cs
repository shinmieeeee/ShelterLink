using Microsoft.EntityFrameworkCore;
using Microsoft.Net.Http.Headers;
using System.Text.Json.Serialization;
using ShelterLink.Data;

var builder = WebApplication.CreateBuilder(args);

// ── JSON serialisation ────────────────────────────────────────────
// CRITICAL FIX: JsonStringEnumConverter makes Status serialise as
// "Available" / "Pending" / "Adopted" instead of 0 / 1 / 2.
// This is the companion server-side fix to AnimalController's
// Enum.TryParse change. Both are required together.
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        opts.JsonSerializerOptions.DefaultIgnoreCondition =
            JsonIgnoreCondition.WhenWritingNull;
    });

// ── CORS ──────────────────────────────────────────────────────────
// Same-origin requests (HTML served by the same ASP.NET process)
// don't need CORS at all, but keep it for local dev tooling.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.SetIsOriginAllowed(_ => true)   // tighten in production
              .AllowAnyMethod()
              .AllowAnyHeader());
});

// ── Database ──────────────────────────────────────────────────────
var conn = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ShelterLinkContext>(options =>
    options.UseMySql(conn, ServerVersion.AutoDetect(conn)));

// ─────────────────────────────────────────────────────────────────
var app = builder.Build();

app.UseCors();

// FIX: UseDefaultFiles maps "/" → "/html/login.html" (or index.html).
// Must come BEFORE UseStaticFiles.
app.UseDefaultFiles();

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers[HeaderNames.CacheControl] =
            "no-cache, no-store, must-revalidate";
        ctx.Context.Response.Headers[HeaderNames.Pragma] = "no-cache";
        ctx.Context.Response.Headers[HeaderNames.Expires] = "0";
    }
});

app.UseRouting();
app.UseAuthorization();
app.MapControllers();

app.Run();