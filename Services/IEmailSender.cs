namespace webraul.Services;

public interface IEmailSender
{
    Task SendContactNotificationAsync(string toEmail, webraul.Models.ContactMessage message, CancellationToken cancellationToken = default);
}
