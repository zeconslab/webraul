namespace webraul.Models;

public sealed record HomeViewModel(
    SiteSettings Settings,
    IReadOnlyList<ServiceItem> Services,
    IReadOnlyList<Project> Projects,
    IReadOnlyList<FaqItem> Faqs,
    IReadOnlyList<AppItem> Apps);

public sealed class LoginViewModel
{
    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "El correo es obligatorio."), System.ComponentModel.DataAnnotations.EmailAddress(ErrorMessage = "Ingresa un correo válido.")]
    public string Email { get; set; } = string.Empty;
    [System.ComponentModel.DataAnnotations.Required(ErrorMessage = "La contraseña es obligatoria."), System.ComponentModel.DataAnnotations.DataType(System.ComponentModel.DataAnnotations.DataType.Password)]
    public string Password { get; set; } = string.Empty;
    public bool RememberMe { get; set; }
    public string? ReturnUrl { get; set; }
}
