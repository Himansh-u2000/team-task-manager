# Team Task Manager

A full-stack collaborative task management web application built with React, Node.js, Express, and MongoDB. Think of it as a simplified Trello/Asana.

## Features

- **User Authentication** — JWT-based signup/login with role-based access (Admin/Member)
- **Project Management** — Create projects, add/remove team members
- **Task Management** — Create, assign, and track tasks with status (To Do, In Progress, Done) and priority
- **Kanban Board** — Visual task board grouped by status per project
- **Dashboard** — Stats cards, pie/bar charts, recent tasks, priority breakdown
- **Role-Based Access** — Admins manage everything; Members view and update assigned tasks only
- **Responsive Design** — Mobile-friendly UI with Tailwind CSS

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 6 + Tailwind CSS 4 |
| State Management | Redux Toolkit |
| Routing | React Router v7 |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js + Express 5 (ES Modules) |
| Database | MongoDB + Mongoose 8 |
| Auth | JWT + bcryptjs |
| Validation | express-validator |

## Prerequisites

- Node.js >= 20 (recommended: 24)
- MongoDB (local or MongoDB Atlas)
- npm

## Setup & Running Locally

### 1. Clone the repo

```bash
git clone https://github.com/Himansh-u2000/team-task-manager.git
cd team-task-manager
```

### 2. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

> For MongoDB Atlas, replace the `MONGODB_URI` with your Atlas connection string.

### 4. Run the app

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

The app will be available at:
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)

## Project Structure

```
team-task-manager/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Layout/        # Navbar, Sidebar, Layout
│   │   │   ├── TaskCard.jsx
│   │   │   ├── ProjectCard.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── store/             # Redux Toolkit (global auth & tasks state)
│   │   ├── pages/              # All page components
│   │   ├── services/           # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                     # Express backend
│   ├── config/db.js            # MongoDB connection
│   ├── controllers/            # Business logic
│   ├── middleware/             # Auth & role middleware
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express routes
│   ├── server.js               # Entry point
│   └── package.json
├── .env                        # Environment variables
└── README.md
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users` | Get all users |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | Get user's projects |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/project/:projectId` | Get project tasks |
| GET | `/api/tasks/my-tasks` | Get assigned tasks |
| PUT | `/api/tasks/:id` | Update task |
| PUT | `/api/tasks/:id/status` | Update task status |
| DELETE | `/api/tasks/:id` | Delete task |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Global dashboard stats |
| GET | `/api/dashboard/stats/:projectId` | Project-specific stats |

## Deployment on Railway

### Option 1: Single Service
1. Push your code to GitHub
2. Create a new Railway project
3. Connect your GitHub repo
4. Set the root directory to `/` and add a build script:
   - Build Command: `cd client && npm install && npm run build`
   - Start Command: `cd server && npm install && npm start`
5. Add environment variables: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`
6. Railway will auto-detect Node.js and deploy

### Option 2: Two Services (Frontend + Backend)
1. Create two Railway services
2. **Backend Service**: Root directory = `/server`, Start = `npm start`
3. **Frontend Service**: Root directory = `/client`, Build = `npm run build`, use Vite static serving
4. Set `VITE_API_URL` on the frontend service to point to the backend URL

## License

MIT
