using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShelterLink.Models
{
    public enum ApplicationStatus
    {
        Pending,
        UnderReview,
        Approved,
        Rejected,
        Completed,
        Cancelled
    }

    public class AdoptionApplication
    {
        [Key]
        public int ApplicationId { get; set; }

        public int AdopterId { get; set; }

        [ForeignKey("AdopterId")]
        public Adopter? Adopter { get; set; }

        public int AnimalId { get; set; }

        [ForeignKey("AnimalId")]
        public Animal? Animal { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.Now;

        public ApplicationStatus Status { get; set; } = ApplicationStatus.Pending;

        public int? ReviewedBy { get; set; }

        [ForeignKey("ReviewedBy")]
        public User? Reviewer { get; set; }

        public string? RejectionReason { get; set; }

        // ── Adoption Application Form Answers ──
        public string? ApplicantFullName   { get; set; }
        public string? ApplicantAddress    { get; set; }
        public string? ApplicantPhone      { get; set; }
        public string? HousingType         { get; set; }  // Own/Rent, House/Apartment
        public bool?   HasYard             { get; set; }
        public bool?   HasOtherPets        { get; set; }
        public string? OtherPetsDetails    { get; set; }
        public bool?   HasChildren         { get; set; }
        public string? ChildrenAges        { get; set; }
        public string? AdoptionReason      { get; set; }
        public string? DailyRoutine        { get; set; }
        public string? VetReference        { get; set; }
        public bool?   AgreeToTerms        { get; set; }

        // ── Interview Scheduling ──
        public DateTime? InterviewScheduledAt { get; set; }
        public bool?     AdopterConfirmed     { get; set; }  // null=pending, true=confirmed, false=requested reschedule
        public bool?     RescheduleRequested  { get; set; }

        public void Submit()
        {
            Status = ApplicationStatus.Pending;
        }

        public void Approve()
        {
            Status = ApplicationStatus.Approved;
        }

        public void Reject()
        {
            Status = ApplicationStatus.Rejected;
        }

        public bool CheckAgeRestriction(int applicantAge, string species)
        {
            return species.ToLower() switch
            {
                "cat"  => applicantAge >= 13,
                "dog"  => applicantAge >= 15,
                _      => applicantAge >= 18
            };
        }
    }
}