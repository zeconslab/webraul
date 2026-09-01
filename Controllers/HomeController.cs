using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using webraul.Data;
using webraul.Models;
using webraul.Services;

namespace webraul.Controllers;

public sealed class HomeController(ApplicationDbContext db, IEmailSender emailSender, IConfiguration configuration, ILogger<HomeController> logger) : Controller
{
    public async Task<IActionResult> Index()
    {
        var settings = await db.SiteSettings.AsNoTracking().OrderBy(x => x.Id).FirstAsync();

        try
        {
            db.PageVisits.Add(new PageVisit { VisitorHash = ComputeVisitorHash() });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "No fue posible registrar la visita.");
        }

        return View(new HomeViewModel(
            settings,
            await db.Services.AsNoTracking().Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync(),
            await db.Projects.AsNoTracking().Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync(),
            await db.Faqs.AsNoTracking().Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync(),
            await db.Apps.AsNoTracking().Where(x => x.IsPublished).OrderBy(x => x.SortOrder).ToListAsync()));
    }

    private string ComputeVisitorHash()
    {
        var salt = configuration["Analytics:HashSalt"] ?? "webraul-visits";
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var userAgent = Request.Headers.UserAgent.ToString();
        var day = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var raw = $"{ip}|{userAgent}|{day}|{salt}";
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> Contact(ContactMessage contact)
    {
        if (!ModelState.IsValid) return BadRequest(new { ok = false, message = "Revisa los datos del formulario." });
        contact.Id = 0;
        contact.CreatedAtUtc = DateTime.UtcNow;
        db.ContactMessages.Add(contact);
        await db.SaveChangesAsync();

        try
        {
            var notifyEmail = (await db.SiteSettings.AsNoTracking().OrderBy(x => x.Id).FirstAsync()).Email;
            if (!string.IsNullOrWhiteSpace(notifyEmail))
                await emailSender.SendContactNotificationAsync(notifyEmail, contact);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "No fue posible enviar la notificación por correo del mensaje {ContactMessageId}.", contact.Id);
        }

        return Ok(new { ok = true, message = "Gracias. Recibí tu mensaje y te responderé pronto." });
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error() => View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
}
