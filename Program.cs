using Microsoft.EntityFrameworkCore;
using Microsoft.Net.Http.Headers;
using ShelterLink.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var conn = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ShelterLinkContext>(options =>
    options.UseMySql(conn, ServerVersion.AutoDetect(conn)));

var app = builder.Build();

app.UseCors();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers[HeaderNames.CacheControl] = "no-cache, no-store, must-revalidate";
        ctx.Context.Response.Headers[HeaderNames.Pragma] = "no-cache";
        ctx.Context.Response.Headers[HeaderNames.Expires] = "0";
    }
});

app.UseRouting();
app.UseAuthorization();
app.MapControllers();

app.Run();
