using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShelterLink.Data;
using ShelterLink.Models;
 
namespace ShelterLink.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ShelterLinkContext _db;
 
        public AdminController(ShelterLinkContext db) { _db = db; }
 
        private IActionResult? RequireAdmin()
        {
            var role = Request.Headers["X-User-Role"].FirstOrDefault() ?? string.Empty;
            if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
                return Forbid();
            return null;   // null means "caller may proceed"
        }
 
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            if (RequireAdmin() is { } deny) return deny;
 
            var totalAnimals   = await _db.Animals.CountAsync();
            var totalPending   = await _db.AdoptionApplications
                                          .CountAsync(a => a.Status == ApplicationStatus.Pending);
            var totalApproved  = await _db.AdoptionApplications
                                          .CountAsync(a => a.Status == ApplicationStatus.Approved);
            var totalRejected  = await _db.AdoptionApplications
                                          .CountAsync(a => a.Status == ApplicationStatus.Rejected);
 
            return Ok(new
            {
                totalAnimals,
                totalPending,
                totalApproved,
                totalRejected,
            });
        }
 
        [HttpGet("auditlogs")]
        public async Task<IActionResult> GetAuditLogs()
        {
            if (RequireAdmin() is { } deny) return deny;
 
            var logs = await _db.AuditLogs
                .Include(l => l.Actor)
                .OrderByDescending(l => l.Timestamp)
                .Take(100)
                .Select(l => new
                {
                    l.LogId,
                    actorName = l.Actor != null ? l.Actor.Name : "System",
                    l.Action,
                    l.TargetId,
                    l.Timestamp,
                    l.IsFlagged,
                })
                .ToListAsync();
 
            return Ok(logs);
        }
 
        [HttpPost("auditlogs")]
        public async Task<IActionResult> WriteAuditLog([FromBody] AuditLogRequest req)
        {
            if (RequireAdmin() is { } deny) return deny;
 
            if (req.ActorId <= 0)
                return BadRequest(new { message = "ActorId is required." });
 
            var entry = new AuditLog
            {
                ActorId   = req.ActorId,
                Action    = req.Action ?? string.Empty,
                TargetId  = req.TargetId,
                Timestamp = DateTime.Now,
                IsFlagged = false,
            };
 
            _db.AuditLogs.Add(entry);
            await _db.SaveChangesAsync();   
 
            return Ok(new { logId = entry.LogId });
        }
 
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            if (RequireAdmin() is { } deny) return deny;
 
            var users = await _db.Users
                .Select(u => new { u.UserId, u.Name, u.Email, u.Role })
                .ToListAsync();
 
            return Ok(users);
        }
 
        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] RoleUpdateRequest req)
        {
            if (RequireAdmin() is { } deny) return deny;
 
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();
 
            var validRoles = new[] { "Admin", "Adopter" };
            if (!validRoles.Contains(req.Role))
                return BadRequest(new { message = $"Invalid role. Must be one of: {string.Join(", ", validRoles)}" });
 
            user.Role = req.Role;
 
            _db.Users.Update(user);
            await _db.SaveChangesAsync();
 
            return Ok(new { userId = user.UserId, role = user.Role });
        }
    }
 
    // ── Request DTOs ─────────────────────────────────────────────────
    public class AuditLogRequest
    {
        public int     ActorId  { get; set; }
        public string? Action   { get; set; }
        public int     TargetId { get; set; }
    }
 
    public class RoleUpdateRequest
    {
        public string Role { get; set; } = string.Empty;
    }
}