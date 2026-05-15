using Microsoft.AspNetCore.Mvc;
using ShelterLink.Data;

namespace ShelterLink.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ShelterLinkContext _db;
        public UsersController(ShelterLinkContext db) { _db = db; }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProfile(int id, [FromBody] UpdateProfileRequest req)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (_db.Users.Any(u => u.Email == req.Email && u.UserId != id))
                return BadRequest(new { message = "Email already in use." });

            user.Name  = req.Name;
            user.Email = req.Email;
            if (!string.IsNullOrWhiteSpace(req.Password))
                user.PasswordHash = req.Password;

            await _db.SaveChangesAsync();

            return Ok(new { userId = user.UserId, name = user.Name, email = user.Email, role = user.Role });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound();
            return Ok(new { userId = user.UserId, name = user.Name, email = user.Email, role = user.Role });
        }
    }

    public class UpdateProfileRequest
    {
        public string Name     { get; set; } = string.Empty;
        public string Email    { get; set; } = string.Empty;
        public string? Password { get; set; }
    }
}