# AccessHub — Role-Based Access Control (RBAC) & Project Governance Platform

AccessHub is a modern full-stack enterprise Role-Based Access Control (RBAC) and Project Access Management web application built from scratch. It provides fine-grained, backend-enforced authorization, session-based authentication, project-level access controls with expiration tracking, audit logging, and a modern SaaS dashboard inspired by top-tier enterprise platforms.

---

## 🏗️ System Architecture

AccessHub follows a clean, decoupled client-server architecture:

```
┌─────────────────────────────────┐
│     React + Vite Frontend       │
│     (http://localhost:5173)     │
└────────────────┬────────────────┘
                 │ HTTP / REST with Credentials (HTTP-Only Cookies)
                 ▼
┌─────────────────────────────────┐
│      Node.js + Express API      │
│     (http://localhost:5000)     │
└────────────────┬────────────────┘
                 │ Mongoose ODM
                 ▼
┌─────────────────────────────────┐       ┌───────────────────────────────┐
│         Local MongoDB           │ ◄───  │      MongoDB Compass GUI      │
│  mongodb://127.0.0.1:27017      │       │  Inspects 'accesshub' db      │
│      (Database: accesshub)      │       └───────────────────────────────┘
└─────────────────────────────────┘
```

> **Important Architecture Clarification**:
> - React **never** connects directly to MongoDB.
> - React communicates **only** with Express over standard HTTP REST endpoints with CORS and credentials.
> - Express connects to MongoDB via Mongoose.
> - **MongoDB Compass** is strictly a database administration GUI that connects directly to the local MongoDB server (`mongodb://127.0.0.1:27017`) to allow inspection and management of the collections.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js 19 with Vite
- **Routing**: React Router v7
- **HTTP Client**: Axios (Centralized instance with `withCredentials: true`)
- **State Management**: React Context API (`AuthContext`, `ThemeContext`, `ProjectContext`, `ToastContext`)
- **Icons**: Lucide React
- **Styling**: CSS Variable Design System (Supports Light and Dark Mode)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: Session-based with `express-session` & `connect-mongo` (HTTP-only cookies, no JWT)
- **Password Hashing**: `bcrypt` (Salt rounds: 10)
- **File Uploads**: `multer` (Profile pictures in `server/uploads/profiles/`, served statically via `express.static`)
- **Security**: `helmet` (with Cross-Origin Resource Policy), `cors`, `express-rate-limit`

### Database
- **Database**: Local MongoDB (`mongodb://127.0.0.1:27017/accesshub`)
- **ODM**: Mongoose
- **GUI**: MongoDB Compass

---

## 📂 Project Structure

```
AccessHub/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/           # Button, Modal, Dropdown, Table, Pagination, Avatar, etc.
│   │   ├── context/              # AuthContext, ThemeContext, ProjectContext, ToastContext
│   │   ├── layouts/              # Sidebar, Navbar, MainLayout
│   │   ├── pages/                # Dashboard, Members, Projects, Users, Roles, AuditLogs, Profile, etc.
│   │   ├── routes/               # AppRoutes (Protected routes with role/permission guards)
│   │   ├── services/             # Axios API services (auth, users, roles, projects, etc.)
│   │   ├── styles/               # theme.css (CSS variables for Light/Dark) & index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── config/
│   │   └── db.js                 # Mongoose connection
│   ├── controllers/              # Auth, User, Role, Permission, Project, Member, Audit, Dashboard
│   ├── middleware/               # requireAuth, requireRole, requirePermission, upload, errorHandler
│   ├── models/                   # User, Role, Permission, Project, ProjectMember, AuditLog
│   ├── routes/                   # authRoutes, userRoutes, roleRoutes, projectRoutes, etc.
│   ├── services/                 # auditService
│   ├── seed/
│   │   └── seed.js               # Database seeder (Roles, Permissions, Users, Projects, Members)
│   ├── uploads/
│   │   └── profiles/             # Uploaded user avatars
│   ├── .env
│   ├── .env.example
│   ├── server.js
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
1. **Node.js** (v18+ recommended)
2. **Local MongoDB** running on default port `27017`
3. **MongoDB Compass** (optional, for inspecting data)

---

### Step 1: Database Setup & Verification
Ensure your local MongoDB service is running:
- **Windows**: Verify `MongoDB` service in Windows Services (`services.msc`) is Running.
- **URI**: `mongodb://127.0.0.1:27017/accesshub`

To connect with **MongoDB Compass**:
1. Open MongoDB Compass.
2. In the "New Connection" field, enter:
   ```
   mongodb://127.0.0.1:27017
   ```
3. Click **Connect**.
4. Once connected, you will see the `accesshub` database containing the 7 collections:
   - `users`
   - `roles`
   - `permissions`
   - `projects`
   - `projectmembers`
   - `auditlogs`
   - `sessions`

---

### Step 2: Backend Configuration & Seeding

1. Open terminal in `server/` directory:
   ```bash
   cd server
   ```

2. Review or create `.env` file:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/accesshub
   SESSION_SECRET=accesshub_secure_session_secret_key_2026_!@#
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

3. Seed the database:
   ```bash
   npm run seed
   ```
   This command creates:
   - 23 atomic system permissions across 8 functional modules
   - 5 default RBAC roles (`Super Admin`, `Admin`, `Manager`, `Developer`, `Viewer`)
   - 10 active demo users
   - 3 projects
   - 21 project memberships with active, expiring, and expired dates
   - Initial audit logs

4. Start the backend server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   The backend will start at: `http://localhost:5000`

---

### Step 3: Frontend Configuration & Startup

1. Open a new terminal in `client/` directory:
   ```bash
   cd client
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will start at: `http://localhost:5173`

---

## 🔑 Default Credentials

You can sign in with any of the seeded roles below:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@example.com` | `Admin@123` | Full unrestricted access across all users, roles, permissions, projects, and logs |
| **Admin** | `sarah.admin@accesshub.io` | `Password@123` | Manage users, projects, and members; cannot delete Super Admin or modify system permissions |
| **Manager** | `marcus.manager@accesshub.io` | `Password@123` | Manage assigned projects and team members; cannot manage global roles/permissions |
| **Developer** | `elena.dev@accesshub.io` | `Password@123` | View assigned projects and project members, update own profile; blocked from user/role administration |
| **Viewer** | `maya.viewer@accesshub.io` | `Password@123` | Read-only access to dashboard and assigned projects; cannot mutate data |

> 💡 **Tip**: The login page provides **Quick Test Role Buttons** for one-click testing of any role!

---

## 🛡️ RBAC Permissions Schema

Permissions are organized into 8 functional modules:

| Module | Permissions | Description |
| :--- | :--- | :--- |
| **Dashboard** | `dashboard.view` | View organization telemetry and metric cards |
| **Users** | `users.view`, `users.create`, `users.edit`, `users.delete`, `users.status` | Full user lifecycle management & activation |
| **Roles** | `roles.view`, `roles.create`, `roles.edit`, `roles.delete` | RBAC role definitions and permission assignment |
| **Permissions** | `permissions.view`, `permissions.manage` | Atomic permission definitions (Super Admin restricted) |
| **Projects** | `projects.view`, `projects.create`, `projects.edit`, `projects.delete` | Project workspaces management |
| **Members** | `members.view`, `members.add`, `members.edit`, `members.remove` | Project membership, roles, and access expiration |
| **Profile** | `profile.view`, `profile.edit` | Self profile management and password change |
| **Audit** | `audit.view` | System audit ledger view |

---

## 🌐 API Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Self-register new user account
- `POST /api/auth/login` — Sign in and establish session cookie
- `POST /api/auth/logout` — Terminate session and clear cookie
- `GET /api/auth/me` — Retrieve active user session and granted permissions
- `PUT /api/auth/profile` — Update name and bio
- `POST /api/auth/change-password` — Change password with bcrypt verification
- `POST /api/auth/avatar` — Upload avatar image with Multer

### Users (`/api/users`)
- `GET /api/users?search=&role=&status=&page=&limit=` — Filtered user directory
- `POST /api/users` — Create user
- `GET /api/users/:id` — Get user details and assigned projects
- `PUT /api/users/:id` — Edit user details and roles
- `DELETE /api/users/:id` — Delete user account
- `PATCH /api/users/:id/status` — Toggle user activation status
- `PATCH /api/users/:id/roles` — Modify assigned roles

### Roles & Permissions (`/api/roles` & `/api/permissions`)
- `GET /api/roles` — List roles with user count and populated permissions
- `POST /api/roles` — Create custom role
- `PUT /api/roles/:id` — Edit role and permission set
- `DELETE /api/roles/:id` — Delete custom role
- `GET /api/permissions` — List permissions grouped by module

### Projects & Members (`/api/projects` & `/api/members`)
- `GET /api/projects` — Filtered project workspaces
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Get project details with members
- `PUT /api/projects/:id` — Update project status and description
- `DELETE /api/projects/:id` — Delete project and cascade memberships
- `GET /api/members` — Global members table with relative expiration badges
- `POST /api/projects/:id/members` — Add member with expiration date
- `PUT /api/projects/:id/members/:memberId` — Update project role or expiration
- `DELETE /api/projects/:id/members/:memberId` — Revoke project membership

### Audit Logs & Dashboard (`/api/audit-logs` & `/api/dashboard`)
- `GET /api/audit-logs?search=&action=&page=&limit=` — Audit trail records
- `GET /api/dashboard/stats` — Live aggregated metrics and distribution charts

---

## 🔒 Security Best Practices Implemented

1. **Backend-Enforced Authorization**: Frontend conditional rendering is solely for UX. Every API endpoint enforces `requireAuth`, `requireRole`, or `requirePermission`.
2. **Privilege Escalation Prevention**: Normal Admins cannot grant Super Admin status, delete Super Admins, or modify system permissions.
3. **Session Cookies**: Session identifiers are stored in HTTP-Only cookies with `sameSite: 'lax'` to prevent Cross-Site Scripting (XSS) extraction.
4. **Rate Limiting**: Brute-force protection on authentication endpoints and general API rate limiting.
5. **Helmet**: Secures HTTP response headers with configured Cross-Origin Resource Policy.
6. **Input Sanitization & Password Security**: Passwords are never returned in JSON responses and are hashed using bcrypt with salt rounds.
