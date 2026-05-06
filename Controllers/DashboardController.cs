
 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShelterLink.Data;
using ShelterLink.Models;
 
namespace ShelterLink.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ShelterLinkContext _db;
 
        // CHANGE 2: Constructor injection – same pattern as every other controller
        public DashboardController(ShelterLinkContext db) { _db = db; }
 
        // ── GET /api/dashboard/summary ────────────────────────────────
        // Used by the user dashboard home view AND readable by the admin
        // dashboard's "View All" link. Returns only public-safe counts.
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var featured = await _db.Animals
                .Where(a => a.Status == AnimalStatus.Available)
                .OrderByDescending(a => a.DateAdmitted)
                .Take(6)
                .ToListAsync();
 
            var totalAvailable = await _db.Animals
                .CountAsync(a => a.Status == AnimalStatus.Available);
 
            return Ok(new { featured, totalAvailable });
        }
 
        // ── GET /api/dashboard/user/{userId} ──────────────────────────
        // CHANGE 1: Returns a combined payload (animals + user's apps +
        // unread notification count) in a single request so the user
        // dashboard avoids three separate round-trips on load.
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserDashboard(int userId)
        {
            // Look up the adopter record linked to this user
            var adopter = await _db.Adopters
                .FirstOrDefaultAsync(a => a.UserId == userId);
 
            List<AdoptionApplication> applications = new();
            int unreadNotifications = 0;
 
            if (adopter != null)
            {
                applications = await _db.AdoptionApplications
                    .Include(a => a.Animal)
                    .Where(a => a.AdopterId == adopter.AdopterId)
                    .OrderByDescending(a => a.SubmittedAt)
                    .ToListAsync();
 
                unreadNotifications = await _db.Notifications
                    .CountAsync(n => n.RecipientId == userId && !n.IsRead);
            }
 
            var availableAnimals = await _db.Animals
                .Where(a => a.Status == AnimalStatus.Available)
                .OrderByDescending(a => a.DateAdmitted)
                .Take(6)
                .ToListAsync();
 
            return Ok(new
            {
                adopterId            = adopter?.AdopterId,
                availableAnimals,
                applications,
                unreadNotifications,
            });
        }
    }
}