---
command: /scaffold
description: Generate project scaffolding, boilerplate code, and project structure
category: Development
priority: P1
---

# /scaffold Command

Quickly generate project scaffolding with best practices and boilerplate code.

## About Commands and Skills

**Note**: As of Claude Code v2.1+, commands and skills share a unified mental model. Both are invoked with `/name` syntax and support the same frontmatter options (hooks, context forking, agent specification). The distinction is primarily organizational - commands tend to be action-oriented while skills provide knowledge and workflows.

This command can also be structured as a skill with the same functionality. The choice between command vs skill is mainly about how you prefer to organize your Claude Code tooling.

## Usage

```
/scaffold <project-type> [options]
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

## Examples

### Basic Usage
```bash
/scaffold react-app my-app
```

### With Options
```bash
/scaffold nextjs-app my-app --typescript --tailwind --eslint --auth
```

### Interactive Mode
```bash
/scaffold
# Prompts for project type, name, and features
```

## What Gets Generated

### Project Structure
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

### Configuration Files
- **TypeScript**: `tsconfig.json` with strict mode
- **ESLint**: Recommended rules + custom rules
- **Prettier**: Code formatting configuration
- **Git**: `.gitignore` with common patterns
- **CI/CD**: GitHub Actions workflow
- **Docker**: `Dockerfile` and `docker-compose.yml`
- **Testing**: Jest/Vitest configuration

### Boilerplate Code
- Authentication setup (if `--auth` flag)
- Database configuration (if applicable)
- API routes structure
- Component examples
- Utility functions
- Error handling
- Logging setup

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

## Advanced Usage

### Custom Templates
```bash
/scaffold --template ./my-templates/custom-template
```

### Generate Specific Patterns
```bash
/scaffold crud users
# Generates CRUD operations for 'users' resource

/scaffold auth jwt
# Generates JWT authentication setup

/scaffold api-route /api/users
# Generates API route with validation
```

## Generated Features

### Authentication Setup
When using `--auth`:
- User model/schema
- Registration endpoint
- Login endpoint
- Password hashing
- JWT token generation
- Auth middleware
- Protected route examples

### Database Setup
When using `--database`:
- Database connection configuration
- ORM/ODM setup (Prisma, TypeORM, Mongoose)
- Migration system
- Seed data examples
- Model examples

### Testing Setup
When using `--testing`:
- Test framework configuration
- Example unit tests
- Example integration tests
- Test utilities
- Mock data generators
- CI test workflow

### Docker Setup
When using `--docker`:
- Multi-stage Dockerfile
- docker-compose.yml for development
- Environment variable configuration
- Health checks
- Volume mounts

## Best Practices Built-In

✅ **Type Safety**: TypeScript with strict mode
✅ **Code Quality**: ESLint and Prettier configured
✅ **Security**: Environment variables, input validation
✅ **Testing**: Test setup with examples
✅ **Documentation**: README with setup instructions
✅ **Git**: Proper .gitignore and commit hooks
✅ **CI/CD**: GitHub Actions workflow
✅ **Error Handling**: Centralized error handling
✅ **Logging**: Structured logging setup
✅ **Performance**: Optimization patterns included

## Customization

### Configuration File
Create `.scaffoldrc.json` in your home directory:

```json
{
  "defaultPackageManager": "pnpm",
  "alwaysInclude": ["typescript", "eslint", "prettier"],
  "templates": {
    "myTemplate": "/path/to/template"
  },
  "database": {
    "preferred": "postgresql"
  }
}
```

### Template Variables
Templates support variables:
- `{{projectName}}` - Project name
- `{{author}}` - Author name (from git config)
- `{{description}}` - Project description
- `{{license}}` - License type

## Output

After scaffolding, you'll see:

```
✅ Created project structure
✅ Generated configuration files
✅ Added boilerplate code
✅ Initialized git repository
✅ Installed dependencies (if --install)

Next steps:
  cd my-app
  npm run dev

📚 Documentation: ./README.md
🧪 Run tests: npm test
🚀 Build: npm run build
```

## Examples by Use Case

### Quick Prototype
```bash
/scaffold react-app prototype --install --git
cd prototype && npm run dev
```

### Production Application
```bash
/scaffold nextjs-app my-saas \
  --typescript \
  --auth \
  --database postgres \
  --testing \
  --docker \
  --ci \
  --install
```

### API Service
```bash
/scaffold nestjs-api user-service \
  --database postgres \
  --testing \
  --docker \
  --ci
```

### Monorepo
```bash
/scaffold monorepo my-workspace --turborepo
cd my-workspace
/scaffold react-app apps/web
/scaffold express-api apps/api
```

## Troubleshooting

### Common Issues

**Port already in use**:
```bash
# Change port in .env file
PORT=3001
```

**Dependencies fail to install**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors**:
```bash
# Regenerate types
npm run typecheck
```

## Related Commands

- `/refactor` - Refactor existing code
- `/test-generate` - Generate tests for code
- `/doc-generate` - Generate documentation

---

**Version**: 1.0.0
**Status**: Production Ready ✅
