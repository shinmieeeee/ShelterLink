using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShelterLink.Models
{
    public class Notification
    {
        [Key]
        public int NotifId { get; set; }

        public int RecipientId { get; set; }

        [ForeignKey("RecipientId")]
        public User? Recipient { get; set; }

        [Required]
        public string Message { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.Now;

        public bool IsRead { get; set; } = false;

        public void Send() { }

        public void MarkRead()
        {
            IsRead = true;
        }
    }
}