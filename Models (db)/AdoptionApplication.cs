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