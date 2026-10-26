using System.Net;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using webraul.Models;

namespace webraul.Services;

public sealed class SmtpEmailSender(IOptions<SmtpOptions> options, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    public async Task SendContactNotificationAsync(string toEmail, ContactMessage message, CancellationToken cancellationToken = default)
    {
        var smtp = options.Value;
        if (string.IsNullOrWhiteSpace(smtp.Host))
        {
            logger.LogInformation("SMTP no configurado (Smtp:Host vacío); se omite el envío de la notificación de contacto.");
            return;
        }

        var mail = new MimeMessage();
        mail.From.Add(new MailboxAddress(smtp.FromName, smtp.FromEmail));
        mail.To.Add(MailboxAddress.Parse(toEmail));
        if (!string.IsNullOrWhiteSpace(message.Email))
            mail.ReplyTo.Add(new MailboxAddress(message.Name, message.Email));
        mail.Subject = string.IsNullOrWhiteSpace(message.ServiceCategory)
            ? $"Nuevo mensaje de {message.Name}"
            : $"Nuevo mensaje de {message.Name} · {message.ServiceCategory}";

        var bodyLines = new List<string>
        {
            $"Nombre: {message.Name}",
        };
        if (!string.IsNullOrWhiteSpace(message.Email)) bodyLines.Add($"Email: {message.Email}");
        if (!string.IsNullOrWhiteSpace(message.Phone)) bodyLines.Add($"WhatsApp: {message.Phone}");
        if (!string.IsNullOrWhiteSpace(message.ServiceCategory))
            bodyLines.Add($"Tema de interés: {message.ServiceCategory}");
        bodyLines.Add(string.Empty);
        bodyLines.Add(message.Message);

        mail.Body = new BodyBuilder
        {
            TextBody = string.Join(Environment.NewLine, bodyLines),
            HtmlBody = BuildHtmlBody(message),
        }.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(smtp.Host, smtp.Port, SecureSocketOptions.Auto, cancellationToken);
        if (!string.IsNullOrWhiteSpace(smtp.User))
            await client.AuthenticateAsync(smtp.User, smtp.Password, cancellationToken);
        await client.SendAsync(mail, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }

    private static string BuildHtmlBody(ContactMessage message)
    {
        var name = WebUtility.HtmlEncode(message.Name);
        var email = WebUtility.HtmlEncode(message.Email ?? string.Empty);
        var phone = WebUtility.HtmlEncode(message.Phone ?? string.Empty);
        var whatsAppUrl = WebUtility.HtmlEncode(WhatsAppUrl(message.Phone));
        var contactLine = string.Join(" · ", new[]
        {
            string.IsNullOrEmpty(email) ? null : $"<a href=\"mailto:{email}\" style=\"color:#4a9eff;text-decoration:none\">{email}</a>",
            string.IsNullOrEmpty(phone) ? null : $"<a href=\"{whatsAppUrl}\" style=\"color:#16a34a;text-decoration:none\">WhatsApp {phone}</a>",
        }.Where(x => x is not null));
        var (replyUrl, replyLabel, replyColor) = string.IsNullOrEmpty(email)
            ? (whatsAppUrl, "Responder por WhatsApp →", "#25D366")
            : ($"mailto:{email}", "Responder por email →", "#4a9eff");
        var body = WebUtility.HtmlEncode(message.Message).Replace("\n", "<br>");
        var received = message.CreatedAtUtc.ToLocalTime().ToString("dd MMM yyyy, HH:mm");
        var categoryBadge = string.IsNullOrWhiteSpace(message.ServiceCategory) ? "" : $"""
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr>
                <td style="background-color:rgba(74,158,255,.1);color:#2563eb;font-family:'Courier New',Consolas,monospace;font-size:12px;font-weight:700;letter-spacing:.02em;padding:6px 12px;border-radius:99px">{WebUtility.HtmlEncode(message.ServiceCategory)}</td>
            </tr></table>
            """;

        return $"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <meta name="color-scheme" content="light">
            <meta name="supported-color-schemes" content="light">
            <title>Nuevo mensaje</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px">
            <tr><td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
              <tr>
                <td style="background-color:#0a101d;padding:24px 32px">
                  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                    <td style="width:36px;height:36px;background-color:rgba(74,158,255,.14);border:1px solid rgba(74,158,255,.35);border-radius:10px;text-align:center;vertical-align:middle;font-family:'Courier New',Consolas,monospace;color:#4a9eff;font-weight:700;font-size:14px">&gt;_</td>
                    <td style="padding-left:12px;font-family:'Courier New',Consolas,monospace;color:#ffffff;font-weight:700;font-size:16px">raul.dev</td>
                  </tr></table>
                  <div style="font-family:'Courier New',Consolas,monospace;color:#64748b;font-size:11px;letter-spacing:.08em;margin-top:14px;text-transform:uppercase">$ nuevo mensaje de contacto</div>
                </td>
              </tr>
              <tr>
                <td style="padding:32px">
                  <h1 style="margin:0 0 4px;font-size:20px;line-height:1.3;color:#0f172a;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">{name}</h1>
                  <p style="margin:0 0 20px;font-size:14px">{contactLine}</p>
                  {categoryBadge}
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px">
                    <tr><td style="padding:20px;font-family:'Courier New',Consolas,monospace;font-size:13px;line-height:1.7;color:#334155">{body}</td></tr>
                  </table>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
                    <td align="center">
                      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                        <td style="background-color:{replyColor};border-radius:10px">
                          <a href="{replyUrl}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">{replyLabel}</a>
                        </td>
                      </tr></table>
                    </td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 32px;border-top:1px solid #e2e8f0">
                  <p style="margin:0;font-size:11px;color:#94a3b8;font-family:'Courier New',Consolas,monospace">Recibido el {received} · Enviado automáticamente desde el formulario de contacto de raul.dev</p>
                </td>
              </tr>
            </table>
            </td></tr>
            </table>
            </body>
            </html>
            """;
    }

    private static string WhatsAppUrl(string? phone) => "https://wa.me/" + new string((phone ?? string.Empty).Where(char.IsDigit).ToArray());
}
