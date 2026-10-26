using System.ComponentModel.DataAnnotations;

namespace webraul.Models;

public sealed class GeneralSettingsInput
{
    [Required, MaxLength(120)] public string OwnerName { get; set; } = string.Empty;
    [Required, MaxLength(160)] public string Headline { get; set; } = string.Empty;
    [MaxLength(240)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string HeroText { get; set; } = string.Empty;
    [EmailAddress, MaxLength(160)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Email { get; set; } = string.Empty;
    [MaxLength(40)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Phone { get; set; } = string.Empty;
    [MaxLength(160)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Location { get; set; } = string.Empty;
    [MaxLength(300)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string LinkedInUrl { get; set; } = string.Empty;
    [MaxLength(300)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string GitHubUrl { get; set; } = string.Empty;
}

public sealed class SeoSettingsInput
{
    [Required, MaxLength(70)] public string SeoTitle { get; set; } = string.Empty;
    [Required, MaxLength(200)] public string SeoDescription { get; set; } = string.Empty;
    [MaxLength(300)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string SeoKeywords { get; set; } = string.Empty;
    public string? SeoImageUrl { get; set; }
    [MaxLength(100)] public string? GoogleSiteVerification { get; set; }
    public bool IsIndexable { get; set; }
}

public sealed record DailyActivity(DateTime Date, int Count);


/// <summary>Un pendiente de "Salud del sitio". ModalUrl abre el formulario; Url navega.</summary>
public sealed record HealthCheck(bool Ok, string Title, string Detail, string? ActionLabel = null, string? Url = null, string? ModalUrl = null);

public sealed record Kpi(int Current, int Previous)
{
    public int Delta => Current - Previous;
}

public sealed record FunnelStep(string Label, int Count);

public sealed record AdminDashboardViewModel(
    int WaitingCount, DateTime? OldestWaitingUtc,
    Kpi NewLeads, Kpi UniqueVisitors, double ConversionRate, int Diagnostics, int DiagnosticLeads,
    IReadOnlyList<ContactMessage> RecentLeads,
    IReadOnlyList<HealthCheck> Health,
    IReadOnlyList<DailyActivity> Visits, IReadOnlyList<DailyActivity> Leads,
    IReadOnlyList<FunnelStep> Funnel);

public sealed record InboxViewModel(
    IReadOnlyList<ContactMessage> Items, ContactMessage? Selected, string Stage,
    IReadOnlyDictionary<string, int> StageCounts, int Page, int TotalPages);

public sealed record FileEntry(string Name, string Path, bool IsFolder, long Size, DateTime ModifiedUtc, int ItemCount);

public sealed record FilesViewModel(string Folder, IReadOnlyList<FileEntry> Entries)
{
    /// <summary>Migas de pan: cada carpeta con su ruta acumulada.</summary>
    public IEnumerable<(string Name, string Path)> Breadcrumb =>
        Folder.Split('/', StringSplitOptions.RemoveEmptyEntries).Select((name, i) => (name, string.Join('/', Folder.Split('/').Take(i + 1))));
}

/// <summary>Formulario para crear carpeta o renombrar (Item vacío = carpeta nueva).</summary>
public sealed class FileNameInput
{
    [DisplayFormat(ConvertEmptyStringToNull = false)] public string Folder { get; set; } = string.Empty;
    [DisplayFormat(ConvertEmptyStringToNull = false)] public string Item { get; set; } = string.Empty;
    [DisplayFormat(ConvertEmptyStringToNull = false)] public string Name { get; set; } = string.Empty;
    public bool IsFolder { get; set; }
}
