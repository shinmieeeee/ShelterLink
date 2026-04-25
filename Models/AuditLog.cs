using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShelterLink.Models
{
    public class AuditLog
    {
        [Key]
        public int LogId { get; set; }

        public int ActorId { get; set; }

        [ForeignKey("ActorId")]
        public User? Actor { get; set; }

        [Required]
        public string Action { get; set; } = string.Empty;

        public int TargetId { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.Now;

        public bool IsFlagged { get; set; } = false;

        // Methods from UML
        public void LogAction() { }

        public void FlagAbuse()
        {
            IsFlagged = true;
        }
    }
}