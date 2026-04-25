using Microsoft.EntityFrameworkCore;
using ShelterLink.Models;

namespace ShelterLink.Data
{
    public class ShelterLinkContext : DbContext
    {
        public ShelterLinkContext(DbContextOptions<ShelterLinkContext> options)
            : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Adopter> Adopters { get; set; }
        public DbSet<Animal> Animals { get; set; }
        public DbSet<AdoptionApplication> AdoptionApplications { get; set; }
        public DbSet<AdoptionRecord> AdoptionRecords { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Shelter> Shelters { get; set; }
    }
}