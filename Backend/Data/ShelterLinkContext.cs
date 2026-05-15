using Microsoft.EntityFrameworkCore;
using ShelterLink.Models;

namespace ShelterLink.Data
{
    public class ShelterLinkContext : DbContext
    {
        public ShelterLinkContext(DbContextOptions<ShelterLinkContext> options)
            : base(options) { }

        public DbSet<User>                Users                { get; set; }
        public DbSet<Admin>               Admins               { get; set; }
        public DbSet<Adopter>             Adopters             { get; set; }
        public DbSet<Animal>              Animals              { get; set; }
        public DbSet<AdoptionApplication> AdoptionApplications { get; set; }
        public DbSet<AdoptionRecord>      AdoptionRecords      { get; set; }
        public DbSet<Notification>        Notifications        { get; set; }
        public DbSet<AuditLog>            AuditLogs            { get; set; }
        public DbSet<Shelter>             Shelters             { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(e =>
            {
                e.HasKey(u => u.UserId);
                e.HasIndex(u => u.Email).IsUnique();
            });

            modelBuilder.Entity<Admin>(e =>
            {
                e.HasKey(a => a.AdminId);
                e.HasOne(a => a.User)
                 .WithOne()
                 .HasForeignKey<Admin>(a => a.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Adopter>(e =>
            {
                e.HasKey(a => a.AdopterId);
                e.HasOne(a => a.User)
                 .WithOne()
                 .HasForeignKey<Adopter>(a => a.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Animal>(e =>
            {
                e.HasKey(a => a.AnimalId);
                e.Property(a => a.Status)
                 .HasConversion<string>()
                 .HasDefaultValue(AnimalStatus.Available);
            });

            modelBuilder.Entity<AdoptionApplication>(e =>
            {
                e.HasKey(a => a.ApplicationId);
                e.Property(a => a.Status)
                 .HasConversion<string>()
                 .HasDefaultValue(ApplicationStatus.Pending);
                e.HasOne(a => a.Adopter)
                 .WithMany()
                 .HasForeignKey(a => a.AdopterId)
                 .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(a => a.Animal)
                 .WithMany()
                 .HasForeignKey(a => a.AnimalId)
                 .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(a => a.Reviewer)
                 .WithMany()
                 .HasForeignKey(a => a.ReviewedBy)
                 .IsRequired(false)
                 .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<AdoptionRecord>(e =>
            {
                e.HasKey(r => r.RecordId);
                e.HasOne(r => r.Application)
                 .WithOne()
                 .HasForeignKey<AdoptionRecord>(r => r.AppId)
                 .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(r => r.Animal)
                 .WithMany()
                 .HasForeignKey(r => r.AnimalId)
                 .OnDelete(DeleteBehavior.Restrict);
                e.HasOne(r => r.Adopter)
                 .WithMany()
                 .HasForeignKey(r => r.AdopterId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Notification>(e =>
            {
                e.HasKey(n => n.NotifId);
                e.HasOne(n => n.Recipient)
                 .WithMany()
                 .HasForeignKey(n => n.RecipientId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<AuditLog>(e =>
            {
                e.HasKey(l => l.LogId);
                e.HasOne(l => l.Actor)
                 .WithMany()
                 .HasForeignKey(l => l.ActorId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Shelter>(e =>
            {
                e.HasKey(s => s.ShelterId);
            });
        }
    }
}