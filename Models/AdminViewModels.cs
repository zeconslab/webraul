namespace webraul.Models;

public sealed record DailyActivity(DateTime Date, int Count);

public sealed record ContentHealth(string Label, int Published, int Draft);

public sealed record ModuleHeadViewModel(string Path, string Title, string Subtitle);

public sealed record VisitSummary(string Label, int Total, int Unique);

public sealed record AdminDashboardViewModel(
    int Services, int Projects, int Faqs, int Apps, int UnreadMessages,
    IReadOnlyList<ContactMessage> RecentMessages,
    IReadOnlyList<DailyActivity> Activity,
    IReadOnlyList<ContentHealth> ContentHealth,
    IReadOnlyList<DailyActivity> VisitsActivity,
    IReadOnlyList<VisitSummary> VisitSummaries);
