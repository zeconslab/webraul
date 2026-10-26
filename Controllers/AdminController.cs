using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webraul.Data;
using webraul.Models;
using webraul.Services;

namespace webraul.Controllers;

[Authorize(Roles = "Administrator")]
public sealed class AdminController(ApplicationDbContext db, IWebHostEnvironment environment, FileStorage files, ILogger<AdminController> logger) : Controller
{
    public async Task<IActionResult> Index()
    {
        var today = DateTime.UtcNow.Date;
        var weekStart = today.AddDays(-6);
        var previousWeekStart = weekStart.AddDays(-7);
        var monthStart = today.AddDays(-29);
        var chartStart = today.AddDays(-13);

        var waiting = db.ContactMessages.AsNoTracking().Where(x => x.Stage == LeadStages.New);
        var leadDates = await db.ContactMessages.AsNoTracking().Where(x => x.CreatedAtUtc >= monthStart || x.CreatedAtUtc >= previousWeekStart)
            .Select(x => new { x.CreatedAtUtc, x.Source, x.Stage }).ToListAsync();
        var visits = await db.PageVisits.AsNoTracking().Where(x => x.CreatedAtUtc >= monthStart)
            .Select(x => new { x.CreatedAtUtc, x.VisitorHash }).ToListAsync();
        var diagnostics = await db.DiagnosticCompletions.AsNoTracking().Where(x => x.CreatedAtUtc >= monthStart)
            .Select(x => new { x.CreatedAtUtc, x.VisitorHash }).ToListAsync();

        int UniqueVisitors(DateTime from, DateTime to) => visits.Where(x => x.CreatedAtUtc >= from && x.CreatedAtUtc < to).Select(x => x.VisitorHash).Distinct().Count();
        var tomorrow = today.AddDays(1);
        var newLeads = new Kpi(leadDates.Count(x => x.CreatedAtUtc >= weekStart), leadDates.Count(x => x.CreatedAtUtc >= previousWeekStart && x.CreatedAtUtc < weekStart));
        var uniqueVisitors = new Kpi(UniqueVisitors(weekStart, tomorrow), UniqueVisitors(previousWeekStart, weekStart));
        var monthLeads = leadDates.Where(x => x.CreatedAtUtc >= monthStart).ToList();
        var monthVisitors = UniqueVisitors(monthStart, tomorrow);

        List<DailyActivity> Daily(IEnumerable<DateTime> dates)
        {
            var counts = dates.GroupBy(x => x.Date).ToDictionary(g => g.Key, g => g.Count());
            return Enumerable.Range(0, 14).Select(i => chartStart.AddDays(i)).Select(d => new DailyActivity(d, counts.GetValueOrDefault(d))).ToList();
        }

        var funnel = new List<FunnelStep>
        {
            new("Visitantes", monthVisitors),
            new("Diagnóstico", diagnostics.Select(x => x.VisitorHash).Distinct().Count()),
            new("Te escribieron", monthLeads.Count),
            new("Propuesta", monthLeads.Count(x => x.Stage is LeadStages.Proposal or LeadStages.Won)),
            new("Ganados", monthLeads.Count(x => x.Stage == LeadStages.Won)),
        };

        return View(new AdminDashboardViewModel(
            await waiting.CountAsync(), await waiting.OrderBy(x => x.CreatedAtUtc).Select(x => (DateTime?)x.CreatedAtUtc).FirstOrDefaultAsync(),
            newLeads, uniqueVisitors,
            monthVisitors == 0 ? 0 : monthLeads.Count * 100.0 / monthVisitors,
            diagnostics.Count(x => x.CreatedAtUtc >= weekStart), leadDates.Count(x => x.CreatedAtUtc >= weekStart && x.Source == LeadSources.Diagnostic),
            await db.ContactMessages.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).Take(5).ToListAsync(),
            await BuildHealthChecks(),
            Daily(visits.Where(x => x.CreatedAtUtc >= chartStart).Select(x => x.CreatedAtUtc)),
            Daily(leadDates.Where(x => x.CreatedAtUtc >= chartStart).Select(x => x.CreatedAtUtc)),
            funnel));
    }

    private async Task<List<HealthCheck>> BuildHealthChecks()
    {
        var settings = await db.SiteSettings.AsNoTracking().OrderBy(x => x.Id).FirstAsync();
        var services = await db.Services.AsNoTracking().Where(x => x.IsPublished).ToListAsync();
        var projects = await db.Projects.AsNoTracking().Where(x => x.IsPublished).ToListAsync();
        var faqCount = await db.Faqs.CountAsync(x => x.IsPublished);
        var checks = new List<HealthCheck>();

        var incomplete = services.Where(x => string.IsNullOrWhiteSpace(x.IdealFor) || string.IsNullOrWhiteSpace(x.Includes) || string.IsNullOrWhiteSpace(x.Timeframe)).ToList();
        checks.Add(incomplete.Count == 0
            ? new(true, "Servicios completos", $"{services.Count} servicios con todos sus datos")
            : new(false, incomplete.Count == 1 ? "1 servicio incompleto" : $"{incomplete.Count} servicios incompletos",
                $"A {string.Join(", ", incomplete.Take(2).Select(x => x.Title))} le faltan \"Ideal para\", \"Qué obtiene\" o \"Tiempo\".", "Completar", Url.Action(nameof(Services))));

        var featured = projects.FirstOrDefault(x => x.IsFeatured);
        checks.Add(featured is null
            ? new(false, "Sin proyecto de portada", "El hero usará el primer proyecto publicado.", "Elegir", Url.Action(nameof(Projects)))
            : new(true, "Portada definida", featured.GalleryList.Count > 0 ? $"{featured.Title} · {featured.GalleryList.Count} pantallas en el carrusel" : featured.Title));

        foreach (var project in projects.Where(x => string.IsNullOrWhiteSpace(x.DesktopImageUrl) && string.IsNullOrWhiteSpace(x.MobileImageUrl)).Take(2))
            checks.Add(new(false, $"{project.Title} no tiene imagen", "La tarjeta se ve solo con un ícono.", "Agregar", ModalUrl: Url.Action(nameof(Project), new { id = project.Id, modal = true })));
        foreach (var project in projects.Where(x => !x.IsFeatured && string.IsNullOrWhiteSpace(x.WebsiteUrl)).Take(2))
            checks.Add(new(false, $"{project.Title} no tiene enlace", "Sin enlace, su tarjeta no tiene botón.", "Agregar", ModalUrl: Url.Action(nameof(Project), new { id = project.Id, modal = true })));

        checks.Add(faqCount >= 4
            ? new(true, "Preguntas frecuentes", $"{faqCount} publicadas")
            : new(false, faqCount == 1 ? "Solo 1 pregunta frecuente" : $"Solo {faqCount} preguntas frecuentes", "Te sugiero 4 o más: precio, tiempos, soporte.", "Agregar", ModalUrl: Url.Action(nameof(Faq), new { modal = true })));
        checks.Add(settings.Phone.Any(char.IsDigit)
            ? new(true, "WhatsApp configurado", settings.Phone)
            : new(false, "Sin WhatsApp", "Los botones de WhatsApp del sitio no aparecen.", "Configurar", ModalUrl: Url.Action(nameof(Settings), new { modal = true })));
        checks.Add(!string.IsNullOrWhiteSpace(settings.Email)
            ? new(true, "Correo de avisos", settings.Email)
            : new(false, "Sin correo de avisos", "No te llegará aviso cuando alguien escriba.", "Configurar", ModalUrl: Url.Action(nameof(Settings), new { modal = true })));
        checks.Add(settings.IsIndexable
            ? new(true, "Visible en Google", "El sitio permite ser indexado")
            : new(false, "Oculto para buscadores", "Google no está mostrando tu sitio.", "Revisar", ModalUrl: Url.Action(nameof(Seo))));

        return checks.OrderBy(x => x.Ok).ToList();
    }

    public async Task<IActionResult> Settings(bool modal = false)
    {
        var item = await db.SiteSettings.OrderBy(x => x.Id).FirstAsync();
        if (!modal) return View(item);
        return PartialView("_SettingsForm", new GeneralSettingsInput
        {
            OwnerName = item.OwnerName, Headline = item.Headline, HeroText = item.HeroText,
            Email = item.Email, Phone = item.Phone, Location = item.Location,
            LinkedInUrl = item.LinkedInUrl, GitHubUrl = item.GitHubUrl
        });
    }

    public async Task<IActionResult> Seo()
    {
        var item = await db.SiteSettings.OrderBy(x => x.Id).FirstAsync();
        return PartialView("_SeoForm", new SeoSettingsInput
        {
            SeoTitle = item.SeoTitle, SeoDescription = item.SeoDescription, SeoKeywords = item.SeoKeywords,
            SeoImageUrl = item.SeoImageUrl, GoogleSiteVerification = item.GoogleSiteVerification, IsIndexable = item.IsIndexable
        });
    }

    public async Task<IActionResult> Services() => View(await db.Services.OrderBy(x => x.SortOrder).ToListAsync());
    public async Task<IActionResult> Projects() => View(await db.Projects.OrderBy(x => x.SortOrder).ToListAsync());
    public async Task<IActionResult> Faqs() => View(await db.Faqs.OrderBy(x => x.SortOrder).ToListAsync());

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Settings([Bind(Prefix = "Settings")] GeneralSettingsInput input)
    {
        if (!ModelState.IsValid) return IsModalRequest() ? PartialView("_SettingsForm", input) : View(input);
        var item = await db.SiteSettings.OrderBy(x => x.Id).FirstAsync();
        item.OwnerName = input.OwnerName;
        item.Headline = input.Headline;
        item.HeroText = input.HeroText;
        item.Email = input.Email;
        item.Phone = input.Phone;
        item.Location = input.Location;
        item.LinkedInUrl = input.LinkedInUrl;
        item.GitHubUrl = input.GitHubUrl;
        await db.SaveChangesAsync();
        return ModalSaved(nameof(Settings), "Datos generales actualizados.");
    }

    [HttpPost, ValidateAntiForgeryToken, RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> Seo([Bind(Prefix = "Settings")] SeoSettingsInput input, IFormFile? seoImage)
    {
        if (!ModelState.IsValid) return PartialView("_SeoForm", input);
        var item = await db.SiteSettings.OrderBy(x => x.Id).FirstAsync();
        item.SeoTitle = input.SeoTitle;
        item.SeoDescription = input.SeoDescription;
        item.SeoKeywords = input.SeoKeywords;
        item.SeoImageUrl = await SaveImage(seoImage) ?? input.SeoImageUrl ?? item.SeoImageUrl;
        item.GoogleSiteVerification = input.GoogleSiteVerification;
        item.IsIndexable = input.IsIndexable;
        await db.SaveChangesAsync();
        return ModalSaved(nameof(Settings), "SEO actualizado.");
    }

    public async Task<IActionResult> Service(int? id, bool modal = false)
    {
        var model = id is null ? new ServiceItem() : await db.Services.FindAsync(id) ?? new ServiceItem();
        return modal ? PartialView("_ServiceForm", model) : View(model);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Service(ServiceItem input)
    {
        if (!ModelState.IsValid) return IsModalRequest() ? PartialView("_ServiceForm", input) : View(input);
        if (input.Id == 0) db.Services.Add(input); else db.Services.Update(input);
        await db.SaveChangesAsync();
        return ModalSaved(nameof(Services), "Servicio guardado.");
    }

    public async Task<IActionResult> Project(int? id, bool modal = false)
    {
        var model = id is null ? new Project() : await db.Projects.FindAsync(id) ?? new Project();
        return modal ? PartialView("_ProjectForm", model) : View(model);
    }

    [HttpPost, ValidateAntiForgeryToken, RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> Project(Project input, IFormFile? desktopImage, IFormFile? mobileImage,
        string[]? selectedTypes, string[]? galleryUrls, string[]? galleryLabels, IFormFile[]? newGalleryFiles, string[]? newGalleryLabels)
    {
        input.Types = string.Join(',', (selectedTypes ?? []).Where(type => Models.Project.TypeOptions.Any(option => option.Key == type)).Distinct());
        if (input.Types.Length == 0) ModelState.AddModelError(nameof(input.Types), "Elige al menos un tipo de proyecto.");
        if (!ModelState.IsValid) return IsModalRequest() ? PartialView("_ProjectForm", input) : View(input);

        var existing = input.Id == 0 ? null : await db.Projects.AsNoTracking().FirstOrDefaultAsync(x => x.Id == input.Id);
        input.DesktopImageUrl = await SaveImage(desktopImage) ?? input.DesktopImageUrl ?? existing?.DesktopImageUrl;
        input.MobileImageUrl = await SaveImage(mobileImage) ?? input.MobileImageUrl ?? existing?.MobileImageUrl;

        // Pantallas que se conservan (las quitadas en el formulario ya no vienen) más las nuevas subidas.
        var gallery = new List<string>();
        for (var i = 0; i < (galleryUrls?.Length ?? 0); i++)
            gallery.Add($"{Clean(galleryLabels?.ElementAtOrDefault(i))}|{galleryUrls![i]}");
        for (var i = 0; i < (newGalleryFiles?.Length ?? 0); i++)
            if (await SaveImage(newGalleryFiles![i]) is { } url)
                gallery.Add($"{Clean(newGalleryLabels?.ElementAtOrDefault(i))}|{url}");
        input.GalleryImages = string.Join('\n', gallery);

        // Solo un proyecto puede ser la portada.
        if (input.IsFeatured)
            await db.Projects.Where(x => x.Id != input.Id && x.IsFeatured).ExecuteUpdateAsync(x => x.SetProperty(p => p.IsFeatured, false));

        if (input.Id == 0) db.Projects.Add(input); else db.Projects.Update(input);
        await db.SaveChangesAsync();
        return ModalSaved(nameof(Projects), "Proyecto guardado.");

        static string Clean(string? label) => (label ?? string.Empty).Replace("|", " ").Replace("\n", " ").Trim();
    }

    public async Task<IActionResult> Faq(int? id, bool modal = false)
    {
        var model = id is null ? new FaqItem() : await db.Faqs.FindAsync(id) ?? new FaqItem();
        return modal ? PartialView("_FaqForm", model) : View(model);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Faq(FaqItem input)
    {
        if (!ModelState.IsValid) return IsModalRequest() ? PartialView("_FaqForm", input) : View(input);
        if (input.Id == 0) db.Faqs.Add(input); else db.Faqs.Update(input);
        await db.SaveChangesAsync();
        return ModalSaved(nameof(Faqs), "Pregunta guardada.");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(string type, int id)
    {
        switch (type.ToLowerInvariant())
        {
            case "service": if (await db.Services.FindAsync(id) is { } service) db.Remove(service); break;
            case "project": if (await db.Projects.FindAsync(id) is { } project) db.Remove(project); break;
            case "faq": if (await db.Faqs.FindAsync(id) is { } faq) db.Remove(faq); break;
            case "message": if (await db.ContactMessages.FindAsync(id) is { } message) db.Remove(message); break;
            default: return BadRequest();
        }
        await db.SaveChangesAsync();
        TempData["Success"] = "Elemento eliminado.";
        return RedirectToAction(type.ToLowerInvariant() switch { "service" => nameof(Services), "project" => nameof(Projects), "faq" => nameof(Faqs), "message" => nameof(Messages), _ => nameof(Index) });
    }

    public async Task<IActionResult> Messages(string stage = "todos", int? id = null, int page = 1)
    {
        const int pageSize = 30;
        var counts = await db.ContactMessages.AsNoTracking().GroupBy(x => x.Stage).Select(g => new { g.Key, Count = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.Count);
        counts["todos"] = counts.Values.Sum();
        if (stage != "todos" && LeadStages.All.All(x => x.Key != stage)) stage = "todos";

        var query = db.ContactMessages.AsNoTracking().Where(x => stage == "todos" || x.Stage == stage).OrderByDescending(x => x.CreatedAtUtc);
        var totalPages = Math.Max(1, (int)Math.Ceiling(await query.CountAsync() / (double)pageSize));
        page = Math.Clamp(page, 1, totalPages);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        ContactMessage? selected = null;
        if (id is not null && await db.ContactMessages.FindAsync(id) is { } message)
        {
            // Abrir un mensaje lo marca como leído
            if (!message.IsRead) { message.IsRead = true; await db.SaveChangesAsync(); }
            selected = message;
            items = items.Select(x => x.Id == message.Id ? message : x).ToList();
        }
        return View(new InboxViewModel(items, selected, stage, counts, page, totalPages));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Stage(int id, string stage, string? filter)
    {
        if (LeadStages.All.All(x => x.Key != stage)) return BadRequest();
        if (await db.ContactMessages.FindAsync(id) is { } message)
        {
            message.Stage = stage;
            message.StageUpdatedAtUtc = DateTime.UtcNow;
            message.IsRead = true;
            await db.SaveChangesAsync();
            TempData["Success"] = $"Etapa actualizada: {LeadStages.Label(stage)}.";
        }
        return RedirectToAction(nameof(Messages), new { stage = filter ?? "todos", id });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Notes(int id, string? notes, string? filter)
    {
        if (notes?.Length > 2000) notes = notes[..2000];
        if (await db.ContactMessages.FindAsync(id) is { } message)
        {
            message.Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
            await db.SaveChangesAsync();
            TempData["Success"] = "Notas guardadas.";
        }
        return RedirectToAction(nameof(Messages), new { stage = filter ?? "todos", id });
    }

    /// <summary>Publicar u ocultar desde el interruptor de las listas.</summary>
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Publish(string type, int id, bool published)
    {
        OrderedContent? item = type switch
        {
            "project" => await db.Projects.FindAsync(id),
            "service" => await db.Services.FindAsync(id),
            "faq" => await db.Faqs.FindAsync(id),
            _ => null,
        };
        if (item is null) return NotFound();
        item.IsPublished = published;
        await db.SaveChangesAsync();
        return Json(new { ok = true });
    }

    /// <summary>Guarda el orden después de arrastrar tarjetas: la posición en la lista es el nuevo orden.</summary>
    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Reorder(string type, int[] ids)
    {
        IQueryable<OrderedContent>? set = type switch
        {
            "project" => db.Projects,
            "service" => db.Services,
            "faq" => db.Faqs,
            _ => null,
        };
        if (set is null) return BadRequest();
        var items = await set.Where(x => ids.Contains(x.Id)).ToListAsync();
        foreach (var item in items) item.SortOrder = Array.IndexOf(ids, item.Id);
        await db.SaveChangesAsync();
        return Json(new { ok = true });
    }

    public IActionResult Files(string? carpeta)
    {
        var folder = files.Normalize(carpeta);
        if (folder is null || !files.FolderExists(folder)) return RedirectToAction(nameof(Files));
        return View(new FilesViewModel(folder, files.List(folder)));
    }

    // Se sube un archivo por petición (el navegador los manda en fila) para mostrar el progreso y respetar el límite por archivo.
    [HttpPost, ValidateAntiForgeryToken, RequestSizeLimit(FileStorage.MaxFileSize + 1_048_576), RequestFormLimits(MultipartBodyLengthLimit = FileStorage.MaxFileSize + 1_048_576)]
    public async Task<IActionResult> FileUpload(string? carpeta, IFormFile? file)
    {
        var folder = files.Normalize(carpeta);
        if (folder is null || !files.FolderExists(folder)) return BadRequest(new { error = "La carpeta ya no existe. Recarga la página." });
        if (file is null || file.Length == 0) return BadRequest(new { error = "El archivo está vacío." });
        if (file.Length > FileStorage.MaxFileSize) return BadRequest(new { error = "El archivo supera los 50 MB." });
        var name = await files.SaveAsync(folder, file);
        return Json(new { ok = true, name });
    }

    public IActionResult FileDownload(string? ruta)
    {
        var item = files.Normalize(ruta);
        if (string.IsNullOrEmpty(item) || !System.IO.File.Exists(files.FullPath(item))) return NotFound();
        return PhysicalFile(files.FullPath(item), "application/octet-stream", Path.GetFileName(item), enableRangeProcessing: true);
    }

    public IActionResult FileName(string? carpeta, string? ruta)
    {
        var folder = files.Normalize(carpeta) ?? string.Empty;
        var item = files.Normalize(ruta) ?? string.Empty;
        var input = new FileNameInput { Folder = folder, Item = item, Name = item.Length == 0 ? string.Empty : Path.GetFileName(item), IsFolder = item.Length == 0 || Directory.Exists(files.FullPath(item)) };
        return PartialView("_FileNameForm", input);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult FileName(FileNameInput input)
    {
        input.Name = input.Name.Trim();
        var folder = files.Normalize(input.Folder);
        var item = files.Normalize(input.Item);
        if (folder is null || item is null || !files.FolderExists(folder)) return BadRequest();
        var renaming = item.Length > 0;
        var current = renaming ? Path.GetFileName(item) : null;
        if (FileStorage.NameError(input.Name) is { } error) ModelState.AddModelError(nameof(input.Name), error);
        // Cambiar solo mayúsculas/minúsculas del mismo nombre es válido aunque el sistema de archivos diga que "ya existe"
        else if (input.Name != current && !string.Equals(input.Name, current, StringComparison.OrdinalIgnoreCase) && files.Exists(renaming ? Path.GetDirectoryName(item)!.Replace('\\', '/') : folder, input.Name))
            ModelState.AddModelError(nameof(input.Name), "Ya hay un archivo o carpeta con ese nombre aquí.");
        if (!ModelState.IsValid) return PartialView("_FileNameForm", input);

        if (renaming && input.Name != current) files.Rename(item, input.Name);
        else if (!renaming) files.CreateFolder(folder, input.Name);
        TempData["Success"] = renaming ? "Nombre actualizado." : "Carpeta creada.";
        var redirect = Url.Action(nameof(Files), new { carpeta = folder.Length == 0 ? null : folder });
        return IsModalRequest() ? Json(new { ok = true, redirect }) : Redirect(redirect!);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public IActionResult FileDelete([FromForm(Name = "id")] string? ruta)
    {
        var item = files.Normalize(ruta);
        if (string.IsNullOrEmpty(item)) return BadRequest();
        var parent = item.Contains('/') ? item[..item.LastIndexOf('/')] : null;
        try
        {
            files.Delete(item);
            TempData["Success"] = "Eliminado.";
        }
        catch (IOException exception)
        {
            logger.LogWarning(exception, "No se pudo eliminar un archivo del panel.");
            TempData["Error"] = "No se pudo eliminar. Inténtalo de nuevo.";
        }
        return RedirectToAction(nameof(Files), new { carpeta = parent });
    }

    private RedirectToActionResult Saved(string action, string message)
    {
        TempData["Success"] = message;
        return RedirectToAction(action);
    }

    private IActionResult ModalSaved(string action, string message)
    {
        if (IsModalRequest()) return Json(new { ok = true, redirect = Url.Action(action), message });
        return Saved(action, message);
    }

    private bool IsModalRequest() => Request.Headers.XRequestedWith == "XMLHttpRequest";

    private async Task<string?> SaveImage(IFormFile? file)
    {
        if (file is null || file.Length == 0) return null;
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not (".jpg" or ".jpeg" or ".png" or ".webp"))
            throw new InvalidOperationException("Formato de imagen no permitido.");
        var folder = Path.Combine(environment.WebRootPath, "uploads");
        Directory.CreateDirectory(folder);
        var name = $"{Guid.NewGuid():N}{extension}";
        await using var stream = System.IO.File.Create(Path.Combine(folder, name));
        await file.CopyToAsync(stream);
        return "/uploads/" + name;
    }
}
