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
        mail.ReplyTo.Add(new MailboxAddress(message.Name, message.Email));
        mail.Subject = string.IsNullOrWhiteSpace(message.ServiceCategory)
            ? $"Nuevo mensaje de {message.Name}"
            : $"Nuevo mensaje de {message.Name} · {message.ServiceCategory}";

        var bodyLines = new List<string>
        {
            $"Nombre: {message.Name}",
            $"Email: {message.Email}",
        };
        if (!string.IsNullOrWhiteSpace(message.ServiceCategory))
            bodyLines.Add($"Tema de interés: {message.ServiceCategory}");
        bodyLines.Add(string.Empty);
        bodyLines.Add(message.Message);

        mail.Body = new TextPart("plain") { Text = string.Join(Environment.NewLine, bodyLines) };

        using var client = new SmtpClient();
        await client.ConnectAsync(smtp.Host, smtp.Port, SecureSocketOptions.Auto, cancellationToken);
        if (!string.IsNullOrWhiteSpace(smtp.User))
            await client.AuthenticateAsync(smtp.User, smtp.Password, cancellationToken);
        await client.SendAsync(mail, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);
    }
}
