using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using webraul.Models;

namespace webraul.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await db.Database.MigrateAsync();

        if (!await db.SiteSettings.AnyAsync())
        {
            db.SiteSettings.Add(new SiteSettings {
                HeroText = "Transformo ideas en experiencias digitales rápidas, accesibles y enfocadas en resultados.",
                Email = "thezontrox@gmail.com", Phone = "+52 221 193 6628", Location = "Puebla, México",
                LinkedInUrl = "https://www.linkedin.com/in/raul-pimentel-4b7a87158/", GitHubUrl = "https://github.com/zeconslab"
            });
            db.Services.AddRange(
                new ServiceItem { Title = "Diseño web a medida", Description = "Interfaces personalizadas, responsivas y enfocadas en conversión.", Icon = "design_services", SortOrder = 1 },
                new ServiceItem { Title = "Desarrollo Full Stack", Description = "Aplicaciones robustas con frontend, backend y base de datos.", Icon = "deployed_code", SortOrder = 2 },
                new ServiceItem { Title = "SEO técnico", Description = "Optimización para buscadores, rendimiento y visibilidad orgánica.", Icon = "query_stats", SortOrder = 3 });
            db.Projects.Add(new Project {
                Title = "Everglow Spa", Slug = "everglow", Category = "wellness", Badge = "Cliente satisfecho", SortOrder = 1,
                Description = "Sistema integral para spa con gestión de citas, pacientes y tratamientos.",
                Technologies = "Laravel, MySQL, HTML, CSS", Features = "Sistema de citas online\nGestión de pacientes\nHistorial de tratamientos\nPanel administrativo",
                WebsiteUrl = "https://everglow.com.mx/", DesktopImageUrl = "/assets/img/everglow.png", MobileImageUrl = "/assets/img/everglow-movil.png"
            });
            db.Faqs.AddRange(
                new FaqItem { Question = "¿Cuánto tarda un proyecto web?", Answer = "Depende del alcance. Un sitio profesional suele tomar entre 2 y 6 semanas.", SortOrder = 1 },
                new FaqItem { Question = "¿Incluyes hosting y dominio?", Answer = "Puedo asesorarte y encargarme de la configuración y publicación.", SortOrder = 2 });
            await db.SaveChangesAsync();
        }

        var adminEmail = configuration["Admin:Email"];
        var adminPassword = configuration["Admin:InitialPassword"];
        if (!string.IsNullOrWhiteSpace(adminEmail) && !string.IsNullOrWhiteSpace(adminPassword))
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
            var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            const string administratorRole = "Administrator";
            if (!await roles.RoleExistsAsync(administratorRole))
            {
                var roleResult = await roles.CreateAsync(new IdentityRole(administratorRole));
                if (!roleResult.Succeeded)
                    throw new InvalidOperationException(string.Join("; ", roleResult.Errors.Select(x => x.Description)));
            }

            var admin = await users.FindByEmailAsync(adminEmail);
            if (admin is null)
            {
                admin = new IdentityUser { UserName = adminEmail, Email = adminEmail, EmailConfirmed = true };
                var result = await users.CreateAsync(admin, adminPassword);
                if (!result.Succeeded)
                    throw new InvalidOperationException(string.Join("; ", result.Errors.Select(x => x.Description)));
            }
            if (!await users.IsInRoleAsync(admin, administratorRole))
            {
                var roleResult = await users.AddToRoleAsync(admin, administratorRole);
                if (!roleResult.Succeeded)
                    throw new InvalidOperationException(string.Join("; ", roleResult.Errors.Select(x => x.Description)));
            }
        }
    }
}
