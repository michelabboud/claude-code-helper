# Task Manager Pro

A professional task and project management application built with Next.js 14.

> **Note**: This is a demo application for testing Claude Code Agent Triggers.

## Features

- **Project Management**: Create and manage projects with teams
- **Kanban Board**: Drag-and-drop task management
- **Real-time Updates**: WebSocket-powered live collaboration
- **Team Collaboration**: Role-based access control
- **Authentication**: JWT-based secure authentication

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Cache**: Redis
- **Real-time**: Socket.io
- **Testing**: Vitest, Playwright
- **Deployment**: Docker, Kubernetes

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (optional, for caching)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/task-manager-pro.git
cd task-manager-pro

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Start development server
npm run dev
```

### Docker

```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run db:studio    # Open Prisma Studio
```

### Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Dashboard pages
│   └── api/             # API routes
├── components/          # React components
│   ├── ui/              # Base UI components
│   ├── layout/          # Layout components
│   ├── tasks/           # Task-related components
│   └── projects/        # Project-related components
├── lib/                 # Utilities and libraries
│   ├── auth/            # Authentication utilities
│   ├── cache/           # Caching utilities
│   ├── security/        # Security utilities
│   └── websocket/       # WebSocket utilities
├── hooks/               # Custom React hooks
└── __tests__/           # Test files
```

## API Documentation

See [docs/api/openapi.yaml](docs/api/openapi.yaml) for full API specification.

### Authentication

```bash
# Register
POST /api/auth/register
{ "email": "user@example.com", "password": "secure123", "name": "User" }

# Login
POST /api/auth/login
{ "email": "user@example.com", "password": "secure123" }
```

### Tasks

```bash
# Create task
POST /api/projects/:projectId/tasks
Authorization: Bearer <token>
{ "title": "New Task", "priority": "HIGH" }

# Update task status
PATCH /api/tasks/:id
Authorization: Bearer <token>
{ "status": "IN_PROGRESS" }
```

## Testing

### Unit Tests

```bash
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### E2E Tests

```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Interactive mode
```

## Deployment

### Docker

```bash
# Build image
docker build -t task-manager-pro .

# Run container
docker run -p 3000:3000 task-manager-pro
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | - |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for JWT signing | - |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | `http://localhost:3001` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT
