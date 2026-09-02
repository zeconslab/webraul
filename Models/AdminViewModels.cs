using System.ComponentModel.DataAnnotations;

namespace webraul.Models;

public sealed class GeneralSettingsInput
{
    [Required, MaxLength(120)] public string OwnerName { get; set; } = string.Empty;
    [Required, MaxLength(160)] public string Headline { get; set; } = string.Empty;
    [MaxLength(240)] public string HeroText { get; set; } = string.Empty;
    [EmailAddress, MaxLength(160)] public string Email { get; set; } = string.Empty;
    [MaxLength(40)] public string Phone { get; set; } = string.Empty;
    [MaxLength(160)] public string Location { get; set; } = string.Empty;
    [MaxLength(300)] public string LinkedInUrl { get; set; } = string.Empty;
    [MaxLength(300)] public string GitHubUrl { get; set; } = string.Empty;
}

public sealed class SeoSettingsInput
{
    [Required, MaxLength(70)] public string SeoTitle { get; set; } = string.Empty;
    [Required, MaxLength(200)] public string SeoDescription { get; set; } = string.Empty;
    [MaxLength(300)] public string SeoKeywords { get; set; } = string.Empty;
    public string? SeoImageUrl { get; set; }
    [MaxLength(100)] public string? GoogleSiteVerification { get; set; }
    public bool IsIndexable { get; set; }
}

public sealed record DailyActivity(DateTime Date, int Count);

public sealed record ContentHealth(string Label, int Published, int Draft);

public sealed record ModuleHeadViewModel(string Path, string Title, string Subtitle);

public sealed record VisitSummary(string Label, int Total, int Unique);

public sealed record PagedMessages(IReadOnlyList<ContactMessage> Items, int Page, int TotalPages, int TotalCount);

public sealed record AdminDashboardViewModel(
    int Services, int Projects, int Faqs, int Apps, int UnreadMessages,
    IReadOnlyList<ContactMessage> RecentMessages,
    IReadOnlyList<DailyActivity> Activity,
    IReadOnlyList<ContentHealth> ContentHealth,
    IReadOnlyList<DailyActivity> VisitsActivity,
    IReadOnlyList<VisitSummary> VisitSummaries);
