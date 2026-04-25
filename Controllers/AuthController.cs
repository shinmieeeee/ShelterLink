using Microsoft.AspNetCore.Mvc;
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
                Name = request.Username,
                Email = request.Email,
                PasswordHash = request.Password,
                Role = "Adopter"
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Account created!", redirectUrl = "login.html" });
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var user = _db.Users.FirstOrDefault(u =>
                u.Email == request.Email && u.PasswordHash == request.Password);

            if (user == null)
                return Unauthorized(new { success = false, message = "Invalid email or password." });

            return Ok(new { success = true, message = "Login successful!", role = user.Role });
        }
    }

    public class RegisterRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}