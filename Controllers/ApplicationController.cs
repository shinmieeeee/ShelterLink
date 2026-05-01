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

        // POST /api/applications
        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] ApplicationRequest req)
        {
            // Check adopter exists
            var adopter = await _db.Adopters.FindAsync(req.AdopterId);
            if (adopter == null)
                return BadRequest(new { message = "Adopter not found." });

            // Check animal is available
            var animal = await _db.Animals.FindAsync(req.AnimalId);
            if (animal == null || animal.Status != AnimalStatus.Available)
                return BadRequest(new { message = "Animal is not available." });

            // Check no duplicate pending application
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

            // Mark animal as pending
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