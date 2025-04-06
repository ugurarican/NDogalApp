using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NDogalApp.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddShippedQuantityToOrderItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ShippedQuantity",
                table: "OrderItems",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShippedQuantity",
                table: "OrderItems");
        }
    }
}
