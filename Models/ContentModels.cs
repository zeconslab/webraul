using System.ComponentModel.DataAnnotations;

namespace webraul.Models;

public sealed class SiteSettings
{
    public int Id { get; set; }
    [Required, MaxLength(120)] public string OwnerName { get; set; } = "Raúl Pimentel";
    [Required, MaxLength(160)] public string Headline { get; set; } = "Desarrollador Web Full Stack";
    [MaxLength(240)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string HeroText { get; set; } = string.Empty;
    [EmailAddress, MaxLength(160)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Email { get; set; } = string.Empty;
    [MaxLength(40)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Phone { get; set; } = string.Empty;
    [MaxLength(160)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Location { get; set; } = string.Empty;
    [MaxLength(300)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string LinkedInUrl { get; set; } = string.Empty;
    [MaxLength(300)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string GitHubUrl { get; set; } = string.Empty;

    [Required, MaxLength(70)] public string SeoTitle { get; set; } = string.Empty;
    [Required, MaxLength(200)] public string SeoDescription { get; set; } = string.Empty;
    [MaxLength(300)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string SeoKeywords { get; set; } = string.Empty;
    [MaxLength(500)] public string? SeoImageUrl { get; set; }
    [MaxLength(100)] public string? GoogleSiteVerification { get; set; }
    public bool IsIndexable { get; set; } = true;

    public string WhatsAppUrl => "https://wa.me/" + new string(Phone.Where(char.IsDigit).ToArray());
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
    [MaxLength(80)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Icon { get; set; } = "code";
    [MaxLength(300)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string IdealFor { get; set; } = string.Empty;
    [MaxLength(600)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Includes { get; set; } = string.Empty;
    [MaxLength(80)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Timeframe { get; set; } = string.Empty;
    /// <summary>Renglones de la tarjeta de muestra, uno por línea.</summary>
    [MaxLength(600)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Highlights { get; set; } = string.Empty;

    public IEnumerable<string> HighlightList => Highlights.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}

public sealed class Project : OrderedContent
{
    [Required, MaxLength(140)] public string Title { get; set; } = string.Empty;
    [Required, MaxLength(140)] public string Slug { get; set; } = string.Empty;
    [Required, MaxLength(1200)] public string Description { get; set; } = string.Empty;
    [MaxLength(500)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Technologies { get; set; } = string.Empty;
    [MaxLength(800)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Features { get; set; } = string.Empty;
    [Url, MaxLength(500)] public string? WebsiteUrl { get; set; }
    [MaxLength(500)] public string? DesktopImageUrl { get; set; }
    [MaxLength(500)] public string? MobileImageUrl { get; set; }
    [MaxLength(80)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Badge { get; set; } = string.Empty;
    /// <summary>Tipos separados por coma: web, sistema, app, tienda.</summary>
    [MaxLength(80)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string Types { get; set; } = "web";
    public bool IsFeatured { get; set; }
    /// <summary>Pantallas del carrusel, una por línea con el formato "Etiqueta|/uploads/imagen.jpg".</summary>
    [MaxLength(2000)] [DisplayFormat(ConvertEmptyStringToNull = false)] public string GalleryImages { get; set; } = string.Empty;

    public static readonly IReadOnlyList<(string Key, string Label, string Icon)> TypeOptions =
    [
        ("web", "Sitio web", "language"),
        ("sistema", "Sistema", "dashboard"),
        ("app", "App móvil", "smartphone"),
        ("tienda", "Tienda", "shopping_cart"),
    ];

    public IReadOnlyList<string> TypeList => Types.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    public IEnumerable<string> FeatureList => Features.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    public IReadOnlyList<(string Label, string Url)> GalleryList => GalleryImages
        .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Select(line => line.Split('|', 2))
        .Where(parts => parts.Length == 2 && !string.IsNullOrWhiteSpace(parts[1]))
        .Select(parts => (parts[0].Trim(), parts[1].Trim()))
        .ToList();
}

public sealed class FaqItem : OrderedContent
{
    [Required, MaxLength(300)] public string Question { get; set; } = string.Empty;
    [Required, MaxLength(1400)] public string Answer { get; set; } = string.Empty;
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
    [EmailAddress, MaxLength(160)] public string? Email { get; set; }
    [MaxLength(40)] public string? Phone { get; set; }
    [Required, MaxLength(3000)] public string Message { get; set; } = string.Empty;
    [MaxLength(120)] public string? ServiceCategory { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; }

    /// <summary>Etapa del seguimiento: nuevo, contactado, propuesta, ganado o descartado.</summary>
    [MaxLength(20)] public string Stage { get; set; } = LeadStages.New;
    public DateTime? StageUpdatedAtUtc { get; set; }
    [MaxLength(2000)] public string? Notes { get; set; }
    /// <summary>Por dónde llegó: formulario o diagnóstico.</summary>
    [MaxLength(20)] public string Source { get; set; } = LeadSources.Form;
    /// <summary>Respuestas del diagnóstico, una por línea con el formato "Etiqueta|Valor".</summary>
    [MaxLength(800)] public string? DiagnosticAnswers { get; set; }

    public IReadOnlyList<(string Label, string Value)> DiagnosticList => (DiagnosticAnswers ?? string.Empty)
        .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Select(line => line.Split('|', 2))
        .Where(parts => parts.Length == 2)
        .Select(parts => (parts[0].Trim(), parts[1].Trim()))
        .ToList();

    public string ContactLine => string.Join(" · ", new[] { Email, Phone is null ? null : $"WhatsApp {Phone}" }.Where(x => !string.IsNullOrWhiteSpace(x)));
}

public static class LeadStages
{
    public const string New = "nuevo";
    public const string Contacted = "contactado";
    public const string Proposal = "propuesta";
    public const string Won = "ganado";
    public const string Lost = "descartado";

    public static readonly IReadOnlyList<(string Key, string Label, string Icon)> All =
    [
        (New, "Nuevo", "fiber_new"),
        (Contacted, "Contactado", "call"),
        (Proposal, "Propuesta", "request_quote"),
        (Won, "Ganado", "emoji_events"),
        (Lost, "Descartado", "block"),
    ];

    public static string Label(string stage) => All.FirstOrDefault(x => x.Key == stage).Label ?? "Nuevo";
}

public static class LeadSources
{
    public const string Form = "formulario";
    public const string Diagnostic = "diagnostico";
}

/// <summary>Un diagnóstico terminado en la landing; alimenta el embudo del panel.</summary>
public sealed class DiagnosticCompletion
{
    public long Id { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    [Required, MaxLength(64)] public string VisitorHash { get; set; } = string.Empty;
    [Required, MaxLength(40)] public string Business { get; set; } = string.Empty;
}
