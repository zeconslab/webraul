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
                LinkedInUrl = "https://www.linkedin.com/in/raul-pimentel-4b7a87158/", GitHubUrl = "https://github.com/zeconslab",
                SeoTitle = "Raúl Pimentel | Desarrollador Web Full Stack en Puebla, México",
                SeoDescription = "Desarrollador web Full Stack freelance en Puebla, México. Laravel, Vue.js, SEO técnico y diseño responsive para PyMEs y startups. +5 años de experiencia. ¡Hablemos!",
                SeoKeywords = "desarrollador web Puebla, diseño web México, Full Stack developer, Laravel, Vue.js, SEO técnico, páginas web para PyMEs, desarrollo web freelance, Raúl Pimentel",
                SeoImageUrl = "https://pimentel.cloud/assets/img/logo/og-image.jpeg",
                IsIndexable = true
            });
            db.Services.AddRange(
                new ServiceItem { Title = "Página web profesional", Icon = "language", SortOrder = 1,
                    Description = "Tu tarjeta de presentación en internet, abierta las 24 horas. Explica lo que haces, genera confianza y lleva a la gente a escribirte.",
                    IdealFor = "Negocios que hoy dependen solo de redes o de recomendaciones.",
                    Includes = "Sitio rápido en celular, aparecer en Google Maps y Google, botón de WhatsApp y formulario.",
                    Timeframe = "2 a 4 semanas",
                    Highlights = "Carga en menos de 2 s\nSe ve perfecto en celular\nVisible en Google Maps\nBotón directo a WhatsApp" },
                new ServiceItem { Title = "Sistema de citas y reservas", Icon = "event_available", SortOrder = 2,
                    Description = "Tus clientes eligen día y hora desde su celular, reciben confirmación y tú ves la agenda completa sin contestar mensajes a las 11 de la noche.",
                    IdealFor = "Spas, clínicas, consultorios, barberías, estudios.",
                    Includes = "Agenda en línea, recordatorios, historial de clientes y panel para administrar.",
                    Timeframe = "4 a 8 semanas",
                    Highlights = "Agenda en línea 24/7\nConfirmación automática\nHistorial de cada cliente" },
                new ServiceItem { Title = "Tienda en línea", Icon = "shopping_cart", SortOrder = 3,
                    Description = "Vende mientras duermes. Catálogo, carrito, pagos con tarjeta y control de pedidos en un solo lugar.",
                    IdealFor = "Negocios que venden productos y hoy cobran por transferencia o en persona.",
                    Includes = "Catálogo administrable, pagos seguros, avisos de pedido y reportes de ventas.",
                    Timeframe = "5 a 10 semanas",
                    Highlights = "Catálogo que tú actualizas\nPagos con tarjeta\nAviso de cada pedido" },
                new ServiceItem { Title = "Sistema a la medida", Icon = "dashboard", SortOrder = 4,
                    Description = "Cuando ningún programa genérico se adapta a cómo trabajas. Lo construimos alrededor de tu operación, no al revés.",
                    IdealFor = "Empresas que hoy viven en Excel, libretas o con varios programas que no se hablan.",
                    Includes = "Control de clientes, inventario, usuarios con permisos y reportes al instante.",
                    Timeframe = "Según alcance, se define en el diagnóstico",
                    Highlights = "Clientes e inventario\nUsuarios con permisos\nReportes al instante" });
            db.Projects.Add(new Project {
                Title = "Everglow Spa", Slug = "everglow", Types = "web,sistema", Badge = "Cliente satisfecho", SortOrder = 1,
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
