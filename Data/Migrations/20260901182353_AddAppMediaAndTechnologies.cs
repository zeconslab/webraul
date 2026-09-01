using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace webraul.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAppMediaAndTechnologies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Apps",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Technologies",
                table: "Apps",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Apps");

            migrationBuilder.DropColumn(
                name: "Technologies",
                table: "Apps");
        }
    }
}
