namespace webraul.Models;

public sealed record HomeViewModel(
    SiteSettings Settings,
    IReadOnlyList<ServiceItem> Services,
    IReadOnlyList<Project> Projects,
    IReadOnlyList<FaqItem> Faqs);

public sealed class LoginViewModel
{
    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Escribe tu correo."), System.ComponentModel.DataAnnotations.EmailAddress(ErrorMessage = "Revisa tu correo, parece incompleto."), System.ComponentModel.DataAnnotations.MaxLength(160, ErrorMessage = "El correo es demasiado largo.")]
    public string Email { get; set; } = string.Empty;
    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "Escribe tu contraseña."), System.ComponentModel.DataAnnotations.MaxLength(200, ErrorMessage = "La contraseña es demasiado larga."), System.ComponentModel.DataAnnotations.DataType(System.ComponentModel.DataAnnotations.DataType.Password)]
    public string Password { get; set; } = string.Empty;
    public bool RememberMe { get; set; }
    public string? ReturnUrl { get; set; }
}
