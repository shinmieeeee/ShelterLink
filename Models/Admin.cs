using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShelterLink.Models
{
    public class Admin
    {
        [Key]
        public int AdminId { get; set; }

        // Foreign key to User
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}