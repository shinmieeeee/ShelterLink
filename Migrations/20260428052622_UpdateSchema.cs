using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShelterLink.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Animals",
                type: "longtext",
                nullable: false,
                defaultValue: "Available",
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "AdoptionApplications",
                type: "longtext",
                nullable: false,
                defaultValue: "Pending",
                oldClrType: typeof(int),
                oldType: "int")
                .Annotation("MySql:CharSet", "utf8mb4");

            // Safe index creation — checks if index already exists before creating.
            // This prevents crashes when groupmates run the migration on a DB
            // that already has the index from a previous partial run.
            migrationBuilder.Sql(@"
                SET @exists = (
                    SELECT COUNT(*) FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                    AND table_name = 'Users'
                    AND index_name = 'IX_Users_Email'
                );
                SET @sql = IF(@exists = 0,
                    'CREATE UNIQUE INDEX IX_Users_Email ON Users (Email)',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");

            migrationBuilder.Sql(@"
                SET @exists = (
                    SELECT COUNT(*) FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                    AND table_name = 'AdoptionRecords'
                    AND index_name = 'IX_AdoptionRecords_AppId'
                );
                SET @sql = IF(@exists = 0,
                    'CREATE UNIQUE INDEX IX_AdoptionRecords_AppId ON AdoptionRecords (AppId)',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");

            migrationBuilder.Sql(@"
                SET @exists = (
                    SELECT COUNT(*) FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                    AND table_name = 'Adopters'
                    AND index_name = 'IX_Adopters_UserId'
                );
                SET @sql = IF(@exists = 0,
                    'CREATE UNIQUE INDEX IX_Adopters_UserId ON Adopters (UserId)',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");

            migrationBuilder.Sql(@"
                SET @exists = (
                    SELECT COUNT(*) FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                    AND table_name = 'Admins'
                    AND index_name = 'IX_Admins_UserId'
                );
                SET @sql = IF(@exists = 0,
                    'CREATE UNIQUE INDEX IX_Admins_UserId ON Admins (UserId)',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_AdoptionRecords_AppId",
                table: "AdoptionRecords");

            migrationBuilder.DropIndex(
                name: "IX_Adopters_UserId",
                table: "Adopters");

            migrationBuilder.DropIndex(
                name: "IX_Admins_UserId",
                table: "Admins");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "Animals",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldDefaultValue: "Available")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "AdoptionApplications",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldDefaultValue: "Pending")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_AdoptionRecords_AppId",
                table: "AdoptionRecords",
                column: "AppId");

            migrationBuilder.CreateIndex(
                name: "IX_Adopters_UserId",
                table: "Adopters",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Admins_UserId",
                table: "Admins",
                column: "UserId");
        }
    }
}