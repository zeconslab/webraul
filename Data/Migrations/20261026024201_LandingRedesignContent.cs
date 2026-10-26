using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace webraul.Data.Migrations
{
    /// <inheritdoc />
    public partial class LandingRedesignContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Categoría -> tipos del nuevo sitio (web, sistema, app, tienda)
            migrationBuilder.RenameColumn(
                name: "Category",
                table: "Projects",
                newName: "Types");

            migrationBuilder.Sql("""
                UPDATE Projects SET Types = CASE Types
                    WHEN 'mobile' THEN 'app'
                    WHEN 'ecommerce' THEN 'tienda'
                    WHEN 'saas' THEN 'sistema'
                    ELSE 'web' END;
                UPDATE Projects SET Badge = '' WHERE Badge = 'Proyecto completado';
                """);

            migrationBuilder.AddColumn<string>(
                name: "Highlights",
                table: "Services",
                type: "nvarchar(600)",
                maxLength: 600,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IdealFor",
                table: "Services",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Includes",
                table: "Services",
                type: "nvarchar(600)",
                maxLength: 600,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Timeframe",
                table: "Services",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "GalleryImages",
                table: "Projects",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "Projects",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "ContactMessages",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(160)",
                oldMaxLength: 160);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "ContactMessages",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: true);

            // Las apps pasan a ser proyectos de tipo "app" antes de eliminar su tabla.
            migrationBuilder.Sql("""
                INSERT INTO Projects (Title, Slug, Description, Technologies, Features, WebsiteUrl, DesktopImageUrl, MobileImageUrl, Types, Badge, IsFeatured, GalleryImages, SortOrder, IsPublished)
                SELECT Name, CONCAT('app-', Id), Description, Technologies, '', Url, NULL, ImageUrl, 'app', '', 0, '', SortOrder + 100, IsPublished
                FROM Apps;
                """);

            migrationBuilder.DropTable(
                name: "Apps");

            // Si nadie es portada, se usa el primer proyecto publicado.
            migrationBuilder.Sql("""
                UPDATE Projects SET IsFeatured = 1
                WHERE Id = (SELECT TOP 1 Id FROM Projects WHERE IsPublished = 1 ORDER BY SortOrder, Id)
                  AND NOT EXISTS (SELECT 1 FROM Projects WHERE IsFeatured = 1);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Highlights",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "IdealFor",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Includes",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Timeframe",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "GalleryImages",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "ContactMessages");

            migrationBuilder.RenameColumn(
                name: "Types",
                table: "Projects",
                newName: "Category");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "ContactMessages",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(160)",
                oldMaxLength: 160,
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "Apps",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Icon = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    ProjectType = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    Technologies = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Apps", x => x.Id);
                });
        }
    }
}
