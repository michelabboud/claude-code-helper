---
skill_name: API Design Patterns
description: REST API design, GraphQL patterns, API versioning, and documentation best practices
category: Architecture
priority: P1
---

# API Design Patterns Skill

Comprehensive guide to designing, implementing, and maintaining robust APIs that scale.

## Table of Contents

1. [RESTful API Design](#restful-api-design)
2. [GraphQL Patterns](#graphql-patterns)
3. [API Versioning Strategies](#api-versioning-strategies)
4. [Error Handling](#error-handling)
5. [Authentication & Authorization](#authentication--authorization)
6. [Rate Limiting & Throttling](#rate-limiting--throttling)
7. [API Documentation](#api-documentation)
8. [Pagination Patterns](#pagination-patterns)
9. [Caching Strategies](#caching-strategies)
10. [API Security](#api-security)

## RESTful API Design

### Resource Naming Conventions

**Best Practices**:
- Use **nouns**, not verbs
- Use **plural** names for collections
- Use **lowercase** with hyphens
- Keep URLs simple and intuitive

```
✅ Good:
GET    /api/users
GET    /api/users/123
GET    /api/users/123/orders
POST   /api/blog-posts
GET    /api/shopping-cart/items

❌ Bad:
GET    /api/getUsers
GET    /api/User/123
GET    /api/user_orders
POST   /api/CreateBlogPost
```

### HTTP Methods

**Standard REST Operations**:

```typescript
// GET - Retrieve resource(s)
GET    /api/users           // List all users
GET    /api/users/123       // Get specific user
GET    /api/users/123/posts // Get user's posts

// POST - Create new resource
POST   /api/users
Body: { "email": "user@example.com", "name": "John" }

// PUT - Full update (replace entire resource)
PUT    /api/users/123
Body: { "email": "new@example.com", "name": "John Doe", "role": "admin" }

// PATCH - Partial update (modify specific fields)
PATCH  /api/users/123
Body: { "name": "John Doe" }

// DELETE - Remove resource
DELETE /api/users/123
```

### Response Status Codes

**Success Codes**:
- `200 OK`: Request succeeded (GET, PUT, PATCH)
- `201 Created`: Resource created (POST)
- `204 No Content`: Success but no data to return (DELETE)

**Client Error Codes**:
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Conflict with current state (duplicate)
- `422 Unprocessable Entity`: Validation failed
- `429 Too Many Requests`: Rate limit exceeded

**Server Error Codes**:
- `500 Internal Server Error`: Unexpected server error
- `502 Bad Gateway`: Upstream service error
- `503 Service Unavailable`: Service temporarily down

### Request/Response Format

**Standard Response Structure**:

```typescript
// Success response
{
  "success": true,
  "data": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe"
  },
  "meta": {
    "timestamp": "2026-01-10T12:00:00Z",
    "version": "v1"
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email format is invalid"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-01-10T12:00:00Z",
    "requestId": "abc-123-def"
  }
}
```

### Filtering, Sorting, Searching

**Query Parameters**:

```typescript
// Filtering
GET /api/products?category=electronics&inStock=true&minPrice=100

// Sorting
GET /api/products?sort=price:asc,name:desc

// Searching
GET /api/products?q=laptop&fields=name,description

// Combining
GET /api/products?category=electronics&sort=price:asc&q=laptop&page=2&limit=20
```

**Implementation Example**:

```typescript
// NestJS controller
@Get('products')
async getProducts(
  @Query('category') category?: string,
  @Query('inStock') inStock?: boolean,
  @Query('minPrice') minPrice?: number,
  @Query('sort') sort?: string,
  @Query('q') search?: string,
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
) {
  return this.productsService.find({
    category,
    inStock,
    minPrice,
    sort,
    search,
    page,
    limit,
  })
}
```

### Nested Resources

**Pattern**: Use nesting to show relationships

```typescript
// User's posts
GET    /api/users/123/posts
POST   /api/users/123/posts
GET    /api/users/123/posts/456

// Post's comments
GET    /api/posts/456/comments
POST   /api/posts/456/comments
DELETE /api/posts/456/comments/789

// Limit nesting depth (max 2-3 levels)
✅ Good: /api/users/123/posts/456
❌ Bad:  /api/users/123/posts/456/comments/789/replies/101
```

## GraphQL Patterns

### Schema Design

```graphql
# Type definitions
type User {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
  posts: [Post!]!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  comments: [Comment!]!
  publishedAt: DateTime
}

type Comment {
  id: ID!
  content: String!
  author: User!
  post: Post!
  createdAt: DateTime!
}

enum UserRole {
  USER
  ADMIN
  MODERATOR
}

# Queries
type Query {
  user(id: ID!): User
  users(
    limit: Int = 20,
    offset: Int = 0,
    role: UserRole
  ): UserConnection!

  post(id: ID!): Post
  posts(
    authorId: ID,
    published: Boolean,
    limit: Int = 20,
    after: String
  ): PostConnection!
}

# Mutations
type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!

  createPost(input: CreatePostInput!): Post!
  publishPost(id: ID!): Post!
}

# Inputs
input CreateUserInput {
  email: String!
  name: String!
  password: String!
}

input UpdateUserInput {
  email: String
  name: String
  role: UserRole
}

input CreatePostInput {
  title: String!
  content: String!
}

# Pagination (Relay-style)
type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### Resolver Patterns

```typescript
// NestJS GraphQL resolver
@Resolver(() => User)
export class UserResolver {
  constructor(
    private userService: UserService,
    private postService: PostService,
  ) {}

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string): Promise<User | null> {
    return this.userService.findById(id)
  }

  @Query(() => UserConnection)
  async users(
    @Args('limit', { defaultValue: 20 }) limit: number,
    @Args('offset', { defaultValue: 0 }) offset: number,
    @Args('role', { nullable: true }) role?: UserRole,
  ): Promise<UserConnection> {
    return this.userService.findMany({ limit, offset, role })
  }

  @Mutation(() => User)
  async createUser(
    @Args('input') input: CreateUserInput,
  ): Promise<User> {
    return this.userService.create(input)
  }

  // Field resolver (N+1 prevention with DataLoader)
  @ResolveField(() => [Post])
  async posts(
    @Parent() user: User,
    @Loader(PostLoader) postLoader: DataLoader<string, Post[]>,
  ): Promise<Post[]> {
    return postLoader.load(user.id)
  }
}
```

### DataLoader for N+1 Prevention

```typescript
// Prevent N+1 queries with DataLoader
import DataLoader from 'dataloader'

@Injectable()
export class PostLoader {
  constructor(private postService: PostService) {}

  createLoader(): DataLoader<string, Post[]> {
    return new DataLoader<string, Post[]>(async (userIds: string[]) => {
      // Batch load all posts for all users in one query
      const posts = await this.postService.findByUserIds(userIds)

      // Group by user ID
      const postsByUserId = posts.reduce((acc, post) => {
        if (!acc[post.authorId]) {
          acc[post.authorId] = []
        }
        acc[post.authorId].push(post)
        return acc
      }, {} as Record<string, Post[]>)

      // Return in same order as userIds
      return userIds.map(id => postsByUserId[id] || [])
    })
  }
}
```

## API Versioning Strategies

### 1. URL Path Versioning

**Most common and explicit**:

```typescript
// v1 API
GET /api/v1/users
GET /api/v1/products

// v2 API (breaking changes)
GET /api/v2/users
GET /api/v2/products
```

**Pros**: Clear, easy to route, works with all HTTP clients
**Cons**: URLs change, multiple codebases to maintain

### 2. Header Versioning

```typescript
// Request
GET /api/users
Headers: {
  "API-Version": "2.0"
}

// Or Accept header
Headers: {
  "Accept": "application/vnd.company.v2+json"
}
```

**Pros**: Clean URLs, flexible
**Cons**: Less visible, harder to test manually

### 3. Query Parameter Versioning

```typescript
GET /api/users?version=2
GET /api/products?api_version=2.0
```

**Pros**: Simple, flexible
**Cons**: Can be overlooked, pollutes query string

### Recommended: URL Path + Semantic Versioning

```
/api/v1/*  → Version 1.x.x
/api/v2/*  → Version 2.x.x

Within v1:
- v1.0.0 → Initial release
- v1.1.0 → New features (backward compatible)
- v1.1.1 → Bug fixes (backward compatible)
- v2.0.0 → Breaking changes (new major version)
```

## Error Handling

### Standard Error Format

```typescript
interface APIError {
  code: string              // Machine-readable error code
  message: string           // Human-readable message
  details?: ErrorDetail[]   // Additional details
  requestId?: string        // For debugging/support
  timestamp: string         // When error occurred
}

interface ErrorDetail {
  field?: string            // Field that caused error
  message: string           // Specific error for field
  code?: string            // Field-specific error code
}
```

### Error Response Examples

**Validation Error (422)**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email must be valid",
        "code": "INVALID_EMAIL"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters",
        "code": "PASSWORD_TOO_SHORT"
      }
    ],
    "requestId": "req_abc123",
    "timestamp": "2026-01-10T12:00:00Z"
  }
}
```

**Not Found (404)**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User with ID 123 not found",
    "requestId": "req_def456",
    "timestamp": "2026-01-10T12:00:00Z"
  }
}
```

**Rate Limit (429)**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "details": [
      {
        "message": "Limit: 100 requests per hour",
        "code": "HOURLY_LIMIT"
      }
    ],
    "requestId": "req_ghi789",
    "timestamp": "2026-01-10T12:00:00Z"
  }
}
```

### Implementation (NestJS)

```typescript
// Exception filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    let status = 500
    let errorResponse: APIError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      requestId: request.id,
      timestamp: new Date().toISOString(),
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'object') {
        errorResponse = {
          ...errorResponse,
          ...exceptionResponse,
        }
      }
    }

    response.status(status).json({
      success: false,
      error: errorResponse,
    })
  }
}
```

## Authentication & Authorization

### JWT Authentication

```typescript
// Login endpoint
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "securepassword"
}

Response: {
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}

// Use token in requests
GET /api/users/me
Headers: {
  "Authorization": "Bearer eyJhbGc..."
}
```

### API Key Authentication

```typescript
// Create API key
POST /api/api-keys
Headers: {
  "Authorization": "Bearer <user-jwt>"
}
Body: {
  "name": "Production API Key",
  "permissions": ["read:users", "write:posts"]
}

Response: {
  "success": true,
  "data": {
    "id": "key_abc123",
    "key": "sk_live_abc123def456...",  // Show only once!
    "name": "Production API Key",
    "permissions": ["read:users", "write:posts"]
  }
}

// Use API key
GET /api/users
Headers: {
  "X-API-Key": "sk_live_abc123def456..."
}
```

### OAuth 2.0 Flow

```typescript
// Step 1: Authorization request
GET /oauth/authorize?
  response_type=code&
  client_id=CLIENT_ID&
  redirect_uri=https://client.com/callback&
  scope=read:user write:posts&
  state=random_state_string

// Step 2: Authorization grant (user approves)
// Redirect to:
https://client.com/callback?code=AUTH_CODE&state=random_state_string

// Step 3: Exchange code for token
POST /oauth/token
Body: {
  "grant_type": "authorization_code",
  "code": "AUTH_CODE",
  "client_id": "CLIENT_ID",
  "client_secret": "CLIENT_SECRET",
  "redirect_uri": "https://client.com/callback"
}

Response: {
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "eyJhbGc...",
  "scope": "read:user write:posts"
}
```

## Rate Limiting & Throttling

### Rate Limit Headers

```typescript
// Response headers
HTTP/1.1 200 OK
X-RateLimit-Limit: 100          // Total allowed per window
X-RateLimit-Remaining: 95       // Remaining in current window
X-RateLimit-Reset: 1673366400   // Unix timestamp when limit resets
Retry-After: 60                 // Seconds until can retry (when 429)
```

### Implementation Patterns

**Token Bucket**:
```typescript
// Redis-based token bucket
class TokenBucketRateLimiter {
  constructor(
    private redis: Redis,
    private maxTokens: number,
    private refillRate: number, // tokens per second
  ) {}

  async consume(key: string, tokens = 1): Promise<boolean> {
    const now = Date.now()
    const bucketKey = `rate_limit:${key}`

    // Get current bucket state
    const bucket = await this.redis.hgetall(bucketKey)
    let availableTokens = parseFloat(bucket.tokens || this.maxTokens)
    let lastRefill = parseInt(bucket.lastRefill || now)

    // Refill tokens based on time passed
    const timePassed = (now - lastRefill) / 1000
    availableTokens = Math.min(
      this.maxTokens,
      availableTokens + timePassed * this.refillRate
    )

    // Try to consume tokens
    if (availableTokens >= tokens) {
      availableTokens -= tokens

      await this.redis.hset(bucketKey, {
        tokens: availableTokens.toString(),
        lastRefill: now.toString(),
      })
      await this.redis.expire(bucketKey, 3600) // 1 hour TTL

      return true
    }

    return false // Rate limit exceeded
  }
}
```

## API Documentation

### OpenAPI/Swagger

```typescript
// NestJS with Swagger
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

@ApiTags('users')
@Controller('users')
export class UserController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: [UserDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUsers(
    @Query() query: GetUsersQuery,
  ): Promise<UserDto[]> {
    return this.userService.findAll(query)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserDto> {
    return this.userService.create(createUserDto)
  }
}

// DTO with validation and documentation
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string
}
```

## Pagination Patterns

### Offset-Based Pagination

```typescript
// Request
GET /api/users?page=2&limit=20

// Response
{
  "success": true,
  "data": [
    { "id": 21, "name": "User 21" },
    { "id": 22, "name": "User 22" },
    // ... 18 more
  ],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

**Pros**: Simple, allows jumping to specific pages
**Cons**: Performance degrades with offset, inconsistent with concurrent writes

### Cursor-Based Pagination

```typescript
// Request (first page)
GET /api/users?limit=20

// Response
{
  "success": true,
  "data": [
    { "id": 1, "name": "User 1", "createdAt": "2026-01-01T00:00:00Z" },
    { "id": 2, "name": "User 2", "createdAt": "2026-01-02T00:00:00Z" },
    // ... 18 more
  ],
  "meta": {
    "nextCursor": "eyJpZCI6MjAsImNyZWF0ZWRBdCI6IjIwMjYtMDEtMjBUMDA6MDA6MDBaIn0=",
    "previousCursor": null,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}

// Request (next page)
GET /api/users?limit=20&cursor=eyJpZCI6MjAsImNyZWF0ZWRBdCI6IjIwMjYtMDEtMjBUMDA6MDA6MDBaIn0=
```

**Pros**: Consistent results, better performance, handles concurrent writes
**Cons**: Can't jump to specific page, more complex

## Caching Strategies

### Cache Headers

```typescript
// Fresh for 5 minutes, revalidate after
Cache-Control: max-age=300, must-revalidate

// Cache but always revalidate
Cache-Control: no-cache

// Never cache
Cache-Control: no-store

// ETag for conditional requests
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"

// Conditional request
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
→ 304 Not Modified (if unchanged)
```

### Redis Caching

```typescript
// Cache-aside pattern
@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findById(id: string): Promise<User> {
    const cacheKey = `user:${id}`

    // Try cache first
    const cached = await this.cache.get<User>(cacheKey)
    if (cached) {
      return cached
    }

    // Cache miss - fetch from database
    const user = await this.prisma.user.findUnique({ where: { id } })

    if (user) {
      // Cache for 5 minutes
      await this.cache.set(cacheKey, user, 300)
    }

    return user
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    })

    // Invalidate cache
    await this.cache.del(`user:${id}`)

    return user
  }
}
```

## API Security

### Security Headers

```typescript
// Helmet.js configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}))
```

### Input Validation

```typescript
// Always validate and sanitize inputs
@Post('users')
async createUser(
  @Body(ValidationPipe) createUserDto: CreateUserDto,
): Promise<User> {
  // DTO validation happens automatically
  return this.userService.create(createUserDto)
}

// Use parameterized queries (ORM handles this)
const users = await prisma.user.findMany({
  where: {
    email: userProvidedEmail, // Safe - parameterized
  },
})

// ❌ Never do this:
const users = await prisma.$queryRaw(
  `SELECT * FROM users WHERE email = '${userProvidedEmail}'`
)
```

### CORS Configuration

```typescript
// Restrictive CORS
app.enableCors({
  origin: [
    'https://app.example.com',
    'https://admin.example.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 3600,
})
```

## Best Practices Summary

✅ **Design**:
- Use RESTful conventions
- Version your API
- Design for extensibility
- Keep responses consistent

✅ **Performance**:
- Implement caching
- Use pagination
- Optimize database queries
- Enable compression

✅ **Security**:
- Always validate input
- Use HTTPS only
- Implement rate limiting
- Audit API access

✅ **Documentation**:
- Use OpenAPI/Swagger
- Provide examples
- Document errors
- Keep docs updated

✅ **Monitoring**:
- Log all requests
- Track error rates
- Monitor latency
- Set up alerts

---

**Version**: 1.0.0
**Last Updated**: January 10, 2026
**Status**: Production Ready ✅
