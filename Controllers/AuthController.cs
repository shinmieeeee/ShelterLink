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

<<<<<<< HEAD
=======
            // Create Adopter profile automatically
>>>>>>> 41a8b0b73edac4d73c5ccc71d04cf1ff7ab377fe
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
<<<<<<< HEAD
            // Support login by username (Name) OR email, case-insensitive
            var identifier = (request.Email ?? "").Trim();
            var allUsers   = await _db.Users.ToListAsync();

            var user = allUsers.FirstOrDefault(u =>
                (string.Equals(u.Name,  identifier, StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(u.Email, identifier, StringComparison.OrdinalIgnoreCase))
                && u.PasswordHash == request.Password);
=======
            var user = await _db.Users.FirstOrDefaultAsync(u =>
                u.Email == request.Email && u.PasswordHash == request.Password);
>>>>>>> 41a8b0b73edac4d73c5ccc71d04cf1ff7ab377fe

            if (user == null)
                return Unauthorized(new { success = false, message = "Invalid email or password." });

<<<<<<< HEAD
=======
            // Get adopterId if role is Adopter
>>>>>>> 41a8b0b73edac4d73c5ccc71d04cf1ff7ab377fe
            int? adopterId = null;
            if (user.Role == "Adopter")
            {
                var adopter = await _db.Adopters.FirstOrDefaultAsync(a => a.UserId == user.UserId);
                adopterId = adopter?.AdopterId;
            }

            return Ok(new
            {
                success     = true,
                message     = "Login successful!",
<<<<<<< HEAD
                redirectUrl = "/html/dashboard.html",
=======
                redirectUrl = "dashboard.html",
>>>>>>> 41a8b0b73edac4d73c5ccc71d04cf1ff7ab377fe
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
