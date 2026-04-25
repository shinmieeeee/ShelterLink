using System.ComponentModel.DataAnnotations;

namespace ShelterLink.Models
{
    public class Shelter
    {
        [Key]
        public int ShelterId { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public int Capacity { get; set; }

        public int CurrentCount { get; set; }

        // Method from UML
        public bool IsOvercrowded()
        {
            return CurrentCount >= Capacity;
        }
    }
}