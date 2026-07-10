---
name: project-scaffolding
skill_name: Project Scaffolding
description: Generate project scaffolding, boilerplate code, and project structure for React, Next.js, Express, NestJS, FastAPI, Django, and more. Use when starting a new project, generating boilerplate, or setting up project structure. Triggers on 'scaffold', 'create project', 'new app', 'bootstrap', 'boilerplate', 'starter template', 'project structure', 'monorepo'.
category: Development
priority: P1
argument-hint: '<project-type> [name] [options] | hello | hello ID'
allowed-tools: Read, Write, Edit, Bash, Glob
context: fork
version: 1.0.0
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
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

### Monorepo Flags (with `project-type: monorepo`)
- `--turborepo` - Scaffold the workspace with a Turborepo pipeline (`turbo.json`)
- `--nx` - Scaffold the workspace with an Nx toolchain instead of Turborepo
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

Besides whole-project types, these **pattern generators** scaffold a single feature
into the current project (not a new project): `crud <resource>`, `auth <strategy>`,
and `api-route <path>`.

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

Before scaffolding, **read `~/.scaffoldrc.json` if it exists** and apply its
preferences as defaults (a flag passed on the command line always overrides the
config file):

```json
{
  "defaultPackageManager": "pnpm",
  "alwaysInclude": ["typescript", "eslint", "prettier"],
  "database": { "preferred": "postgresql" }
}
```

If the file is absent, use the built-in defaults and proceed.

## Template Variables

When generating files, **substitute these placeholders** with real values —
`{{projectName}}` from the `[name]` argument, `{{author}}` from `git config
user.name`, `{{description}}` from the user (ask if unspecified), and `{{license}}`
from the chosen/default license. Never leave a `{{…}}` placeholder in a generated
file.

- `{{projectName}}` - Project name
- `{{author}}` - Author name (from git config)
- `{{description}}` - Project description
- `{{license}}` - License type

## Handshake Protocol

### `hello`
Respond with:
> 👋 Hello! I'm **Project Scaffolding** v1.0.0. Generate project scaffolding and boilerplate for React, Next.js, Express, NestJS, FastAPI, Django, and more. Use `/project-scaffolding hello ID` for the full guide.

### `hello ID`
Respond with complete skill information:
- **Name**: Project Scaffolding v1.0.0
- **Description**: Generate project scaffolding, boilerplate code, and project structure for React, Next.js, Express, NestJS, FastAPI, Django, and more
- **How to invoke**: `/project-scaffolding <project-type> [name] [options]`
- **Available arguments**: `<project-type> [name] [options] | hello | hello ID`
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

## Changelog

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
