using System.ComponentModel.DataAnnotations;

namespace ShelterLink.Models
{
    public enum AnimalStatus
    {
        Available,
        Pending,
        Adopted,
        Quarantine
    }

    public class Animal
    {
        [Key]
        public int AnimalId { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Species { get; set; } = string.Empty;

        public string Breed { get; set; } = string.Empty;

        // Age stored as float to match UML
        public float Age { get; set; }

        public AnimalStatus Status { get; set; } = AnimalStatus.Available;

        public string PhotoPath { get; set; } = string.Empty;

        public string SpecialNotes { get; set; } = string.Empty;

        public DateTime DateAdmitted { get; set; } = DateTime.Now;

        public void UpdateStatus(AnimalStatus newStatus)
        {
            Status = newStatus;
        }

        public bool IsAvailable()
        {
            return Status == AnimalStatus.Available;
        }
    }
}