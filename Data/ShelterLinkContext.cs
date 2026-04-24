using Microsoft.EntityFrameworkCore;

namespace ShelterLink.Data
{
    public class ShelterLinkContext : DbContext
    {
        public ShelterLinkContext(DbContextOptions<ShelterLinkContext> options)
            : base(options) { }
    }
}