# Complete Integration Example

This example shows how multiple sub-agents work together to build a complete feature from start to finish.

## Scenario: Building a User Authentication System

We'll build a complete authentication system with:
- Backend API (Node.js/Express)
- Database (PostgreSQL)
- Frontend UI (React + Tailwind)
- Tests
- Documentation

---

## Phase 1: Planning & Research (Parallel)

### User Request
```
> Build a complete user authentication system with JWT, email verification, 
  and password reset functionality
```

### Agent Orchestration

```javascript
[main-claude] I'll coordinate multiple agents to build this feature.

// Launch parallel research
const [
  bestPractices,
  securityGuidelines,
  existingPatterns
] = await Promise.all([
  Task("Research JWT authentication best practices", {
    agent: "researcher"
  }),
  Task("Review authentication security requirements", {
    agent: "security-auditor"
  }),
  Task("Find existing authentication patterns in codebase", {
    agent: "Explore"
  })
]);

// Create architecture plan
const plan = await Task(`
Design authentication system architecture.

Research findings:
- ${bestPractices}
- ${securityGuidelines}
- ${existingPatterns}

Requirements:
- JWT token-based auth
- Email verification
- Password reset
- Secure password storage
`, {
  agent: "planner",
  model: "opus"
});
```

### Output

```
✓ [researcher] Best practices gathered
  - Use bcrypt for password hashing
  - JWT refresh tokens recommended
  - Rate limiting on auth endpoints

✓ [security-auditor] Security checklist created
  - OWASP compliance required
  - HTTPS only in production
  - Secure cookie settings

✓ [Explore] Found patterns
  - Existing User model structure
  - Current database connection setup
  - API route organization

✓ [planner] Architecture designed
  - Backend: Express + JWT
  - Database: PostgreSQL + migrations
  - Frontend: React hooks + context
  - Email: SendGrid integration
```

---

## Phase 2: Database Implementation

### Database Schema

```javascript
const schema = await Task(`
Create database schema for authentication system.

Architecture context:
${plan.database}

Requirements:
- Users table
- Email verification tokens
- Password reset tokens
- Proper indexes
- Timestamps
`, {
  agent: "database-expert"
});
```

### Output: Migration File

```sql
-- [database-expert] Created: migrations/001_create_auth_tables.sql

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_verification_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

---

## Phase 3: Backend Implementation (Parallel)

### API Endpoints

```javascript
const [
  authRoutes,
  authMiddleware,
  emailService
] = await Promise.all([
  Task(`
Create authentication API endpoints.

Context:
${plan.backend.routes}

Endpoints needed:
- POST /auth/register
- POST /auth/login
- POST /auth/refresh-token
- POST /auth/logout
- POST /auth/verify-email
- POST /auth/forgot-password
- POST /auth/reset-password
`, {
    agent: "api-expert"
  }),
  
  Task(`
Create authentication middleware.

Context:
${plan.backend.middleware}

Middleware needed:
- JWT verification
- Role checking
- Rate limiting
`, {
    agent: "api-expert"
  }),
  
  Task(`
Create email service for verification and password reset.

Context:
${plan.backend.email}
`, {
    agent: "implementer"
  })
]);
```

### Output: API Routes

```javascript
// [api-expert] Created: routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const emailService = require('../services/email');
const { rateLimiter } = require('../middleware/rateLimiter');

// Register new user
router.post('/register',
  rateLimiter(5, 15 * 60 * 1000), // 5 attempts per 15 min
  [
    body('email').isEmail().normalizeEmail(),
    body('username').isLength({ min: 3, max: 30 }).trim(),
    body('password').isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }

      const { email, username, password } = req.body;

      // Check if user exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          error: 'Email already registered' 
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        email,
        username,
        passwordHash
      });

      // Send verification email
      const verificationToken = await user.createVerificationToken();
      await emailService.sendVerificationEmail(email, verificationToken);

      res.status(201).json({
        message: 'Registration successful. Please verify your email.',
        userId: user.id
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post('/login',
  rateLimiter(5, 15 * 60 * 1000),
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.emailVerified) {
        return res.status(403).json({ 
          error: 'Please verify your email first' 
        });
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// More endpoints...
module.exports = router;
```

---

## Phase 4: Frontend Implementation

### UI Components

```javascript
const loginUI = await Task(`
Create login and registration UI components with Tailwind CSS.

Context:
${plan.frontend}

Components needed:
- Login form
- Registration form
- Email verification page
- Password reset request form
- Password reset form

Design requirements:
- Mobile-responsive
- Accessible (WCAG AA)
- Loading states
- Error handling
- Success messages
`, {
  agent: "css-tailwind-expert"
});
```

### Output: Login Component

```jsx
// [css-tailwind-expert] Created: components/LoginForm.jsx

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LoginForm() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      // Redirect handled by AuthContext
    } catch (error) {
      setErrors({
        general: error.message || 'Login failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="
      min-h-screen flex items-center justify-center
      bg-gradient-to-br from-blue-50 to-indigo-100
      px-4
    ">
      <div className="
        w-full max-w-md
        bg-white rounded-2xl shadow-xl
        p-8
        animate-[fade-in_0.3s_ease-out]
      ">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to your account
          </p>
        </div>

        {errors.general && (
          <div className="
            mb-6 p-4 rounded-lg
            bg-red-50 border border-red-200
            text-red-600 text-sm
          ">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label 
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="
                w-full px-4 py-3 rounded-lg
                border border-gray-300
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition-all duration-200
                placeholder:text-gray-400
              "
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label 
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <a 
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="
                w-full px-4 py-3 rounded-lg
                border border-gray-300
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition-all duration-200
              "
              placeholder="••••••••"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3 px-4
              bg-blue-600 hover:bg-blue-700
              text-white font-semibold rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <a 
            href="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 5: Testing (Sequential)

### Test Suite

```javascript
// Only after implementation is complete
const tests = await Task(`
Write comprehensive test suite for authentication system.

Context:
- Backend API endpoints
- Frontend components
- Database operations

Test types needed:
- Unit tests for API routes
- Integration tests for auth flow
- Frontend component tests
- E2E tests for complete auth flow
`, {
  agent: "test-writer"
});
```

### Output: Test Examples

```javascript
// [test-writer] Created: tests/auth.test.js

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Authentication API', () => {
  beforeEach(async () => {
    await User.deleteAll(); // Clean database
  });

  describe('POST /auth/register', () => {
    it('should register new user successfully', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Test1234!'
        })
        .expect(201);

      expect(res.body).toHaveProperty('userId');
      expect(res.body.message).toContain('verify your email');
    });

    it('should reject duplicate email', async () => {
      // Create first user
      await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          username: 'user1',
          password: 'Test1234!'
        });

      // Try to register with same email
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          username: 'user2',
          password: 'Test1234!'
        })
        .expect(409);

      expect(res.body.error).toContain('already registered');
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'weak'
        })
        .expect(422);

      expect(res.body.errors).toBeInstanceOf(Array);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create verified user
      await request(app)
        .post('/auth/register')
        .send({
          email: 'verified@example.com',
          username: 'verified',
          password: 'Test1234!'
        });
      
      // Verify email
      const user = await User.findByEmail('verified@example.com');
      await user.verifyEmail();
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'verified@example.com',
          password: 'Test1234!'
        })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toHaveProperty('email', 'verified@example.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'verified@example.com',
          password: 'WrongPassword1!'
        })
        .expect(401);

      expect(res.body.error).toContain('Invalid credentials');
    });

    it('should reject unverified email', async () => {
      // Create unverified user
      await request(app)
        .post('/auth/register')
        .send({
          email: 'unverified@example.com',
          username: 'unverified',
          password: 'Test1234!'
        });

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'unverified@example.com',
          password: 'Test1234!'
        })
        .expect(403);

      expect(res.body.error).toContain('verify your email');
    });
  });
});
```

---

## Phase 6: Security Review

```javascript
const securityReview = await Task(`
Perform security audit on authentication implementation.

Review:
- Password storage
- Token security
- API rate limiting
- Input validation
- SQL injection protection
- XSS prevention
- CSRF protection
`, {
  agent: "security-auditor",
  model: "opus"
});
```

### Output: Security Report

```markdown
[security-auditor] Security Audit Report

✅ PASSED
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens properly signed
- Rate limiting implemented on auth endpoints
- Input validation using express-validator
- Parameterized queries (SQL injection protected)
- HTTP-only cookies for refresh tokens
- CORS configured properly

⚠️ RECOMMENDATIONS
1. Add HTTPS enforcement in production
2. Implement account lockout after failed attempts
3. Add password complexity requirements display
4. Consider 2FA for sensitive operations
5. Add security headers (helmet.js)
6. Implement session management
7. Add audit logging for auth events

✅ Overall Status: Production Ready with Recommendations
```

---

## Phase 7: Documentation

```javascript
const docs = await Task(`
Create comprehensive documentation for authentication system.

Include:
- API endpoints documentation
- Setup instructions
- Environment variables
- Usage examples
- Security considerations
- Troubleshooting guide
`, {
  agent: "docs-writer"
});
```

### Output: API Documentation

```markdown
[docs-writer] Created: docs/authentication.md

# Authentication System Documentation

## Overview

Complete JWT-based authentication system with email verification and password reset functionality.

## Features

- User registration with email verification
- Secure login with JWT tokens
- Token refresh mechanism
- Password reset via email
- Rate limiting on auth endpoints
- Secure password storage (bcrypt)

## API Endpoints

### Register New User

**POST** `/api/auth/register`

Request:
\`\`\`json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!"
}
\`\`\`

Response (201):
\`\`\`json
{
  "message": "Registration successful. Please verify your email.",
  "userId": "uuid"
}
\`\`\`

### Login

**POST** `/api/auth/login`

Request:
\`\`\`json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
\`\`\`

Response (200):
\`\`\`json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
\`\`\`

[... more endpoints documentation ...]

## Environment Variables

\`\`\`env
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
EMAIL_SERVICE_API_KEY=your-email-api-key
NODE_ENV=development
\`\`\`

## Security Considerations

1. **Passwords**: Hashed with bcrypt (10 rounds)
2. **Tokens**: JWT with 15-minute expiry
3. **Refresh Tokens**: HTTP-only cookies, 7-day expiry
4. **Rate Limiting**: 5 attempts per 15 minutes
5. **HTTPS**: Required in production

[... more documentation ...]
```

---

## Phase 8: Git Workflow

```javascript
const gitStrategy = await Task(`
Create commit strategy for authentication feature.

Files changed:
- migrations/001_create_auth_tables.sql
- routes/auth.js
- middleware/auth.js
- services/email.js
- components/LoginForm.jsx
- components/RegisterForm.jsx
- tests/auth.test.js
- docs/authentication.md

Suggest:
- Commit structure
- Branch naming
- PR description template
`, {
  agent: "git-expert"
});
```

### Output: Git Strategy

```markdown
[git-expert] Commit Strategy

Branch: feature/user-authentication

Commits:

1. feat(db): add authentication schema and migrations
   - Create users table
   - Add verification and reset token tables
   - Add indexes

2. feat(api): implement authentication endpoints
   - POST /auth/register
   - POST /auth/login
   - POST /auth/refresh-token
   - Add auth middleware

3. feat(email): add email verification service
   - SendGrid integration
   - Verification email template
   - Password reset email template

4. feat(ui): create auth components
   - Login form
   - Registration form
   - Email verification page
   - Password reset flow

5. test(auth): add comprehensive test suite
   - Unit tests for API routes
   - Integration tests
   - Component tests

6. docs(auth): add authentication documentation
   - API endpoint docs
   - Setup guide
   - Security considerations

PR Template:
\`\`\`
## Feature: User Authentication System

### Changes
- ✨ JWT-based authentication
- ✉️ Email verification
- 🔒 Password reset functionality
- 🎨 Responsive UI components
- ✅ Comprehensive tests
- 📚 Complete documentation

### Security
- bcrypt password hashing
- Rate limiting
- HTTP-only cookies
- Input validation

### Testing
- 85% test coverage
- All endpoints tested
- E2E flow verified

### Documentation
- API docs: /docs/authentication.md
- Setup guide included
- Environment variables documented
\`\`\`
```

---

## Final Summary

```
[main-claude] Authentication system complete!

✓ Phase 1: Planning & Research (3 agents, parallel)
✓ Phase 2: Database Schema (1 agent)
✓ Phase 3: Backend API (3 agents, parallel)
✓ Phase 4: Frontend UI (1 agent)
✓ Phase 5: Testing (1 agent)
✓ Phase 6: Security Review (1 agent)
✓ Phase 7: Documentation (1 agent)
✓ Phase 8: Git Strategy (1 agent)

Total agents used: 12
Total time: ~30 minutes (vs 4-6 hours manually)
Test coverage: 85%
Security: ✅ Audited and approved

Files created:
- migrations/001_create_auth_tables.sql
- routes/auth.js
- middleware/auth.js
- services/email.js
- components/LoginForm.jsx
- components/RegisterForm.jsx
- components/EmailVerification.jsx
- tests/auth.test.js
- docs/authentication.md

Ready for: Code review and deployment
```

---

## Key Takeaways

1. **Parallel Execution**: Research, security review, and exploration ran simultaneously
2. **Sequential Validation**: Testing only after implementation complete
3. **Context Sharing**: Each agent built on previous agents' work
4. **Specialization**: Each agent focused on their expertise
5. **Quality**: Multiple review stages ensured production-ready code
6. **Efficiency**: 12 agents coordinated seamlessly

This demonstrates the power of well-orchestrated sub-agents! 🚀
