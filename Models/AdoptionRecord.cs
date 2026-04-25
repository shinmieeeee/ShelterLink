using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShelterLink.Models
{
    public class AdoptionRecord
    {
        [Key]
        public int RecordId { get; set; }

        public int AppId { get; set; }

        [ForeignKey("AppId")]
        public AdoptionApplication? Application { get; set; }

        public int AnimalId { get; set; }

        [ForeignKey("AnimalId")]
        public Animal? Animal { get; set; }

        public int AdopterId { get; set; }

        [ForeignKey("AdopterId")]
        public Adopter? Adopter { get; set; }

        public DateTime CompletedAt { get; set; } = DateTime.Now;

        // Methods from UML
        public void FinalizeAdoption()
        {
            CompletedAt = DateTime.Now;
        }

        public void MarkAnimalAdopted(Animal animal)
        {
            animal.UpdateStatus(AnimalStatus.Adopted);
        }
    }
}