using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShelterLink.Data;
using ShelterLink.Models;

namespace ShelterLink.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ApplicationsController : ControllerBase
    {
        private readonly ShelterLinkContext _db;
        public ApplicationsController(ShelterLinkContext db) { _db = db; }

        // GET /api/applications/user/{adopterId}
        [HttpGet("user/{adopterId}")]
        public async Task<IActionResult> GetByAdopter(int adopterId)
        {
            var apps = await _db.AdoptionApplications
                .Include(a => a.Animal)
                .Include(a => a.Adopter)
                .Where(a => a.AdopterId == adopterId)
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();

            return Ok(apps);
        }

        // GET /api/applications  (all, for admin)
[HttpGet]
public async Task<IActionResult> GetAll()
{
    var apps = await _db.AdoptionApplications
        .Include(a => a.Animal)
        .Include(a => a.Adopter).ThenInclude(ad => ad.User)
        .OrderByDescending(a => a.SubmittedAt)
        .ToListAsync();
    return Ok(apps);
}

        // PUT /api/applications/{id}/status  (approve/reject)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdate req)
        {
            var app = await _db.AdoptionApplications.Include(a => a.Animal).FirstOrDefaultAsync(a => a.ApplicationId == id);
            if (app == null) return NotFound();

            app.Status = Enum.Parse<ApplicationStatus>(req.Status);

            // If approved, mark animal as adopted
            if (app.Status == ApplicationStatus.Approved && app.Animal != null)
                app.Animal.Status = AnimalStatus.Adopted;

            // If rejected, free the animal back to available
            if (app.Status == ApplicationStatus.Rejected && app.Animal != null)
                app.Animal.Status = AnimalStatus.Available;

            await _db.SaveChangesAsync();
            return Ok(app);
        }

        public class StatusUpdate { public string Status { get; set; } = ""; }

        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] ApplicationRequest req)
        {
            var adopter = await _db.Adopters.FindAsync(req.AdopterId);
            if (adopter == null)
                return BadRequest(new { message = "Adopter not found." });

            var animal = await _db.Animals.FindAsync(req.AnimalId);
            if (animal == null || animal.Status != AnimalStatus.Available)
                return BadRequest(new { message = "Animal is not available." });

            var existing = await _db.AdoptionApplications
                .AnyAsync(a => a.AdopterId == req.AdopterId
                            && a.AnimalId == req.AnimalId
                            && (a.Status == ApplicationStatus.Pending || a.Status == ApplicationStatus.UnderReview));
            if (existing)
                return BadRequest(new { message = "You already have a pending application for this animal." });

            var app = new AdoptionApplication
            {
                AdopterId   = req.AdopterId,
                AnimalId    = req.AnimalId,
                SubmittedAt = DateTime.Now,
                Status      = ApplicationStatus.Pending,
            };

            animal.Status = AnimalStatus.Pending;

            _db.AdoptionApplications.Add(app);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, applicationId = app.ApplicationId });
        }
    }

    public class ApplicationRequest
    {
        public int AdopterId { get; set; }
        public int AnimalId  { get; set; }
    }
}
