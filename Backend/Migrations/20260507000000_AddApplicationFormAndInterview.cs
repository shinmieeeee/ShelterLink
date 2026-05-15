using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ShelterLink.Migrations
{
    public partial class AddApplicationFormAndInterview : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>("ApplicantFullName",  "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<string>("ApplicantAddress",   "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<string>("ApplicantPhone",     "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<string>("HousingType",        "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<bool?> ("HasYard",            "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<bool?> ("HasOtherPets",       "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<string>("OtherPetsDetails",   "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<bool?> ("HasChildren",        "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<string>("ChildrenAges",       "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<string>("AdoptionReason",     "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<string>("DailyRoutine",       "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<string>("VetReference",       "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<bool?> ("AgreeToTerms",       "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<DateTime?>("InterviewScheduledAt", "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<bool?> ("AdopterConfirmed",   "AdoptionApplications", nullable: true);
            migrationBuilder.AddColumn<bool?> ("RescheduleRequested","AdoptionApplications", nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn("ApplicantFullName",   "AdoptionApplications");
            migrationBuilder.DropColumn("ApplicantAddress",    "AdoptionApplications");
            migrationBuilder.DropColumn("ApplicantPhone",      "AdoptionApplications");
            migrationBuilder.DropColumn("HousingType",         "AdoptionApplications");
            migrationBuilder.DropColumn("HasYard",             "AdoptionApplications");
            migrationBuilder.DropColumn("HasOtherPets",        "AdoptionApplications");
            migrationBuilder.DropColumn("OtherPetsDetails",    "AdoptionApplications");
            migrationBuilder.DropColumn("HasChildren",         "AdoptionApplications");
            migrationBuilder.DropColumn("ChildrenAges",        "AdoptionApplications");
            migrationBuilder.DropColumn("AdoptionReason",      "AdoptionApplications");
            migrationBuilder.DropColumn("DailyRoutine",        "AdoptionApplications");
            migrationBuilder.DropColumn("VetReference",        "AdoptionApplications");
            migrationBuilder.DropColumn("AgreeToTerms",        "AdoptionApplications");
            migrationBuilder.DropColumn("InterviewScheduledAt","AdoptionApplications");
            migrationBuilder.DropColumn("AdopterConfirmed",    "AdoptionApplications");
            migrationBuilder.DropColumn("RescheduleRequested", "AdoptionApplications");
        }
    }
}
