using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace webraul.Data.Migrations
{
    /// <inheritdoc />
    public partial class LeadTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DiagnosticAnswers",
                table: "ContactMessages",
                type: "nvarchar(800)",
                maxLength: 800,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "ContactMessages",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "ContactMessages",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "formulario");

            migrationBuilder.AddColumn<string>(
                name: "Stage",
                table: "ContactMessages",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "nuevo");

            // Lo ya leído se toma como atendido para no inflar "esperan respuesta"
            migrationBuilder.Sql("UPDATE ContactMessages SET Stage = 'contactado' WHERE IsRead = 1;");

            migrationBuilder.AddColumn<DateTime>(
                name: "StageUpdatedAtUtc",
                table: "ContactMessages",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DiagnosticCompletions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    VisitorHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Business = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiagnosticCompletions", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DiagnosticCompletions");

            migrationBuilder.DropColumn(
                name: "DiagnosticAnswers",
                table: "ContactMessages");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "ContactMessages");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "ContactMessages");

            migrationBuilder.DropColumn(
                name: "Stage",
                table: "ContactMessages");

            migrationBuilder.DropColumn(
                name: "StageUpdatedAtUtc",
                table: "ContactMessages");
        }
    }
}
