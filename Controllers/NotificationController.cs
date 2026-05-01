using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShelterLink.Data;

namespace ShelterLink.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly ShelterLinkContext _db;
        public NotificationsController(ShelterLinkContext db) { _db = db; }

        // GET /api/notifications/{userId}
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            var notifs = await _db.Notifications
                .Where(n => n.RecipientId == userId)
                .OrderByDescending(n => n.SentAt)
                .ToListAsync();

            return Ok(notifs);
        }

        // PUT /api/notifications/markread/{userId}
        [HttpPut("markread/{userId}")]
        public async Task<IActionResult> MarkAllRead(int userId)
        {
            var unread = await _db.Notifications
                .Where(n => n.RecipientId == userId && !n.IsRead)
                .ToListAsync();

            unread.ForEach(n => n.IsRead = true);
            await _db.SaveChangesAsync();

            return Ok(new { updated = unread.Count });
        }
    }
}