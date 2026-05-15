using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShelterLink.Data;
using ShelterLink.Models;

namespace ShelterLink.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ApplicationsController : ControllerBase
    {
        private readonly ShelterLinkContext _db;
        public ApplicationsController(ShelterLinkContext db) { _db = db; }

        [HttpGet("user/{adopterId}")]
        public async Task<IActionResult> GetByAdopter(int adopterId)
        {
            var apps = await _db.AdoptionApplications
                .Include(a => a.Animal)
                .Include(a => a.Adopter)
                .Where(a => a.AdopterId == adopterId)
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();
            return Ok(apps);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var apps = await _db.AdoptionApplications
                .Include(a => a.Animal)
                .Include(a => a.Adopter).ThenInclude(ad => ad!.User)
                .OrderByDescending(a => a.SubmittedAt)
                .ToListAsync();
            return Ok(apps);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdate req)
        {
            var app = await _db.AdoptionApplications
                .Include(a => a.Animal)
                .Include(a => a.Adopter)
                .FirstOrDefaultAsync(a => a.ApplicationId == id);
            if (app == null) return NotFound();

            if (!Enum.TryParse<ApplicationStatus>(req.Status, ignoreCase: true, out var newStatus))
                return BadRequest(new { message = $"Invalid status: {req.Status}" });

            app.Status = newStatus;
            if (req.RejectionReason != null) app.RejectionReason = req.RejectionReason;

            if (app.Animal != null)
            {
                app.Animal.Status = newStatus switch
                {
                    ApplicationStatus.Approved => AnimalStatus.Adopted,
                    ApplicationStatus.Rejected => AnimalStatus.Available,
                    ApplicationStatus.Pending  => AnimalStatus.Pending,
                    _                          => app.Animal.Status
                };
            }

            if (app.Adopter != null &&
                (newStatus == ApplicationStatus.Approved || newStatus == ApplicationStatus.Rejected))
            {
                var animalName = app.Animal?.Name ?? "an animal";
                var message = newStatus == ApplicationStatus.Approved
                    ? $"APPROVED:{animalName}"
                    : $"REJECTED:{animalName}:{(string.IsNullOrEmpty(app.RejectionReason) ? "No reason specified." : app.RejectionReason)}";

                _db.Notifications.Add(new Notification
                {
                    RecipientId = app.Adopter.UserId,
                    Message     = message,
                    SentAt      = DateTime.Now,
                    IsRead      = false,
                });
            }

            await _db.SaveChangesAsync();
            return Ok(new { success = true, applicationId = app.ApplicationId, status = app.Status.ToString() });
        }

        [HttpPut("{id}/interview")]
        public async Task<IActionResult> ScheduleInterview(int id, [FromBody] InterviewSchedule req)
        {
            var app = await _db.AdoptionApplications
                .Include(a => a.Animal)
                .Include(a => a.Adopter)
                .FirstOrDefaultAsync(a => a.ApplicationId == id);
            if (app == null) return NotFound();

            app.InterviewScheduledAt = req.ScheduledAt;
            app.AdopterConfirmed     = null;
            app.RescheduleRequested  = false;
            app.Status               = ApplicationStatus.UnderReview;

            if (app.Adopter != null)
            {
                var animalName = app.Animal?.Name ?? "an animal";
                _db.Notifications.Add(new Notification
                {
                    RecipientId = app.Adopter.UserId,
                    Message     = $"INTERVIEW_SCHEDULED:{animalName}:{req.ScheduledAt:yyyy-MM-ddTHH:mm:ss}:{app.ApplicationId}",
                    SentAt      = DateTime.Now,
                    IsRead      = false,
                });
            }

            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpPut("{id}/confirm")]
        public async Task<IActionResult> ConfirmInterview(int id, [FromBody] ConfirmRequest req)
        {
            var app = await _db.AdoptionApplications
                .Include(a => a.Animal)
                .FirstOrDefaultAsync(a => a.ApplicationId == id);
            if (app == null) return NotFound();

            app.AdopterConfirmed    = req.Confirmed;
            app.RescheduleRequested = !req.Confirmed;
            await _db.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpPost]
        public async Task<IActionResult> Submit([FromBody] ApplicationRequest req)
        {
            var adopter = await _db.Adopters.FindAsync(req.AdopterId);
            if (adopter == null) return BadRequest(new { message = "Adopter not found." });

            var animal = await _db.Animals.FindAsync(req.AnimalId);
            if (animal == null || animal.Status != AnimalStatus.Available)
                return BadRequest(new { message = "Animal is not available." });

            bool alreadyApplied = await _db.AdoptionApplications
                .AnyAsync(a => a.AdopterId == req.AdopterId
                            && a.AnimalId  == req.AnimalId
                            && (a.Status == ApplicationStatus.Pending ||
                                a.Status == ApplicationStatus.UnderReview));
            if (alreadyApplied)
                return BadRequest(new { message = "You already have a pending application for this animal." });

            var application = new AdoptionApplication
            {
                AdopterId         = req.AdopterId,
                AnimalId          = req.AnimalId,
                SubmittedAt       = DateTime.Now,
                Status            = ApplicationStatus.Pending,
                ApplicantFullName = req.ApplicantFullName,
                ApplicantAddress  = req.ApplicantAddress,
                ApplicantPhone    = req.ApplicantPhone,
                HousingType       = req.HousingType,
                HasYard           = req.HasYard,
                HasOtherPets      = req.HasOtherPets,
                OtherPetsDetails  = req.OtherPetsDetails,
                HasChildren       = req.HasChildren,
                ChildrenAges      = req.ChildrenAges,
                AdoptionReason    = req.AdoptionReason,
                DailyRoutine      = req.DailyRoutine,
                VetReference      = req.VetReference,
                AgreeToTerms      = req.AgreeToTerms,
            };

            animal.Status = AnimalStatus.Pending;
            _db.AdoptionApplications.Add(application);
            await _db.SaveChangesAsync();
            return Ok(new { success = true, applicationId = application.ApplicationId });
        }
    }

    public class StatusUpdate
    {
        public string  Status          { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }
    }

    public class InterviewSchedule { public DateTime ScheduledAt { get; set; } }
    public class ConfirmRequest    { public bool     Confirmed   { get; set; } }

    public class ApplicationRequest
    {
        public int     AdopterId         { get; set; }
        public int     AnimalId          { get; set; }
        public string? ApplicantFullName  { get; set; }
        public string? ApplicantAddress   { get; set; }
        public string? ApplicantPhone     { get; set; }
        public string? HousingType        { get; set; }
        public bool?   HasYard            { get; set; }
        public bool?   HasOtherPets       { get; set; }
        public string? OtherPetsDetails   { get; set; }
        public bool?   HasChildren        { get; set; }
        public string? ChildrenAges       { get; set; }
        public string? AdoptionReason     { get; set; }
        public string? DailyRoutine       { get; set; }
        public string? VetReference       { get; set; }
        public bool?   AgreeToTerms       { get; set; }
    }
}
