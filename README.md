# GearGuard - Maintenance Management System

A production-grade, Odoo-like Maintenance Management System built with Next.js 14, TypeScript, NextAuth.js, Prisma ORM, and MySQL.

![GearGuard Dashboard](docs/dashboard.png)

## Features

### 🔐 Authentication & Authorization
- **NextAuth.js** with Credentials Provider (email + password)
- **Role-Based Access Control (RBAC)** with 4 roles:
  - **Admin**: Full system access, user management
  - **Manager**: Team management, all equipment and requests
  - **Technician**: View assigned requests, update status
  - **Requester**: Create requests, view own requests

### 🏭 Equipment Management
- Complete equipment registry with categories
- Serial number, department, location tracking
- Warranty expiration alerts
- Default maintenance team assignment
- Equipment status (Active/Scrapped)

### 📋 Maintenance Requests
- **Corrective** maintenance for breakdowns
- **Preventive** maintenance for scheduled tasks
- Priority levels: Low, Medium, High, Critical
- **Strict State Machine**:
  - New → In Progress → Repaired (requires duration) or Scrap
  - Scrap marks equipment as SCRAPPED

### 👥 Team Management
- Create maintenance teams with color coding
- Add/remove team members
- Team lead designation
- Team-based technician assignment

### 📊 Views
- **Dashboard**: Stats, recent requests, upcoming maintenance, team workload
- **Kanban Board**: Drag-and-drop status management
- **Calendar**: Preventive maintenance scheduling
- **Equipment List**: Searchable, filterable equipment registry
- **Request List**: Full request management with filters

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js
- **Database**: MySQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Drag & Drop**: @dnd-kit
- **Validation**: Zod
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/gearguard.git
   cd gearguard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your database credentials:
   ```env
   DATABASE_URL="mysql://root:password@localhost:3306/gearguard"
   NEXTAUTH_SECRET="your-super-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Create database and run migrations
   npx prisma db push
   
   # Seed with demo data
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Credentials

After seeding, you can login with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gearguard.com | admin123 |
| Manager | manager@gearguard.com | manager123 |
| Technician | tech1@gearguard.com | tech123 |
| Requester | requester@gearguard.com | requester123 |

## Project Structure

```
src/
├── app/
│   ├── (authenticated)/     # Protected routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── kanban/          # Kanban board
│   │   ├── calendar/        # Calendar view
│   │   ├── equipment/       # Equipment management
│   │   ├── requests/        # Request management
│   │   ├── teams/           # Team management
│   │   └── users/           # User management (admin)
│   ├── api/                 # API routes
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── equipment/       # Equipment CRUD
│   │   ├── requests/        # Request CRUD + transitions
│   │   ├── teams/           # Team CRUD + members
│   │   ├── users/           # User CRUD
│   │   └── dashboard/       # Dashboard stats
│   └── login/               # Login page
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── layout/              # Layout components
│   ├── kanban/              # Kanban-specific components
│   └── providers/           # Context providers
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── auth-utils.ts        # Auth helpers
│   ├── prisma.ts            # Prisma client
│   ├── rbac.ts              # Role-based access control
│   ├── state-machine.ts     # Request status transitions
│   ├── validations.ts       # Zod schemas
│   └── utils.ts             # Utility functions
└── middleware.ts            # Route protection
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get current session

### Equipment
- `GET /api/equipment` - List equipment (with pagination, filters)
- `POST /api/equipment` - Create equipment
- `GET /api/equipment/:id` - Get equipment details
- `PUT /api/equipment/:id` - Update equipment
- `DELETE /api/equipment/:id` - Delete equipment

### Maintenance Requests
- `GET /api/requests` - List requests (with pagination, filters)
- `POST /api/requests` - Create request
- `GET /api/requests/:id` - Get request details
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Delete request
- `POST /api/requests/:id/transition` - Change request status
- `POST /api/requests/:id/assign` - Assign technician

### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add team member
- `DELETE /api/teams/:id/members/:userId` - Remove team member

### Users (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## State Machine

The maintenance request follows a strict state machine:

```
┌─────────┐
│   NEW   │
└────┬────┘
     │
     ▼
┌────────────┐
│ IN_PROGRESS│
└─────┬──────┘
      │
      ├────────────────┐
      │                │
      ▼                ▼
┌──────────┐     ┌─────────┐
│ REPAIRED │     │  SCRAP  │
└──────────┘     └─────────┘
(requires         (marks equipment
 duration)         as SCRAPPED)
```

## Role Permissions

| Permission | Admin | Manager | Technician | Requester |
|------------|-------|---------|------------|-----------|
| users:create | ✓ | | | |
| users:read | ✓ | | | |
| users:update | ✓ | | | |
| users:delete | ✓ | | | |
| teams:create | ✓ | ✓ | | |
| teams:read | ✓ | ✓ | ✓ | |
| teams:update | ✓ | ✓ | | |
| teams:delete | ✓ | ✓ | | |
| equipment:create | ✓ | ✓ | | |
| equipment:read | ✓ | ✓ | ✓ | ✓ |
| equipment:update | ✓ | ✓ | | |
| equipment:delete | ✓ | ✓ | | |
| requests:create | ✓ | ✓ | ✓ | ✓ |
| requests:read | ✓ | ✓ | ✓ | ✓ |
| requests:update | ✓ | ✓ | ✓ | |
| requests:delete | ✓ | ✓ | | |
| requests:assign | ✓ | ✓ | | |
| dashboard:view | ✓ | ✓ | ✓ | ✓ |

## Development

### Database Commands

```bash
# Push schema changes to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio

# Reset database and reseed
npx prisma db push --force-reset && npx prisma db seed
```

### Build for Production

```bash
npm run build
npm start
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ using Next.js and TypeScript
