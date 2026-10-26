using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using webraul.Models;
using Microsoft.AspNetCore.RateLimiting;

namespace webraul.Controllers;

public sealed class AccountController(SignInManager<IdentityUser> signInManager, IAntiforgery antiforgery, ILogger<AccountController> logger) : Controller
{
    private const string GenericError = "El correo o la contraseña no coinciden. Si fallas varias veces, el acceso se bloquea unos minutos.";

    [HttpGet("/admin/login")]
    public IActionResult Login(string? returnUrl = null, bool limite = false, bool salida = false)
    {
        if (User.Identity?.IsAuthenticated == true)
            return LocalRedirect(Url.IsLocalUrl(returnUrl) ? returnUrl! : "/admin");
        if (limite) ViewData["Notice"] = ("error", "Demasiados intentos desde esta conexión. Espera unos minutos antes de volver a intentar.");
        if (salida) ViewData["Notice"] = ("ok", "Cerraste sesión correctamente.");
        return View(new LoginViewModel { ReturnUrl = returnUrl });
    }

    // El token antifalsificación se valida a mano: si la página quedó abierta o se inició sesión en otra pestaña,
    // se muestra un aviso claro en lugar de una página de error 400.
    [HttpPost("/admin/login"), IgnoreAntiforgeryToken, EnableRateLimiting("admin-login")]
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        model.Email = model.Email?.Trim() ?? string.Empty;
        if (User.Identity?.IsAuthenticated == true)
            return LocalRedirect(Url.IsLocalUrl(model.ReturnUrl) ? model.ReturnUrl! : "/admin");
        if (!await antiforgery.IsRequestValidAsync(HttpContext))
        {
            ModelState.AddModelError(string.Empty, "La página estuvo abierta demasiado tiempo. Vuelve a escribir tu contraseña.");
            model.Password = string.Empty;
            return View(model);
        }
        // Se valida de nuevo con el correo ya sin espacios (pegarlo con espacios es un error común)
        ModelState.Clear();
        TryValidateModel(model);
        if (!ModelState.IsValid) return View(model);

        var result = await signInManager.PasswordSignInAsync(model.Email, model.Password, model.RememberMe, lockoutOnFailure: true);
        if (result.Succeeded) return LocalRedirect(Url.IsLocalUrl(model.ReturnUrl) ? model.ReturnUrl! : "/admin");

        // Mismo mensaje para credenciales incorrectas y cuenta bloqueada: no se revela si el correo existe
        if (result.IsLockedOut) logger.LogWarning("Inicio de sesión bloqueado temporalmente para un intento con correo registrado.");
        ModelState.AddModelError(string.Empty, GenericError);
        model.Password = string.Empty;
        return View(model);
    }

    [HttpPost("/admin/logout"), ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return Redirect("/admin/login?salida=true");
    }
}
