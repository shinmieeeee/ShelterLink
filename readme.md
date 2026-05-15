<div align="center">

<h1>🐶🐾 ShelterLink  🐾🐱</h1>
<i><b> A web-based animal shelter management and adoption platform. </b> </i>
</div>

---

## Project Title

# ShelterLink — Animal Shelter Adoption Management System

---

## Project Description & Purpose

**ShelterLink** is a full-stack web application designed to streamline and digitize the animal adoption process for both shelter staff and prospective adopters. The system bridges the gap between animals in need of a home and the people who want to provide one — hence the name *ShelterLink*.

### Purpose

Animal shelters traditionally manage adoption records through paper-based or fragmented digital processes, leading to delays, miscommunication, and missed opportunities for animals to find homes. ShelterLink addresses these pain points by providing:

- A centralized platform where admins can manage the shelter's animal inventory and review adoption applications end-to-end.
- A clean, user-friendly dashboard for adopters to browse available animals, submit formal adoption applications, schedule interviews, and receive real-time notifications on their application status.
- A role-based access system that clearly separates the responsibilities of shelter administrators from those of registered adopters.

The system was built as an academic project to demonstrate the practical application of object-oriented design, relational database modeling, RESTful API development, and frontend-backend integration using modern web technologies.

---

### For Adopters
| Feature | Description |
|---|---|
| Registration & Login | Create an account with username, email, password, and age |
| Animal Browsing | Search and filter available animals by species, breed, age, and status |
| Adoption Applications | Submit detailed multi-field adoption applications |
| Application Tracking | Monitor application status: Pending → Under Review → Approved / Rejected |
| Interview Scheduling | Confirm for admin-booked interviews |
| Real-Time Notifications | In-app bell with unread badge for status changes and interview updates |
| Profile View | View account information from within the dashboard |
 
### For Administrators
| Feature | Description |
|---|---|
| Overview Dashboard | Live stats: total animals, pending applications, approvals, and rejections |
| Animal Management | Full CRUD with photo upload (JPEG, PNG, GIF, WebP — max 5 MB) |
| Application Workflow | Move applications through: Pending → Under Review → Approved / Rejected / Completed |
| Interview Management | Schedule interviews; changes auto-notify the applicant |
| User Management | View all users and update roles (Admin / Adopter) |
| Audit Logging | Immutable log of every significant admin action with actor, target, and timestamp |
 
---

## Architecture
 
ShelterLink follows a **layered MVC architecture** within a single ASP.NET Core application. The backend exposes a REST API consumed by a static HTML/CSS/JS frontend.
 
```
┌─────────────────────────────────────────────────┐
│              Frontend (Browser)                 │
│  HTML + CSS + Vanilla JavaScript (Fetch API)    │
│  Pages: login, register, dashboard, admin-dash  │
└────────────────────┬────────────────────────────┘
                     │ HTTP / JSON
┌────────────────────▼────────────────────────────┐
│            ASP.NET Core REST API                │
│  Auth · Animal · Applications · Admin ·         │
│  Dashboard · Notifications · Users · Adoption   │
└────────────────────┬────────────────────────────┘
                     │ EF Core
┌────────────────────▼────────────────────────────┐
│         Entity Framework Core 9 (ORM)           │
│  Users · Adopters · Admins · Animals ·          │
│  AdoptionApplications · AdoptionRecords ·       │
│  Notifications · AuditLogs · Shelters           │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│           MySQL 8 (via Pomelo EF Core)          │
└─────────────────────────────────────────────────┘
```
 
### Application Flow
 
1. **Register / Login** — `POST /api/auth/register` creates a `User` + linked `Adopter` record. `POST /api/auth/admin-login` verifies the `Admin` role and redirects to the admin dashboard.
2. **Browse Animals** — `GET /api/dashboard/user/{userId}` returns available animals, the user's applications, and unread notification count in a single round trip.
3. **Submit Application** — `POST /api/applications` validates availability, checks for duplicates, creates the `AdoptionApplication`, and marks the animal as `Pending`.
4. **Admin Review** — Admin schedules an interview (→ `UnderReview`), adopter confirms, admin approves (→ `Adopted`) or rejects (→ `Available`). Each step triggers a notification.
5. **Notifications** — `GET /api/notifications/user/{userId}` fetches all notifications; `PUT /api/notifications/{id}/read` clears the badge.
---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Language & Runtime | C# / .NET 10 |
| Web Framework | ASP.NET Core (MVC + Web API) |
| ORM | Entity Framework Core 9 |
| Database | MySQL 8 (Pomelo.EntityFrameworkCore.MySql) |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| UI Library | Bootstrap 5 |
 
---

## UML Diagram
<img width="982" height="1155" alt="ShelterLink_UML_drawio" src="https://github.com/user-attachments/assets/39c3c538-d530-4a89-961d-d642ce02a7e9" />


## OOP Principles 

### Encapsulation 
Models own their state-changing logic. `Animal.UpdateStatus()`, `AdoptionApplication.Approve()`/`Reject()`, and `Notification.MarkRead()` are called instead of setting properties directly. The frontend never touches the database — all communication goes through the API: Controllers call the Database layer via `ShelterLinkContext`.

### Abstraction
`AnimalStatus` and `ApplicationStatus` enums replace raw string comparisons. DTO classes (`AnimalDto`, `ApplicationRequest`, etc.) expose only what the frontend needs, hiding internal model structure.
 
### Inheritance
All controllers extend `ControllerBase`, inheriting HTTP helpers like `Ok()`, `NotFound()`, and `BadRequest()`. `Admin` and `Adopter` both extend `User` — role-specific tables add only the fields unique to each role.
 
### Polymorphism
Every controller action returns `IActionResult`, allowing different result types at runtime. `UpdateStatus()` uses a switch expression to produce different outcomes per status:
 
```csharp
app.Animal.Status = newStatus switch
{
    ApplicationStatus.Approved => AnimalStatus.Adopted,
    ApplicationStatus.Rejected => AnimalStatus.Available,
    ApplicationStatus.Pending  => AnimalStatus.Pending,
    _                          => app.Animal.Status
};
```
 
---

## Instructions on How to Run the Application

### Prerequisites

Ensure the following are installed on your machine before proceeding:

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (version 8.x recommended), running on port `3306`
- A MySQL client tool (e.g., MySQL Workbench, HeidiSQL, or the `mysql` CLI)
- [GitHub](https://github.com/)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/<your-username>/ShelterLink.git
cd ShelterLink/ShelterLink
```

### Step 2 — Configure the Database Connection

Open `appsettings.json` and update the connection string to match your MySQL credentials:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Port=3306;Database=shelterlinkdb;User=root;Password=YOUR_PASSWORD;"
  }
}
```

### Step 3 — Create the Database and Apply Migrations

```bash
# Restore NuGet packages
dotnet restore

# Apply all Entity Framework Core migrations to create the schema
dotnet ef database update
```

> If the `dotnet ef` command is not found, install the EF Core tools globally:
> ```bash
> dotnet tool install --global dotnet-ef
> ```

### Step 4 — Seed an Admin Account

ShelterLink does not include a seed script. After running migrations, manually insert an Admin user into the `Users` table using your MySQL client:

```sql
INSERT INTO Users (Name, Email, PasswordHash, Role)
VALUES ('Admin', 'admin@shelterlink.com', 'your_password', 'Admin');
```

### Step 5 — Run the Application

```bash
dotnet run
```

The application will start and listen on the configured port (typically `http://localhost:5084`). Check the terminal output for the exact URL.

### Step 6 — Access the Application

| Page | URL |
|---|---|
| Adopter Login | `http://localhost:5084/html/login.html` |
| Adopter Registration | `http://localhost:5084/html/register.html` |
| Adopter Dashboard | `http://localhost:5084/html/dashboard.html` |
| Admin Login | `http://localhost:5084/html/admin.html` |
| Admin Dashboard | `http://localhost:5084/html/admin-dashboard.html` |

---

## Developers / Team Members

| Name | Role |
|---|---|
| Earl Leobert Quijaro | Project Manager |
| Shin-mie Ramos  | GUI Designer |
| Shawn Janxent Torririt | Logic Developer|

---

*ShelterLink — Connecting animals with loving homes, one application at a time. 🐾*
