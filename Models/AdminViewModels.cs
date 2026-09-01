namespace webraul.Models;

public sealed record AdminDashboardViewModel(
    int Services, int Projects, int Faqs, int Apps, int UnreadMessages,
    IReadOnlyList<ContactMessage> RecentMessages);

public sealed record AdminContentViewModel(
    SiteSettings Settings,
    IReadOnlyList<ServiceItem> Services,
    IReadOnlyList<Project> Projects,
    IReadOnlyList<FaqItem> Faqs,
    IReadOnlyList<AppItem> Apps);
