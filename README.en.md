[中文](./README.md) | English

# Kupola App

[Kupola](https://github.com/kupola-cn/kupola) administration console example with a frontend application and an optional Go backend backed by PostgreSQL.

This project demonstrates how to build a practical administration console with Kupola's runtime, router, authentication, and component packages. The frontend defaults to Mock mode and can be switched to the Go + PostgreSQL backend when needed.

## Project Structure

```text
kupola-app/
├── frontend/              # Kupola + Vite frontend
├── backend/               # Gin + GORM backend
│   ├── config/             # Configuration loading
│   ├── database/           # Database connection, migrations, and seed data
│   ├── middleware/         # Authentication and request logging
│   ├── models/             # GORM models
│   ├── routes/             # API routes and handlers
│   ├── scripts/setup-dev.ps1  # Windows initialization script
│   ├── scripts/setup-dev.sh   # Linux/macOS initialization script
│   ├── config.example.yaml
│   └── main.go
└── README.md
```

## Run Modes

This project defaults to **Mock mode**. You only need Node.js to run the frontend; Go, PostgreSQL, and the backend are not required:

```bash
cd frontend
npm install
npm run dev
```

Mock mode is suitable for quickly exploring the pages, permission interactions, and frontend workflows. Mock data is kept in browser memory and returns to its initial state after a page refresh.

**HTTP + PostgreSQL mode is optional** and is intended for real backend integration, database verification, and API development. See the backend setup and backend integration sections below.

## Requirements

- Node.js 20+

The following are only required for HTTP + PostgreSQL mode:

- Go 1.22+
- PostgreSQL 14+
- PostgreSQL running locally at `127.0.0.1:5432`

The default database configuration is user `postgres`, password `123456`, and database `kupola_app`. You can override these values with `KUPOLA_*` environment variables. Do not use these defaults in production.

## Optional Backend Setup

Windows PowerShell:

```powershell
cd backend
.\scripts\setup-dev.ps1
```

Linux/macOS:

```bash
cd backend
bash ./scripts/setup-dev.sh
```

Both scripts create the `kupola_app` database and run the GORM migrations and initial seed data. The backend `migrate` and `seed` commands are the single source of truth for the database schema and test data, avoiding drift between hand-written SQL and model definitions.

The current initialization scope only includes the user module: it creates the `users` table and inserts 12 business users and 4 system login accounts. Organizations, roles, permissions, menus, dictionaries, operation logs, login logs, and notifications still use frontend Mock data and do not have backend tables yet.

You can also run the commands manually:

```bash
cd backend
export KUPOLA_DATABASE_PASSWORD=123456
createdb -h 127.0.0.1 -p 5432 -U postgres kupola_app
go run . migrate
go run . seed
```

Skip `createdb` when the database already exists. Start the backend with:

```bash
go run . server
```

The backend is available at `http://127.0.0.1:8080`, with a health check at `http://127.0.0.1:8080/health`.

Available backend commands:

```text
go run . server    start HTTP server
go run . migrate   run database migrations
go run . seed      seed initial users
```

## Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to Mock mode and does not depend on PostgreSQL or the backend. It is available at `http://127.0.0.1:5173`.

Default Mock credentials are `admin/newpass123`; the other test accounts use password `123456`. Mock users and user CRUD data are kept in the current browser process and return to their initial state after a refresh.

## Backend Integration

Complete the optional backend setup and start the backend first. Then set the API mode before starting Vite:

```powershell
$env:VITE_API_MODE = 'http'
npm run dev
```

In HTTP mode, the Vite proxy forwards `/api` requests to the backend on port `8080`.

## Configuration

Copy `backend/config.example.yaml` to `backend/config.yaml` and adjust it for your environment, or use environment variables:

```powershell
$env:KUPOLA_DATABASE_PASSWORD = '123456'
$env:KUPOLA_JWT_SECRET = 'replace-with-a-secret-at-least-32-characters'
go run . server
```

Replace the database password and JWT secret in production.

## Initial Accounts

After running `seed` on a new database, the initial passwords are:

| Username | Role |
| --- | --- |
| admin | Administrator, `newpass123` |
| operator | Operations administrator, `123456` |
| viewer | Read-only member, `123456` |
| auditor | Auditor, `123456` |

## Verification

```bash
cd backend
go test ./...
go vet ./...

cd ../frontend
npm run build
export KUPOLA_TEST_PASSWORD=newpass123
npm run test:e2e
```

Set `KUPOLA_TEST_PASSWORD` to the current password if the administrator password has been changed.
