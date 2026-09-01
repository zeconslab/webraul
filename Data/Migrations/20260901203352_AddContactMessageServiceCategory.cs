using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace webraul.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddContactMessageServiceCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ServiceCategory",
                table: "ContactMessages",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ServiceCategory",
                table: "ContactMessages");
        }
    }
}
