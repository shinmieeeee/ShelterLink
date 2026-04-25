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
        public async Task<IActionResult> Create(Animal animal)
        {
            _db.Animals.Add(animal);
            await _db.SaveChangesAsync();
            return Ok(animal);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Animal updated)
        {
            var animal = await _db.Animals.FindAsync(id);
            if (animal == null) return NotFound();
            animal.Name = updated.Name;
            await _db.SaveChangesAsync();
            return Ok(animal);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var animal = await _db.Animals.FindAsync(id);
            if (animal == null) return NotFound();
            _db.Animals.Remove(animal);
            await _db.SaveChangesAsync();
            return Ok();
        }
    }
}