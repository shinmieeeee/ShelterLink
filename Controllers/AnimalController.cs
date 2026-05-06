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
 
        // ── GET /api/animal ──────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _db.Animals.ToListAsync());
 
        // ── GET /api/animal/{id} ─────────────────────────────────────
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var animal = await _db.Animals.FindAsync(id);
            return animal == null ? NotFound() : Ok(animal);
        }
 
        // ── POST /api/animal  (ADD ANIMAL – WAS BROKEN, NOW FIXED) ───
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AnimalDto dto)
        {
            // Validate required fields before touching the DB
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { message = "Name is required." });
 
            if (string.IsNullOrWhiteSpace(dto.Species))
                return BadRequest(new { message = "Species is required." });
 
            // FIX 1: Parse Status from the incoming string explicitly.
            // If the client sends an unrecognised value we return 400
            // instead of letting EF throw a cryptic DB exception.
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
 
        // ── PUT /api/animal/{id}  (EDIT ANIMAL) ──────────────────────
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
 
        // ── DELETE /api/animal/{id} ───────────────────────────────────
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
 
    // ── DTO ──────────────────────────────────────────────────────────
    // Accepts Status as a plain string from the JS frontend.
    // This decouples serialisation from the C# enum, which is the
    // direct fix for the "failed to save" crash.
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
 