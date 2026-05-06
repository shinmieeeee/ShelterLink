using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShelterLink.Data;
using ShelterLink.Models;

namespace ShelterLink.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ShelterLinkContext _db;
        public AuthController(ShelterLinkContext db) { _db = db; }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (_db.Users.Any(u => u.Email == request.Email))
                return BadRequest(new { success = false, message = "Email already exists." });

            var user = new User
            {
                Name         = request.Username,
                Email        = request.Email,
                PasswordHash = request.Password,
                Role         = "Adopter"
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            var adopter = new Adopter
            {
                UserId  = user.UserId,
                Name    = request.Username,
                Age     = request.Age,
                Address = string.Empty,
            };
            _db.Adopters.Add(adopter);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Account created!", redirectUrl = "login.html" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var identifier = (request.Email ?? "").Trim();
            var allUsers   = await _db.Users.ToListAsync();

            var user = allUsers.FirstOrDefault(u =>
                (string.Equals(u.Name,  identifier, StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(u.Email, identifier, StringComparison.OrdinalIgnoreCase))
                && u.PasswordHash == request.Password);

            if (user == null)
                return Unauthorized(new { success = false, message = "Invalid email or password." });

            // Block admin from user login
            if (user.Role == "Admin")
                return Unauthorized(new { success = false, message = "Invalid email or password." });

            int? adopterId = null;
            if (user.Role == "Adopter")
            {
                var adopter = await _db.Adopters.FirstOrDefaultAsync(a => a.UserId == user.UserId);

                if (adopter == null)
{
    adopter = new Adopter
    {
        UserId  = user.UserId,
        Name    = user.Name,
        Age     = 0,
        Address = string.Empty,
    };
    _db.Adopters.Add(adopter);
    await _db.SaveChangesAsync();
}

adopterId = adopter.AdopterId;
            }

            return Ok(new
{
    success     = true,
    message     = "Login successful!",
    redirectUrl = "/html/dashboard.html",
    debug       = new { foundAdopterId = adopterId, userId = user.UserId },
    user = new
    {
        userId    = user.UserId,
        name      = user.Name,
        email     = user.Email,
        role      = user.Role,
        adopterId = adopterId,
    }
});
        }

        [HttpPost("admin-login")]
        public async Task<IActionResult> AdminLogin([FromBody] LoginRequest request)
        {
            var identifier = (request.Email ?? "").Trim();
            var allUsers   = await _db.Users.ToListAsync();

            var user = allUsers.FirstOrDefault(u =>
                (string.Equals(u.Name,  identifier, StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(u.Email, identifier, StringComparison.OrdinalIgnoreCase))
                && u.PasswordHash == request.Password);

            if (user == null)
                return Unauthorized(new { success = false, message = "Invalid username or password." });

            // Only allow Admin role
            if (user.Role != "Admin")
                return Unauthorized(new { success = false, message = "Invalid username or password." });

            return Ok(new
            {
                success     = true,
                message     = "Login successful!",
                redirectUrl = "/html/admin-dashboard.html",
                user = new
                {
                    userId = user.UserId,
                    name   = user.Name,
                    email  = user.Email,
                    role   = user.Role,
                }
            });
        }
    }

    public class RegisterRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email    { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public int    Age      { get; set; }
    }

    public class LoginRequest
    {
        public string Email    { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}