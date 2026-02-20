---
skill_name: Project Scaffolding
description: Generate project scaffolding, boilerplate code, and project structure for React, Next.js, Express, NestJS, FastAPI, Django, and more
category: Development
priority: P1
argument-hint: '<project-type> [name] [options]'
allowed-tools: Read, Write, Edit, Bash, Glob
---

# Project Scaffolding Skill

Quickly generate project scaffolding with best practices and boilerplate code.

## Usage

```
/project-scaffolding react-app my-app
/project-scaffolding nextjs-app my-app --typescript --tailwind --auth
/project-scaffolding                    # Interactive mode
```

## Supported Project Types

### Frontend
- `react-app` - React application with TypeScript
- `nextjs-app` - Next.js application with App Router
- `vue-app` - Vue 3 application with Composition API
- `vite-app` - Vite application with your choice of framework

### Backend
- `express-api` - Express.js REST API with TypeScript
- `nestjs-api` - NestJS application with TypeORM
- `fastapi-app` - FastAPI Python application
- `django-app` - Django application with REST framework

### Full-Stack
- `mern-stack` - MongoDB + Express + React + Node.js
- `t3-stack` - Next.js + tRPC + Prisma + Tailwind
- `python-fullstack` - FastAPI + React

### Mobile
- `react-native` - React Native mobile app
- `expo-app` - Expo managed workflow

### Other
- `node-package` - npm package with TypeScript
- `python-package` - Python package with Poetry
- `monorepo` - Turborepo or Nx monorepo

## Generated Structure

```
my-app/
├── src/
│   ├── components/
│   ├── pages/ or app/
│   ├── lib/
│   ├── types/
│   └── utils/
├── public/
├── tests/
├── .github/
│   └── workflows/
├── .env.example
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── package.json
├── tsconfig.json
└── README.md
```

## Options

### Common Options
- `--typescript` - Use TypeScript (default for most)
- `--javascript` - Use JavaScript instead
- `--eslint` - Include ESLint configuration
- `--prettier` - Include Prettier configuration
- `--git` - Initialize git repository
- `--install` - Run npm/yarn/pnpm install

### Feature Flags
- `--auth` - Include authentication setup
- `--database <type>` - Include database setup (postgres, mysql, mongodb)
- `--testing` - Include testing setup
- `--docker` - Include Docker configuration
- `--ci` - Include CI/CD workflow
- `--tailwind` - Include Tailwind CSS
- `--shadcn` - Include shadcn/ui components

### Package Manager
- `--npm` - Use npm (default)
- `--yarn` - Use Yarn
- `--pnpm` - Use pnpm

## Feature Details

### Authentication Setup (`--auth`)
- User model/schema
- Registration + Login endpoints
- Password hashing
- JWT token generation
- Auth middleware
- Protected route examples

### Database Setup (`--database`)
- Database connection configuration
- ORM/ODM setup (Prisma, TypeORM, Mongoose)
- Migration system
- Seed data examples
- Model examples

### Testing Setup (`--testing`)
- Test framework configuration (Jest/Vitest)
- Example unit tests
- Example integration tests
- Test utilities and mock data generators
- CI test workflow

### Docker Setup (`--docker`)
- Multi-stage Dockerfile
- docker-compose.yml for development
- Environment variable configuration
- Health checks and volume mounts

## Examples

### Quick Prototype
```bash
/project-scaffolding react-app prototype --install --git
```

### Production Application
```bash
/project-scaffolding nextjs-app my-saas \
  --typescript --auth --database postgres \
  --testing --docker --ci --install
```

### API Service
```bash
/project-scaffolding nestjs-api user-service \
  --database postgres --testing --docker --ci
```

### Monorepo
```bash
/project-scaffolding monorepo my-workspace --turborepo
```

### Generate Specific Patterns
```bash
/project-scaffolding crud users        # CRUD operations for 'users'
/project-scaffolding auth jwt          # JWT authentication setup
/project-scaffolding api-route /api/users  # API route with validation
```

## Configuration Files Generated

- **TypeScript**: `tsconfig.json` with strict mode
- **ESLint**: Recommended rules + custom rules
- **Prettier**: Code formatting configuration
- **Git**: `.gitignore` with common patterns
- **CI/CD**: GitHub Actions workflow
- **Docker**: `Dockerfile` and `docker-compose.yml`
- **Testing**: Jest/Vitest configuration

## Built-In Best Practices

- Type Safety: TypeScript with strict mode
- Code Quality: ESLint and Prettier configured
- Security: Environment variables, input validation
- Testing: Test setup with examples
- Documentation: README with setup instructions
- Git: Proper .gitignore and commit hooks
- CI/CD: GitHub Actions workflow
- Error Handling: Centralized error handling
- Logging: Structured logging setup

## Customization

Create `.scaffoldrc.json` in your home directory:

```json
{
  "defaultPackageManager": "pnpm",
  "alwaysInclude": ["typescript", "eslint", "prettier"],
  "database": { "preferred": "postgresql" }
}
```

## Template Variables

Templates support variables:
- `{{projectName}}` - Project name
- `{{author}}` - Author name (from git config)
- `{{description}}` - Project description
- `{{license}}` - License type

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** MIT
