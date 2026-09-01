using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using webraul.Models;
using Microsoft.AspNetCore.RateLimiting;

namespace webraul.Controllers;

public sealed class AccountController(SignInManager<IdentityUser> signInManager) : Controller
{
    [HttpGet("/admin/login")]
    public IActionResult Login(string? returnUrl = null) => View(new LoginViewModel { ReturnUrl = returnUrl });

    [HttpPost("/admin/login"), ValidateAntiForgeryToken, EnableRateLimiting("admin-login")]
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        if (!ModelState.IsValid) return View(model);
        var result = await signInManager.PasswordSignInAsync(model.Email, model.Password, model.RememberMe, lockoutOnFailure: true);
        if (result.Succeeded) return LocalRedirect(model.ReturnUrl ?? "/admin");
        ModelState.AddModelError(string.Empty, "No fue posible iniciar sesión. Verifica tus credenciales o inténtalo más tarde.");
        return View(model);
    }

    [HttpPost("/admin/logout"), ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return RedirectToAction(nameof(Login));
    }
}
