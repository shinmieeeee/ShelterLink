// ============================================================
//  Controllers/ApplicationsController.cs  –  FIXED + EXPANDED
//
//  CHANGE 2 – DB Persistence:
//  When an admin approves or rejects an application the system now
//  also writes a Notification row to the DB for the adopter so that
//  the user dashboard's Notifications view shows a real DB-backed
//  entry instead of relying on session-only in-memory state.
//
//  This is the missing link between admin actions and user visibility.
// ============================================================

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

        // ── GET /api/applications/user/{adopterId} ────────────────────
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

        // ── GET /api/applications  (all, for admin) ───────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var apps = await _db.AdoptionApplications
                .Include(a => a.Animal)
                .Include(a => a.Adopter).ThenInclude(ad => ad!.User)
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();

            return Ok(apps);
        }

        // ── PUT /api/applications/{id}/status  (approve / reject) ─────
        // CHANGE 2: Now also creates a Notification row so the adopter
        // sees the decision on their dashboard without polling.
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdate req)
        {
            var app = await _db.AdoptionApplications
                .Include(a => a.Animal)
                .Include(a => a.Adopter)
                .FirstOrDefaultAsync(a => a.ApplicationId == id);

            if (app == null) return NotFound();

            if (!Enum.TryParse<ApplicationStatus>(req.Status, ignoreCase: true, out var newStatus))
                return BadRequest(new { message = $"Invalid status: {req.Status}" });

            app.Status = newStatus;

            // Sync animal status with application decision
            if (app.Animal != null)
            {
                app.Animal.Status = newStatus switch
                {
                    ApplicationStatus.Approved  => AnimalStatus.Adopted,
                    ApplicationStatus.Rejected  => AnimalStatus.Available,
                    ApplicationStatus.Pending   => AnimalStatus.Pending,
                    _                           => app.Animal.Status
                };
            }

            // CHANGE 2: Write a persistent Notification so the adopter's
            // user dashboard shows the decision from the DB, not just
            // the admin's in-memory toast.
            if (app.Adopter != null &&
                (newStatus == ApplicationStatus.Approved ||
                 newStatus == ApplicationStatus.Rejected))
            {
                var animalName = app.Animal?.Name ?? "an animal";
                var message    = newStatus == ApplicationStatus.Approved
                    ? $"🎉 Your adoption application for {animalName} has been approved!"
                    : $"Your adoption application for {animalName} was not approved this time.";

                _db.Notifications.Add(new Notification
                {
                    RecipientId = app.Adopter.UserId,
                    Message     = message,
                    SentAt      = DateTime.Now,
                    IsRead      = false,
                });
            }

            await _db.SaveChangesAsync();   // saves app, animal, AND notification in one transaction
            return Ok(new { success = true, applicationId = app.ApplicationId, status = app.Status.ToString() });
        }

        // ── POST /api/applications  (submit adoption request) ─────────
        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] ApplicationRequest req)
        {
            var adopter = await _db.Adopters.FindAsync(req.AdopterId);
            if (adopter == null)
                return BadRequest(new { message = "Adopter not found." });

            var animal = await _db.Animals.FindAsync(req.AnimalId);
            if (animal == null || animal.Status != AnimalStatus.Available)
                return BadRequest(new { message = "Animal is not available." });

            bool alreadyApplied = await _db.AdoptionApplications
                .AnyAsync(a => a.AdopterId == req.AdopterId
                            && a.AnimalId  == req.AnimalId
                            && (a.Status == ApplicationStatus.Pending ||
                                a.Status == ApplicationStatus.UnderReview));

            if (alreadyApplied)
                return BadRequest(new { message = "You already have a pending application for this animal." });

            var application = new AdoptionApplication
            {
                AdopterId   = req.AdopterId,
                AnimalId    = req.AnimalId,
                SubmittedAt = DateTime.Now,
                Status      = ApplicationStatus.Pending,
            };

            animal.Status = AnimalStatus.Pending;   // mark animal as pending

            _db.AdoptionApplications.Add(application);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, applicationId = application.ApplicationId });
        }
    }

    public class StatusUpdate
    {
        public string Status { get; set; } = string.Empty;
    }

    public class ApplicationRequest
    {
        public int AdopterId { get; set; }
        public int AnimalId  { get; set; }
    }
}