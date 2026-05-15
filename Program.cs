using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.Net.Http.Headers;
using System.Text.Json.Serialization;
using ShelterLink.Data;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        opts.JsonSerializerOptions.DefaultIgnoreCondition =
            JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.SetIsOriginAllowed(_ => true)   // tighten in production
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var conn = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ShelterLinkContext>(options =>
    options.UseMySql(conn, ServerVersion.AutoDetect(conn)));

var app = builder.Build();

app.UseCors();

var wwwrootPath = Path.Combine(builder.Environment.ContentRootPath, "Frontend", "wwwroot");

var fileProvider = new PhysicalFileProvider(wwwrootPath);

app.UseDefaultFiles(new DefaultFilesOptions
{
    FileProvider = fileProvider,
    RequestPath  = ""
});

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = fileProvider,
    RequestPath  = "",
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