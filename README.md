# Secure Task Management System

## Overview

This project is a **Secure Task Management System** built with **role-based access control (RBAC)** in a modular **NX monorepo**. It allows users to manage tasks securely: only authorized users can access and modify data based on their roles and organizational hierarchy.

- **Backend:** NestJS + TypeORM + PostgreSQL  
- **Frontend:** Angular + TailwindCSS  
- **Auth:** JWT-based (no mock auth)  
- **Shared:** `libs/data` (interfaces & DTOs), `libs/auth` (RBAC helpers & decorators)

---

## Live app

The app is available at:

**https://www.sanshas.com/**

(Also: **https://sanshas.com** — both use HTTPS.)

### How to open and log in

1. Open **https://www.sanshas.com/** in your browser.
2. Use **Login** (or **Register** to create a new organization and owner).
3. Use the sample credentials below to try the seeded admin account.

### Sample credentials

| Purpose | Email | Password |
|--------|--------|----------|
| **Admin (Owner)** — full access to Dashboard, Todos, Users, Roles, Logs, Documentation | `admin@example.com` | `admin123` |

After login you can use the top navigation: **Dashboard**, **Roles**, **Users**, **Todos**, **Logs**, **Documentation**. Visibility of links depends on the user’s role and permissions.

**API docs (Swagger):** Swagger is restricted to the **super organization** (e.g. `admin@example.com`). To open it: log in, go to **Documentation** in the nav, and click **Open Swagger UI**. Your token is passed automatically — no copying required. Direct URL: **https://sanshas.com/api-docs** (or https://www.sanshas.com/api-docs). Use **/api-docs** (not `/api/api-docs`) so that Swagger’s assets load correctly.

### Demonstration & deployment tech stack

The live app at **https://www.sanshas.com** is deployed on **AWS EC2** with the following stack:

| Layer | Technology |
|-------|------------|
| **Hosting** | AWS EC2 (Ubuntu 22.04, t3.small) |
| **Domain & DNS** | GoDaddy (sanshas.com, www.sanshas.com → EC2 public IP) |
| **SSL/TLS** | Let's Encrypt (Certbot + `python3-certbot-nginx`) |
| **Reverse proxy** | Nginx (proxies `/` → dashboard, `/api` and `/api-docs` → NestJS API) |
| **Process manager** | PM2 (Node.js API + static dashboard server) |
| **Database** | PostgreSQL (on EC2) |
| **Runtime** | Node.js 18 LTS |
| **Backend** | NestJS + TypeORM |
| **Frontend** | Angular (built, served via `npx serve`) |


---

**Screenshots gallery** (add the image files to `docs/screenshots/` to display):

| Landing | Login |
|---------|-------|
| ![Landing](docs/screenshots/01-landing.png) | ![Login](docs/screenshots/02-login.png) |

| Dashboard | Todos |
|-----------|-------|
| ![Dashboard](docs/screenshots/03-dashboard.png) | ![Todos](docs/screenshots/04-todos.png) |

| Add todo | Users |
|----------|-------|
| ![Add todo](docs/screenshots/05-add-todo.png) | ![Users](docs/screenshots/06-users.png) |

| Roles | Logs |
|-------|------|
| ![Roles](docs/screenshots/07-roles.png) | ![Audit log](docs/screenshots/08-audit-log.png) |

| Documentation | Mobile — Dashboard |
|----------------|------------------|
| ![Documentation](docs/screenshots/09-documentation.png) | ![Mobile Dashboard](docs/screenshots/10-mobile-dashboard.png) |

| Mobile — Todos | Mobile — Add todo |
|----------------|------------------|
| ![Mobile Todos](docs/screenshots/11-mobile-todos.png) | ![Mobile Add todo](docs/screenshots/12-mobile-add-todo.png) |

---

## Setup Instructions

### How to run backend and frontend

**Prerequisites:** Node.js 18+ LTS, PostgreSQL, npm (or pnpm)

```bash
git clone https://github.com/shashidhar-katkam/skatkam-0424cd53-10f9-41fa-8305-cc37ffd85326.git
cd skatkam-0424cd53-10f9-41fa-8305-cc37ffd85326
npm ci
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env (see below)
npx nx run api:serve          # Backend → http://localhost:3333
npx nx run dashboard:serve    # Frontend → http://localhost:4200
```

**Production build:**

```bash
npx nx build api
npx nx build dashboard
# API: run node dist/apps/api/src/main.js
# Dashboard: serve static files from dist/apps/dashboard (e.g. nginx)
```

### .env configuration

Create `apps/api/.env` from `apps/api/.env.example`:

| Variable | Description |
|----------|-------------|
| **DATABASE_URL** | PostgreSQL connection URL (e.g. `postgresql://user:password@localhost:5432/taskdb`) |
| **JWT_SECRET** | Secret for signing JWTs — **change in production** |
| **PORT** | Optional; default `3333` |
| **NODE_ENV** | Optional; `development` / `production` |
| **LOG_LEVEL** | Optional; `error` \| `warn` \| `info` \| `debug` |

### Frontend API URL (backend connection)

The dashboard sends HTTP requests to the API. Configure the backend base URL in the **environment files**:

| File | When used | `apiUrl` |
|------|-----------|----------|
| `apps/dashboard/src/environments/environment.ts` | Development (`npx nx run dashboard:serve`) | `http://localhost:3333` |
| `apps/dashboard/src/environments/environment.prod.ts` | Production build (`npx nx build dashboard`) | `/api` (relative) |

**Development:** Edit `environment.ts` if your API runs on a different host or port:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3333',  // change host/port as needed
};
```

**Production:** Edit `environment.prod.ts` before building:
- Use `/api` when the frontend and API are served from the same origin (e.g. nginx proxies `/api` to the backend).
- Use a full URL (e.g. `https://api.example.com`) when the API is on a different domain.
```typescript
export const environment = {
  production: true,
  apiUrl: '/api',  // or 'https://your-api-host.com'
};
```

---

## How the app works

After setup, run the API and dashboard, then use the app as follows.

### User registration

- **Landing:** Unauthenticated users see a landing page with **Login** and **Register**.
- **Register:** **POST /auth/register** creates a new **organization** and an **owner** user in one step. The form collects organization name, owner email, name, and password. After success, the user is logged in (JWT returned) and redirected to the dashboard.
- **Login:** **POST /auth/login** with email and password returns an **accessToken** and user (with permissions). The frontend stores the token and sends it as `Authorization: Bearer <token>` on every API request.

### Dashboard

- The **dashboard** is the main app shell after login: header (app title, nav links, theme toggle, user menu/logout).
- **Navigation** is permission-based: links to **Todos**, **Users**, **Roles**, **Audit log**, and **Documentation** are shown only if the current user has the required permission (e.g. `tasks.view`, `users.view_users`, `roles.view_roles`, `audit.view`). Unauthorized routes are guarded and redirect to the dashboard or login.

### Users

- **Users** are scoped by organization: a user belongs to one organization and has one role.
- **List:** GET /users returns users in the current user’s organization, with **pagination** (see below).
- **Create/Edit/Delete:** Available only with `users.create_users`, `users.update_users`, `users.delete_users`. Forms use the same API; create user requires email, name, password, and role (from the roles list).

### Roles

- **Roles** define what a user can do via a set of **permissions** (e.g. `tasks.view`, `tasks.create`, `roles.view_roles`). System roles (Owner, Admin, Viewer) are pre-seeded; custom roles can be added and edited.
- **List:** GET /roles returns roles with **pagination**.
- **Create/Edit:** Role form shows permission modules and features (from GET /permissions/structure). Saving creates or updates the role and its permission map. Delete is allowed when the role is not in use (or by policy).

### Tasks

- **Tasks** are the core resource: title, description, status, category, optional assignee, priority, due date, etc. They are scoped by organization.
- **List:** GET /tasks returns tasks for the user’s organization, with **sort** (e.g. by createdAt, status), **filter** (e.g. status, category), and optional **pagination**.
- **Create/Edit/Delete:** Buttons and routes are guarded by `tasks.create`, `tasks.update`, `tasks.delete`. The UI supports a task list/board, drag-and-drop for status/order, and a task form/dialog. **Keyboard shortcuts** on the Tasks page: `?` (help), `N` (new), `E` (edit), `Delete` (delete), `Esc` (close).

### Theme (light / dark mode)

- A **theme toggle** in the header (and on landing/login/register) switches between **light** and **dark** mode.
- The choice is stored in **localStorage** and applied by adding a `dark` class on the document root; Tailwind uses `dark:` variants. A small script in `index.html` runs before the app loads to avoid a flash of the wrong theme.

### Logs (audit log)

- **Audit log** records who did what and when (e.g. login, task create/update/delete, role changes). Access is restricted to **Owner and Admin** (`audit.view`).
- **List:** GET /audit-log returns entries for the user’s organization with **pagination**. The UI shows a table with action, resource, user, timestamp, and optional details.

### Documentation

- The **Documentation** page in the app describes how to use the system (overview, auth, tasks, roles, users, audit). It is a static content page; the link is shown when the user has the right permission (or for all authenticated users, depending on your nav rules).

### Pagination

- **Backend:** List endpoints that support pagination accept **query parameters** `page` and `limit` (e.g. `?page=1&limit=10`). Default `limit` is **10**. The API returns a shape like `{ items: T[], total: number }` so the client can build page controls.
- **Frontend:** List screens (Users, Roles, Audit log) request one page at a time (e.g. `page=1`, `limit=10`). They display **Previous / Next** (and optionally page numbers) and show “Page X of Y” or “Showing X–Y of total”. Task list may use the same pattern or load all with sort/filter depending on implementation; when task list is paginated, it uses the same `page`/`limit` and `items`/`total` contract.
- **Consistency:** Page size **10** is used as the default across roles, users, and audit log so behavior is consistent and all pagination is done on the server.

---

## Architecture Overview

### NX monorepo layout and rationale

| Path | Purpose |
|------|---------|
| **apps/api** | NestJS backend: REST API, TypeORM, PostgreSQL, JWT auth, RBAC guards, Swagger at `/api-docs`, audit logging. |
| **apps/dashboard** | Angular SPA: task dashboard, roles/users CRUD, audit log, login/register; permission-driven nav; TailwindCSS. |
| **libs/data** | Shared TypeScript interfaces and DTOs (Task, User, Role, Auth, Audit, PermissionStructure, etc.) used by both API and dashboard. |
| **libs/auth** | Reusable RBAC logic and decorators: permission checks, role inheritance (`module.*`, parent key). Used by the API; dashboard has its own route/permission guards. |

Single repo keeps backend and frontend in sync, shared types in `libs/data` avoid drift, and `libs/auth` centralizes permission rules so the API stays consistent and testable.

### Explanation of shared libraries and modules

- **libs/data** – Defines request/response shapes and domain types. API and dashboard both import from `@assessment-task/data` so contract changes are caught at compile time.
- **libs/auth** – Exposes `checkPermission()`, `@RequirePermission()`, JWT guard, etc. The API uses these for route protection and service-level checks; the dashboard uses equivalent logic in its guards and `AuthService` for UI (nav, buttons).

---

## Data Model Explanation

### Schema description

- **User** – `id`, `email`, `passwordHash`, `name`, `organizationId`, `roleId`. Belongs to one organization and one role.
- **Organization** – `id`, `name`, `parentId`. Two-level hierarchy (root org and optional parent).
- **Role** – `id`, `name`, `slug` (e.g. owner, admin, viewer), `permissions` (JSON: `moduleId.featureId` → boolean), `isActive`. System roles (Owner, Admin, Viewer) plus custom roles.
- **PermissionModule** / **PermissionFeature** – Registry of modules and features (e.g. `tasks`, `tasks.view`). Used to build role-edit UI and sync defaults.
- **Task** – `id`, `title`, `description`, `status`, `category`, `order`, `organizationId`, `createdById`, `assigneeId`, `priority`, `dueDate`, `issueKey`, `createdAt`, `updatedAt`. Resource scoped by organization.
- **AuditLog** – `id`, `accountId`, `organizationId`, `action`, `resource`, `resourceId`, `details`, `ipAddress`, `userAgent`, `timestamp`. Used for access/action logging.

### ERD (conceptual)

```
Organization 1──* User          (users belong to one org)
Organization 1──* Task         (tasks belong to one org)
Role 1──* User                 (users have one role)
User 1──* Task (createdBy)     (task creator)
Task ──* User (assignee)       (optional assignee)
AuditLog ── accountId, organizationId
```

Seed on first run: default organization, roles (owner/admin/viewer), user `admin@example.com` / `admin123`, and permission sync so the registry and system-role permissions are populated.

---

## Access Control Implementation

### Role, permission, and organization hierarchy

- **Roles:** Owner and Admin have full access via `*` in permissions. Viewer has limited (e.g. `tasks.view`, `audit.view`). Custom roles get granular permissions from the DB (`moduleId.featureId`).
- **Organization:** Users and tasks are scoped by `organizationId`. List/update/delete enforce that the user’s org matches the resource’s org.
- **Role inheritance in checks:** `*` or `all` → full access; `moduleId.*` → full module; exact key or parent key (e.g. `roles` for `roles.view_roles`) in `libs/auth` and API shared helper.

### How JWT authentication integrates with access control

- **Login:** `POST /auth/login` returns a JWT and user (with permissions). Frontend stores the token (e.g. localStorage) and sends it on every request.
- **Verification:** All non-public API routes use `JwtAuthGuard` to validate the token and attach the user to the request.
- **Permission checks:** After JWT validation, `PermissionGuard` and `@RequirePermission('moduleId.featureId')` run. The user’s `permissions` (from JWT payload / DB) are checked via `checkPermission()` in `libs/auth`. Only public routes (login, register, health, GET /permissions/structure) skip auth.
- **Scoping:** Services use the authenticated user’s `organizationId` (and role) to filter tasks, users, and audit log so users only see data from their organization.

---

## API Documentation

### Endpoint list

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/login | Public | Login (email, password) → accessToken + user |
| POST | /auth/register | Public | Register organization + owner user |
| GET | /auth/me | Bearer | Current user + permissions |
| GET | /health | Public | Health check |
| GET | /permissions/structure | Public | Permission modules/features (for role UI) |
| POST | /permissions/sync | Bearer (permissions.sync) | Sync permission config; system-role defaults |
| GET | /roles | Bearer (roles.view_roles) | List roles (query: page, limit) |
| GET | /roles/:id | Bearer (roles.view_roles) | Get role |
| POST | /roles | Bearer (roles.create_roles) | Create role |
| PUT | /roles/:id | Bearer (roles.update_roles) | Update role |
| DELETE | /roles/:id | Bearer (roles.delete_roles) | Delete role |
| GET | /users | Bearer (users.view_users) | List users in org (query: page, limit) |
| GET | /users/:id | Bearer (users.view_users) | Get user |
| POST | /users | Bearer (users.create_users) | Create user |
| PUT | /users/:id | Bearer (users.update_users) | Update user |
| DELETE | /users/:id | Bearer (users.delete_users) | Delete user |
| **GET** | **/tasks** | Bearer (tasks.view) | List tasks (query: sortBy, sortOrder, status, category) |
| **POST** | **/tasks** | Bearer (tasks.create) | Create task |
| **GET** | **/tasks/:id** | Bearer (tasks.view) | Get task |
| **PUT** | **/tasks/:id** | Bearer (tasks.update) | Update task |
| **DELETE** | **/tasks/:id** | Bearer (tasks.delete) | Delete task |
| GET | /audit-log | Bearer (audit.view) | Audit log (Owner/Admin; query: page, limit) |

**Swagger UI:** Local: **http://localhost:3333/api-docs**. Live app: log in as super-org user, open **Documentation**, click **Open Swagger UI** — the token is included automatically.

### Sample requests and responses

**Login (request and response)**

```bash
curl -X POST http://localhost:3333/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

Example response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "name": null,
    "organizationId": "...",
    "role": "owner",
    "permissions": { "tasks.view": true, "tasks.create": true, ... }
  }
}
```

**List tasks (with token)**

```bash
curl -X GET "http://localhost:3333/tasks?status=todo&sortBy=createdAt&sortOrder=DESC" \
  -H "Authorization: Bearer <accessToken>"
```

**Create task**

```bash
curl -X POST http://localhost:3333/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"title":"My task","description":"Details","status":"todo","category":"Work"}'
```

---

## Future Considerations

- **Advanced role delegation** – Delegate specific permissions to other users or roles.
- **Production-ready security**
  - **JWT refresh tokens** – Refresh tokens and rotation (currently access token only).
  - **CSRF protection** – For web clients.
  - **RBAC caching** – Cache permission checks per user/session to reduce DB load.
- **Efficient scaling of permission checks** – Batch or cache checks; optimize for large permission sets.

---

## Tradeoffs / Unfinished Areas

- **Database:** Spec allowed SQLite/PostgreSQL; only PostgreSQL is configured (TypeORM + `DATABASE_URL`).
- **Refresh tokens:** Not implemented; only access token is used.
- **E2E tests:** Playwright is present; critical flows are not fully covered by E2E.
- **Keyboard shortcuts:** Implemented on the Tasks page (?, N, E, Delete, Esc) with a shortcuts help dialog; not global app-wide.

---

## Testing

- **Backend (Jest):** `npx nx test api` — RBAC (permission helper), auth service, guards, and API endpoints.
- **Frontend (Jest):** `npx nx test dashboard` — Components, services, guards, and state management logic.

### Unit test coverage

Run tests with coverage:

```bash
# Backend (API) – coverage report at coverage/apps/api/index.html
npx nx test api --coverage --no-watch

# Frontend (Dashboard) – coverage report at coverage/apps/dashboard/index.html
npx nx test dashboard --coverage --no-watch
```

Use `--no-watch` for a single run; omit it for watch mode during development. Open the generated `index.html` in a browser to inspect statement, branch, function, and line coverage.


