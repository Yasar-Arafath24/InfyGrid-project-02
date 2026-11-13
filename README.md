# Students Management Portal

A full-stack student records portal built with React and Laravel. The frontend provides a dashboard, student CRUD tools, and a department directory; Laravel serves the API and stores student records in SQLite by default, with MySQL available as an alternative.

## Features

- View, add, edit, search, and delete student records.
- Browse departments with student and course summaries.
- Filter the student list by department.
- Validate required student details, unique email addresses, phone numbers, and dates of birth.
- Display request errors and success messages in the interface.
- Use a responsive cream-and-navy interface.

## Project layout

```text
.
├── backend/       Laravel application, API, migrations, and database configuration
├── frontend/      React application built with Vite
├── database/      Root-level local database files, if used
├── .gitignore
└── README.md
```

The frontend's Vite development server proxies `/api` requests to `http://127.0.0.1:8000`. Run the frontend and backend in separate terminals.

## Requirements

- PHP 8.3 or later with the PDO driver for the selected database
- Composer
- Node.js and npm (Node.js 20.19+ or 22.12+ recommended for Vite 8)
- SQLite, or a running MySQL server

## Run locally with SQLite

### 1. Configure and start Laravel

In PowerShell:

```powershell
Set-Location backend
composer install

if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
}

php artisan key:generate

if (-not (Test-Path 'database\database.sqlite')) {
    New-Item -ItemType File -Path 'database\database.sqlite'
}

php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Keep this terminal open. Laravel's `.env.example` selects SQLite; its database file is `backend/database/database.sqlite`.

### 2. Start the React frontend

In a second terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the URL printed by Vite (normally [http://localhost:5173](http://localhost:5173)). The frontend uses the Vite proxy to reach Laravel at `http://127.0.0.1:8000`.

## Use MySQL instead

1. Start MySQL and create an empty database, for example `students_management`.
2. Update the database settings in `backend/.env`:

   ```dotenv
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=students_management
   DB_USERNAME=root
   DB_PASSWORD=your_local_mysql_password
   ```

3. From `backend`, apply the configuration and migrations:

   ```powershell
   php artisan config:clear
   php artisan migrate
   ```

Use the username, password, and port configured for your MySQL installation. Switching connections and running migrations creates the schema in MySQL; it does **not** copy existing records from SQLite. Export and import those records separately if you need to preserve them. Avoid `php artisan migrate:fresh` unless you intend to drop the target database's tables.

## Student API

Base URL when Laravel is running locally: `http://127.0.0.1:8000/api`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/students` | List students |
| `POST` | `/students` | Create a student |
| `GET` | `/students/{id}` | Get one student |
| `PUT` / `PATCH` | `/students/{id}` | Update a student |
| `DELETE` | `/students/{id}` | Delete a student |

Create and update requests use the following fields:

```json
{
  "name": "Alex Morgan",
  "email": "alex.morgan@example.com",
  "phone": "9876543210",
  "date_of_birth": "2005-06-15",
  "course": "B.Tech",
  "department": "Computer Science",
  "address": "Chennai, Tamil Nadu"
}
```

All fields are required by the API. Email addresses must be unique, phone numbers must contain 10–15 digits with an optional leading `+`, and the date of birth cannot be in the future. Validation failures return `422` with field-specific errors. A successful create returns `201`; successful reads, updates, and deletes return `200`.

The student resource routes currently have no authentication middleware. Add appropriate authentication and authorization before exposing this API to untrusted users or deploying it publicly.

## Checks

Run backend tests from `backend`:

```powershell
php artisan test --compact
```

Run frontend checks from `frontend`:

```powershell
npm run lint
npm run build
```

## Troubleshooting

- **The frontend cannot reach the API:** keep Laravel running on port `8000`; check the proxy target in `frontend/vite.config.js`.
- **A database driver is missing:** enable `pdo_sqlite` for SQLite or `pdo_mysql` for MySQL in the PHP installation used by the terminal.
- **MySQL connection errors:** verify that MySQL is running, the database exists, and the `.env` credentials and port are correct. Then run `php artisan config:clear`.
- **Schema changes are not present:** run `php artisan migrate` from `backend` and check `php artisan migrate:status`.
