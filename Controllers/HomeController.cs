using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webraul.Data;
using webraul.Models;

namespace webraul.Controllers;

public sealed class HomeController(ApplicationDbContext db) : Controller
{
    public async Task<IActionResult> Index()
    {
        var settings = await db.SiteSettings.AsNoTracking().OrderBy(x => x.Id).FirstAsync();
        return View(new HomeViewModel(
            settings,
            await db.Services.AsNoTracking().Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync(),
            await db.Projects.AsNoTracking().Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync(),
            await db.Faqs.AsNoTracking().Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync(),
            await db.Apps.AsNoTracking().Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync()));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Contact(ContactMessage contact)
    {
        if (!ModelState.IsValid) return BadRequest(new { ok = false, message = "Revisa los datos del formulario." });
        contact.Id = 0;
        contact.CreatedAtUtc = DateTime.UtcNow;
        db.ContactMessages.Add(contact);
        await db.SaveChangesAsync();
        return Ok(new { ok = true, message = "Gracias. Recibí tu mensaje y te responderé pronto." });
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error() => View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
}
