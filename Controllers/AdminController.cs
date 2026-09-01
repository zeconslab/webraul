using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webraul.Data;
using webraul.Models;

namespace webraul.Controllers;

[Authorize(Roles = "Administrator")]
public sealed class AdminController(ApplicationDbContext db, IWebHostEnvironment environment) : Controller
{
    public async Task<IActionResult> Index()
    {
        var since = DateTime.UtcNow.Date.AddDays(-13);
        var dailyCounts = await db.ContactMessages.AsNoTracking()
            .Where(x => x.CreatedAtUtc >= since)
            .GroupBy(x => x.CreatedAtUtc.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync();
        var activity = Enumerable.Range(0, 14)
            .Select(offset => since.AddDays(offset))
            .Select(date => new DailyActivity(date, dailyCounts.FirstOrDefault(x => x.Date == date)?.Count ?? 0))
            .ToList();

        var contentHealth = new List<ContentHealth>
        {
            new("Servicios", await db.Services.CountAsync(x => x.IsPublished), await db.Services.CountAsync(x => !x.IsPublished)),
            new("Proyectos", await db.Projects.CountAsync(x => x.IsPublished), await db.Projects.CountAsync(x => !x.IsPublished)),
            new("Aplicaciones", await db.Apps.CountAsync(x => x.IsPublished), await db.Apps.CountAsync(x => !x.IsPublished)),
            new("Preguntas FAQ", await db.Faqs.CountAsync(x => x.IsPublished), await db.Faqs.CountAsync(x => !x.IsPublished)),
        };

        var visitDailyCounts = await db.PageVisits.AsNoTracking()
            .Where(x => x.CreatedAtUtc >= since)
            .GroupBy(x => x.CreatedAtUtc.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync();
        var visitsActivity = Enumerable.Range(0, 14)
            .Select(offset => since.AddDays(offset))
            .Select(date => new DailyActivity(date, visitDailyCounts.FirstOrDefault(x => x.Date == date)?.Count ?? 0))
            .ToList();

        var today = DateTime.UtcNow.Date;
        var visitSummaries = new List<VisitSummary>();
        foreach (var (label, days) in new (string, int)[] { ("Hoy", 1), ("7 días", 7), ("14 días", 14) })
        {
            var from = today.AddDays(-(days - 1));
            var rangeVisits = await db.PageVisits.AsNoTracking().Where(x => x.CreatedAtUtc >= from).Select(x => x.VisitorHash).ToListAsync();
            visitSummaries.Add(new VisitSummary(label, rangeVisits.Count, rangeVisits.Distinct().Count()));
        }

        return View(new AdminDashboardViewModel(
            await db.Services.CountAsync(), await db.Projects.CountAsync(), await db.Faqs.CountAsync(), await db.Apps.CountAsync(),
            await db.ContactMessages.CountAsync(x => !x.IsRead),
            await db.ContactMessages.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).Take(8).ToListAsync(),
            activity, contentHealth, visitsActivity, visitSummaries));
    }

    public async Task<IActionResult> Settings(bool modal = false)
    {
        var model = await db.SiteSettings.OrderBy(x => x.Id).FirstAsync();
        return modal ? PartialView("_SettingsForm", model) : View(model);
    }
    public async Task<IActionResult> Services() => View(await db.Services.OrderBy(x => x.SortOrder).ToListAsync());
    public async Task<IActionResult> Projects() => View(await db.Projects.OrderBy(x => x.SortOrder).ToListAsync());
    public async Task<IActionResult> Faqs() => View(await db.Faqs.OrderBy(x => x.SortOrder).ToListAsync());
    public async Task<IActionResult> Apps() => View(await db.Apps.OrderBy(x => x.SortOrder).ToListAsync());

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Settings([Bind(Prefix = "Settings")] SiteSettings input)
    {
        if (!ModelState.IsValid) return IsModalRequest() ? PartialView("_SettingsForm", input) : View(input);
        var item = await db.SiteSettings.OrderBy(x => x.Id).FirstAsync();
        input.Id = item.Id;
        db.Entry(item).CurrentValues.SetValues(input);
        await db.SaveChangesAsync();
        return ModalSaved(nameof(Settings), "Datos generales actualizados.");
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
    public async Task<IActionResult> Project(Project input, IFormFile? desktopImage, IFormFile? mobileImage)
    {
        if (!ModelState.IsValid) return IsModalRequest() ? PartialView("_ProjectForm", input) : View(input);
        var existing = input.Id == 0 ? null : await db.Projects.AsNoTracking().FirstOrDefaultAsync(x => x.Id == input.Id);
        input.DesktopImageUrl = await SaveImage(desktopImage) ?? input.DesktopImageUrl ?? existing?.DesktopImageUrl;
        input.MobileImageUrl = await SaveImage(mobileImage) ?? input.MobileImageUrl ?? existing?.MobileImageUrl;
        if (input.Id == 0) db.Projects.Add(input); else db.Projects.Update(input);
        await db.SaveChangesAsync();
        return ModalSaved(nameof(Projects), "Proyecto guardado.");
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

    public async Task<IActionResult> App(int? id, bool modal = false)
    {
        var model = id is null ? new AppItem() : await db.Apps.FindAsync(id) ?? new AppItem();
        return modal ? PartialView("_AppForm", model) : View(model);
    }

    [HttpPost, ValidateAntiForgeryToken, RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> App(AppItem input, IFormFile? appImage)
    {
        if (!ModelState.IsValid) return IsModalRequest() ? PartialView("_AppForm", input) : View(input);
        var existing = input.Id == 0 ? null : await db.Apps.AsNoTracking().FirstOrDefaultAsync(x => x.Id == input.Id);
        input.ImageUrl = await SaveImage(appImage) ?? input.ImageUrl ?? existing?.ImageUrl;
        if (input.Id == 0) db.Apps.Add(input); else db.Apps.Update(input);
        await db.SaveChangesAsync();
        return ModalSaved(nameof(Apps), "Aplicación guardada.");
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(string type, int id)
    {
        switch (type.ToLowerInvariant())
        {
            case "service": if (await db.Services.FindAsync(id) is { } service) db.Remove(service); break;
            case "project": if (await db.Projects.FindAsync(id) is { } project) db.Remove(project); break;
            case "faq": if (await db.Faqs.FindAsync(id) is { } faq) db.Remove(faq); break;
            case "app": if (await db.Apps.FindAsync(id) is { } app) db.Remove(app); break;
            default: return BadRequest();
        }
        await db.SaveChangesAsync();
        TempData["Success"] = "Elemento eliminado.";
        return RedirectToAction(type.ToLowerInvariant() switch { "service" => nameof(Services), "project" => nameof(Projects), "faq" => nameof(Faqs), "app" => nameof(Apps), _ => nameof(Index) });
    }

    public async Task<IActionResult> Messages() => View(await db.ContactMessages.OrderByDescending(x => x.CreatedAtUtc).ToListAsync());

    public async Task<IActionResult> Message(int id)
    {
        var model = await db.ContactMessages.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return model is null ? NotFound() : PartialView("_MessageDetail", model);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ReadMessage(int id)
    {
        if (await db.ContactMessages.FindAsync(id) is { } message)
        {
            message.IsRead = true;
            await db.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Messages));
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
