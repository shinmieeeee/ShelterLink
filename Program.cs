using Microsoft.EntityFrameworkCore;
using ShelterLink.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ShelterLinkContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    ));

builder.Services.AddControllers();

builder.Services.AddCors(options =>
    options.AddPolicy("AllowAll",
        p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

app.UseCors("AllowAll");
app.UseStaticFiles();
app.MapControllers();

app.Run();