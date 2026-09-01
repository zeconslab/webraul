using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using webraul.Models;

namespace webraul.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext(options)
{
    public DbSet<SiteSettings> SiteSettings => Set<SiteSettings>();
    public DbSet<ServiceItem> Services => Set<ServiceItem>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<FaqItem> Faqs => Set<FaqItem>();
    public DbSet<AppItem> Apps => Set<AppItem>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<PageVisit> PageVisits => Set<PageVisit>();
}
