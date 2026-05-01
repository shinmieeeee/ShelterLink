using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShelterLink.Data;

namespace ShelterLink.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ShelterLinkContext _db;
        public DashboardController(ShelterLinkContext db) { _db = db; }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var featured = await _db.Animals
                .Where(a => a.Status == Models.AnimalStatus.Available)
                .OrderByDescending(a => a.DateAdmitted)
                .Take(6)
                .ToListAsync();

            var totalAvailable = await _db.Animals
                .CountAsync(a => a.Status == Models.AnimalStatus.Available);

            return Ok(new { featured, totalAvailable });
        }
    }
}