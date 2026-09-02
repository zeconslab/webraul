using System.ComponentModel.DataAnnotations;

namespace webraul.Models;

public sealed class SiteSettings
{
    public int Id { get; set; }
    [Required, MaxLength(120)] public string OwnerName { get; set; } = "Raúl Pimentel";
    [Required, MaxLength(160)] public string Headline { get; set; } = "Desarrollador Web Full Stack";
    [MaxLength(240)] public string HeroText { get; set; } = string.Empty;
    [EmailAddress, MaxLength(160)] public string Email { get; set; } = string.Empty;
    [MaxLength(40)] public string Phone { get; set; } = string.Empty;
    [MaxLength(160)] public string Location { get; set; } = string.Empty;
    [MaxLength(300)] public string LinkedInUrl { get; set; } = string.Empty;
    [MaxLength(300)] public string GitHubUrl { get; set; } = string.Empty;

    [Required, MaxLength(70)] public string SeoTitle { get; set; } = string.Empty;
    [Required, MaxLength(200)] public string SeoDescription { get; set; } = string.Empty;
    [MaxLength(300)] public string SeoKeywords { get; set; } = string.Empty;
    [MaxLength(500)] public string? SeoImageUrl { get; set; }
    [MaxLength(100)] public string? GoogleSiteVerification { get; set; }
    public bool IsIndexable { get; set; } = true;
}

public abstract class OrderedContent
{
    public int Id { get; set; }
    public int SortOrder { get; set; }
    public bool IsPublished { get; set; } = true;
}

public sealed class ServiceItem : OrderedContent
{
    [Required, MaxLength(120)] public string Title { get; set; } = string.Empty;
    [Required, MaxLength(600)] public string Description { get; set; } = string.Empty;
    [MaxLength(80)] public string Icon { get; set; } = "code";
}

public sealed class Project : OrderedContent
{
    [Required, MaxLength(140)] public string Title { get; set; } = string.Empty;
    [Required, MaxLength(140)] public string Slug { get; set; } = string.Empty;
    [Required, MaxLength(1200)] public string Description { get; set; } = string.Empty;
    [MaxLength(500)] public string Technologies { get; set; } = string.Empty;
    [MaxLength(800)] public string Features { get; set; } = string.Empty;
    [Url, MaxLength(500)] public string? WebsiteUrl { get; set; }
    [MaxLength(500)] public string? DesktopImageUrl { get; set; }
    [MaxLength(500)] public string? MobileImageUrl { get; set; }
    [MaxLength(80)] public string Category { get; set; } = "web";
    [MaxLength(80)] public string Badge { get; set; } = "Proyecto completado";
}

public sealed class FaqItem : OrderedContent
{
    [Required, MaxLength(300)] public string Question { get; set; } = string.Empty;
    [Required, MaxLength(1400)] public string Answer { get; set; } = string.Empty;
}

public sealed class AppItem : OrderedContent
{
    [Required, MaxLength(120)] public string Name { get; set; } = string.Empty;
    [Required, MaxLength(500)] public string Description { get; set; } = string.Empty;
    [MaxLength(80)] public string Icon { get; set; } = "apps";
    [Url, MaxLength(500)] public string? Url { get; set; }
    [MaxLength(500)] public string? ImageUrl { get; set; }
    [MaxLength(500)] public string Technologies { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string ProjectType { get; set; } = "personal";
}

public sealed class PageVisit
{
    public long Id { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    [Required, MaxLength(64)] public string VisitorHash { get; set; } = string.Empty;
}

public sealed class ContactMessage
{
    public int Id { get; set; }
    [Required, MaxLength(120)] public string Name { get; set; } = string.Empty;
    [Required, EmailAddress, MaxLength(160)] public string Email { get; set; } = string.Empty;
    [Required, MaxLength(3000)] public string Message { get; set; } = string.Empty;
    [MaxLength(120)] public string? ServiceCategory { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; }
}
