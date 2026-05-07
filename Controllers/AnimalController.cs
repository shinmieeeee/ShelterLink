using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShelterLink.Data;
using ShelterLink.Models;
 
namespace ShelterLink.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnimalController : ControllerBase
    {
        private readonly ShelterLinkContext _db;
        public AnimalController(ShelterLinkContext db) { _db = db; }
 
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _db.Animals.ToListAsync());
 
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var animal = await _db.Animals.FindAsync(id);
            return animal == null ? NotFound() : Ok(animal);
        }
         [HttpPost]
        public async Task<IActionResult> Create([FromBody] AnimalDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Name is required." });
 
            if (string.IsNullOrWhiteSpace(dto.Species))
                return BadRequest(new { message = "Species is required." });
 
            if (!Enum.TryParse<AnimalStatus>(dto.Status, ignoreCase: true, out var status))
                status = AnimalStatus.Available;   // safe default
 
            var animal = new Animal
            {
                Name         = dto.Name.Trim(),
                Species      = dto.Species.Trim(),
                Breed        = dto.Breed?.Trim()        ?? string.Empty,
                Age          = dto.Age,
                Status       = status,                  // ← enum, not raw string
                SpecialNotes = dto.SpecialNotes?.Trim() ?? string.Empty,
                PhotoPath    = dto.PhotoPath?.Trim()    ?? string.Empty,
                DateAdmitted = DateTime.Now,            // always set server-side
            };
 
            _db.Animals.Add(animal);
            await _db.SaveChangesAsync();
 
            return Ok(animal);
        }
 
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AnimalDto dto)
        {
            var animal = await _db.Animals.FindAsync(id);
            if (animal == null) return NotFound();
 
            // FIX 1 (same as Create): explicit enum parse
            if (!Enum.TryParse<AnimalStatus>(dto.Status, ignoreCase: true, out var status))
                status = animal.Status;              // keep existing on bad input
 
            animal.Name         = dto.Name?.Trim()         ?? animal.Name;
            animal.Species      = dto.Species?.Trim()       ?? animal.Species;
            animal.Breed        = dto.Breed?.Trim()         ?? animal.Breed;
            animal.Age          = dto.Age;
            animal.Status       = status;
            animal.SpecialNotes = dto.SpecialNotes?.Trim()  ?? animal.SpecialNotes;
            animal.PhotoPath    = dto.PhotoPath?.Trim()     ?? animal.PhotoPath;
 
            await _db.SaveChangesAsync();
            return Ok(animal);
        }
 
        [HttpPost("upload-photo")]
        public async Task<IActionResult> UploadPhoto(IFormFile photo)
        {
            if (photo == null || photo.Length == 0)
                return BadRequest(new { message = "No file uploaded." });

            var allowed = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            if (!allowed.Contains(photo.ContentType.ToLower()))
                return BadRequest(new { message = "Only image files are allowed (jpg, png, gif, webp)." });

            if (photo.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "Image must be under 5 MB." });

            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "animals");
            Directory.CreateDirectory(uploadsDir);

            var ext      = Path.GetExtension(photo.FileName).ToLower();
            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
                await photo.CopyToAsync(stream);

            return Ok(new { photoPath = $"/images/animals/{fileName}" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var animal = await _db.Animals.FindAsync(id);
            if (animal == null) return NotFound();
 
            // Guard: do not delete an animal that has active/pending applications
            bool hasActiveApps = await _db.AdoptionApplications
                .AnyAsync(a => a.AnimalId == id &&
                               (a.Status == ApplicationStatus.Pending ||
                                a.Status == ApplicationStatus.UnderReview));
 
            if (hasActiveApps)
                return BadRequest(new { message = "Cannot delete: animal has pending applications." });
 
            _db.Animals.Remove(animal);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Animal removed." });
        }
    }
 
    public class AnimalDto
    {
        public string  Name         { get; set; } = string.Empty;
        public string  Species      { get; set; } = string.Empty;
        public string  Breed        { get; set; } = string.Empty;
        public float   Age          { get; set; }
        public string  Status       { get; set; } = "Available";
        public string? SpecialNotes { get; set; }
        public string? PhotoPath    { get; set; }
    }
}