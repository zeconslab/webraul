using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace webraul.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSeoFieldsToSiteSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GoogleSiteVerification",
                table: "SiteSettings",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsIndexable",
                table: "SiteSettings",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "SeoDescription",
                table: "SiteSettings",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SeoImageUrl",
                table: "SiteSettings",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SeoKeywords",
                table: "SiteSettings",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SeoTitle",
                table: "SiteSettings",
                type: "nvarchar(70)",
                maxLength: 70,
                nullable: false,
                defaultValue: "");

            // Rellena los valores existentes con lo que hoy está fijo en Views/Home/Index.cshtml,
            // así el SEO en vivo no cambia hasta que se edite desde el panel.
            migrationBuilder.Sql("""
                UPDATE [SiteSettings] SET
                    [SeoTitle] = N'Raúl Pimentel | Desarrollador Web Full Stack en Puebla, México',
                    [SeoDescription] = N'Desarrollador web Full Stack freelance en Puebla, México. Laravel, Vue.js, SEO técnico y diseño responsive para PyMEs y startups. +5 años de experiencia. ¡Hablemos!',
                    [SeoKeywords] = N'desarrollador web Puebla, diseño web México, Full Stack developer, Laravel, Vue.js, SEO técnico, páginas web para PyMEs, desarrollo web freelance, Raúl Pimentel',
                    [SeoImageUrl] = N'https://pimentel.cloud/assets/img/logo/og-image.jpeg',
                    [GoogleSiteVerification] = N'3ObJGYZ6Fay_5nJB_JX3hz4l8h2NUjjO2weR3rzi1mY',
                    [IsIndexable] = 1;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GoogleSiteVerification",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "IsIndexable",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "SeoDescription",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "SeoImageUrl",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "SeoKeywords",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "SeoTitle",
                table: "SiteSettings");
        }
    }
}
