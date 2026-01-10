# Contract Testing Skill

Comprehensive guide to contract testing for microservices, covering consumer-driven contracts, provider verification, and integration patterns with Pact and other tools.

## Overview

Contract testing ensures that services can communicate correctly by testing the contracts (API interfaces) between them, without requiring both services to be running simultaneously. This is essential for microservices architectures.

## Core Concepts

### What is Contract Testing?

```
Traditional Integration Testing:
Consumer → [Real Provider Service] → Database
- Slow, flaky, complex setup
- Requires full environment

Contract Testing:
Consumer → [Contract] ← Provider
- Fast, reliable, isolated
- Tests API contract only
```

### Consumer-Driven Contracts (CDC)

```
1. Consumer defines expectations (contract)
2. Consumer tests generate contract file
3. Provider verifies it can fulfill contract
4. Both sides test independently
```

---

## 1. Pact (Consumer-Driven Contract Testing)

### Consumer Side Setup

```bash
npm install --save-dev @pact-foundation/pact
```

### Consumer Test Example

```typescript
// consumer/tests/user-service.contract.spec.ts
import { PactV3, MatchersV3 } from '@pact-foundation/pact'
import { UserService } from '../src/services/user-service'

const { like, eachLike, regex, iso8601DateTime } = MatchersV3

const provider = new PactV3({
  consumer: 'FrontendApp',
  provider: 'UserService',
  dir: './pacts'
})

describe('User Service Contract Tests', () => {
  const userService = new UserService('http://localhost')

  describe('GET /users/:id', () => {
    test('gets a user by ID', async () => {
      // Define expected interaction
      await provider
        .given('user with ID 123 exists')
        .uponReceiving('a request for user 123')
        .withRequest({
          method: 'GET',
          path: '/users/123',
          headers: {
            'Accept': 'application/json',
            'Authorization': regex('Bearer [A-Za-z0-9-_]+', 'Bearer token')
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            id: like(123),
            name: like('John Doe'),
            email: regex(
              '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              'john@example.com'
            ),
            role: like('admin'),
            createdAt: iso8601DateTime('2024-01-10T10:00:00Z'),
            metadata: {
              loginCount: like(42),
              lastLogin: iso8601DateTime()
            }
          }
        })
        .executeTest(async (mockServer) => {
          // Act: Call the service
          const user = await userService.getUser(123, 'Bearer token')

          // Assert: Verify consumer handles response correctly
          expect(user).toEqual({
            id: 123,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'admin',
            createdAt: expect.any(String),
            metadata: {
              loginCount: 42,
              lastLogin: expect.any(String)
            }
          })
        })
    })
  })

  describe('POST /users', () => {
    test('creates a new user', async () => {
      await provider
        .given('no user exists')
        .uponReceiving('a request to create a user')
        .withRequest({
          method: 'POST',
          path: '/users',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            name: like('Jane Smith'),
            email: regex('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', 'jane@example.com'),
            role: like('user')
          }
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Location': regex('/users/[0-9]+', '/users/124')
          },
          body: {
            id: like(124),
            name: like('Jane Smith'),
            email: like('jane@example.com'),
            role: like('user'),
            createdAt: iso8601DateTime()
          }
        })
        .executeTest(async (mockServer) => {
          const newUser = {
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'user'
          }

          const created = await userService.createUser(newUser)

          expect(created).toMatchObject({
            id: expect.any(Number),
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'user',
            createdAt: expect.any(String)
          })
        })
    })
  })

  describe('GET /users', () => {
    test('gets a list of users', async () => {
      await provider
        .given('users exist')
        .uponReceiving('a request for all users')
        .withRequest({
          method: 'GET',
          path: '/users',
          query: {
            page: '1',
            limit: '10'
          }
        })
        .willRespondWith({
          status: 200,
          body: {
            data: eachLike({
              id: like(1),
              name: like('User Name'),
              email: like('user@example.com')
            }, { min: 2 }),
            pagination: {
              page: like(1),
              limit: like(10),
              total: like(100)
            }
          }
        })
        .executeTest(async (mockServer) => {
          const response = await userService.getUsers({ page: 1, limit: 10 })

          expect(response.data).toHaveLength(2)
          expect(response.pagination).toEqual({
            page: 1,
            limit: 10,
            total: 100
          })
        })
    })
  })

  describe('Error scenarios', () => {
    test('handles user not found', async () => {
      await provider
        .given('user with ID 999 does not exist')
        .uponReceiving('a request for non-existent user')
        .withRequest({
          method: 'GET',
          path: '/users/999'
        })
        .willRespondWith({
          status: 404,
          body: {
            error: like('User not found'),
            code: like('USER_NOT_FOUND')
          }
        })
        .executeTest(async (mockServer) => {
          await expect(userService.getUser(999)).rejects.toThrow('User not found')
        })
    })
  })
})
```

### Generated Contract File

```json
// pacts/FrontendApp-UserService.json
{
  "consumer": {
    "name": "FrontendApp"
  },
  "provider": {
    "name": "UserService"
  },
  "interactions": [
    {
      "description": "a request for user 123",
      "providerState": "user with ID 123 exists",
      "request": {
        "method": "GET",
        "path": "/users/123",
        "headers": {
          "Accept": "application/json",
          "Authorization": "Bearer token"
        }
      },
      "response": {
        "status": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "id": 123,
          "name": "John Doe",
          "email": "john@example.com",
          "role": "admin",
          "createdAt": "2024-01-10T10:00:00Z"
        },
        "matchingRules": {
          "$.body.id": { "match": "type" },
          "$.body.name": { "match": "type" },
          "$.body.email": { "match": "regex", "regex": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" }
        }
      }
    }
  ],
  "metadata": {
    "pactSpecification": {
      "version": "3.0.0"
    }
  }
}
```

---

## 2. Provider Verification

### Provider Setup

```bash
npm install --save-dev @pact-foundation/pact
```

### Provider Verification Test

```typescript
// provider/tests/user-service.verification.spec.ts
import { Verifier } from '@pact-foundation/pact'
import path from 'path'
import { startServer, stopServer } from '../src/server'

describe('User Service Provider Verification', () => {
  let server: any

  beforeAll(async () => {
    // Start provider service
    server = await startServer(3000)
  })

  afterAll(async () => {
    await stopServer(server)
  })

  test('validates the expectations of FrontendApp', async () => {
    const opts = {
      provider: 'UserService',
      providerBaseUrl: 'http://localhost:3000',

      // Local pact files
      pactUrls: [
        path.resolve(__dirname, '../../pacts/FrontendApp-UserService.json')
      ],

      // Or from Pact Broker
      // pactBrokerUrl: 'https://your-pact-broker.com',
      // pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      // consumerVersionSelectors: [
      //   { deployed: true },
      //   { mainBranch: true },
      //   { deployedOrReleased: true }
      // ],

      // State handlers
      stateHandlers: {
        'user with ID 123 exists': async () => {
          // Setup test data
          await setupUser({ id: 123, name: 'John Doe', email: 'john@example.com' })
        },
        'user with ID 999 does not exist': async () => {
          // Ensure user doesn't exist
          await deleteUser(999)
        },
        'users exist': async () => {
          // Create multiple users
          await setupUsers([
            { id: 1, name: 'User 1', email: 'user1@example.com' },
            { id: 2, name: 'User 2', email: 'user2@example.com' }
          ])
        },
        'no user exists': async () => {
          // Clear all users
          await clearUsers()
        }
      },

      // Request filters (add auth tokens, etc.)
      requestFilter: (req, res, next) => {
        // Add authentication if needed
        if (req.headers.authorization) {
          req.headers.authorization = 'Bearer valid-test-token'
        }
        next()
      },

      // Publish verification results
      publishVerificationResult: true,
      providerVersion: process.env.GIT_COMMIT,
      providerVersionBranch: process.env.GIT_BRANCH
    }

    const verifier = new Verifier(opts)
    await verifier.verifyProvider()
  })
})
```

### State Management

```typescript
// provider/tests/state-handlers.ts
import { db } from '../src/database'

export const stateHandlers = {
  // Setup initial state
  'user with ID 123 exists': async () => {
    await db.users.create({
      id: 123,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      createdAt: new Date('2024-01-10T10:00:00Z')
    })
  },

  // Teardown state
  afterEach: async () => {
    await db.users.deleteMany()
  }
}

async function setupUser(userData: any) {
  return await db.users.create(userData)
}

async function setupUsers(users: any[]) {
  return await db.users.createMany(users)
}

async function deleteUser(id: number) {
  await db.users.delete({ where: { id } })
}

async function clearUsers() {
  await db.users.deleteMany()
}
```

---

## 3. Pact Broker Integration

### Publishing Contracts

```bash
# Publish consumer contracts to broker
npx pact-broker publish ./pacts \
  --consumer-app-version=$GIT_COMMIT \
  --tag=$GIT_BRANCH \
  --broker-base-url=$PACT_BROKER_URL \
  --broker-token=$PACT_BROKER_TOKEN
```

### CI/CD Integration

```yaml
# .github/workflows/consumer-tests.yml
name: Consumer Contract Tests

on: [push, pull_request]

jobs:
  consumer-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Run consumer contract tests
        run: npm run test:contract

      - name: Publish contracts to broker
        if: github.ref == 'refs/heads/main'
        run: |
          npx pact-broker publish ./pacts \
            --consumer-app-version=${{ github.sha }} \
            --tag=${{ github.ref_name }} \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-token=${{ secrets.PACT_BROKER_TOKEN }}
```

```yaml
# .github/workflows/provider-tests.yml
name: Provider Verification

on: [push, pull_request]

jobs:
  provider-verification:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Start provider service
        run: npm start &

      - name: Verify provider contracts
        run: npm run test:verify
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
          GIT_COMMIT: ${{ github.sha }}
          GIT_BRANCH: ${{ github.ref_name }}

      - name: Can I deploy?
        run: |
          npx pact-broker can-i-deploy \
            --pacticipant=UserService \
            --version=${{ github.sha }} \
            --to-environment=production \
            --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
            --broker-token=${{ secrets.PACT_BROKER_TOKEN }}
```

---

## 4. GraphQL Contract Testing

### Consumer GraphQL Contract

```typescript
// consumer/tests/graphql-contract.spec.ts
import { PactV3, GraphQLInteraction } from '@pact-foundation/pact'

const provider = new PactV3({
  consumer: 'WebApp',
  provider: 'GraphQLAPI'
})

describe('GraphQL API Contract', () => {
  test('query user by ID', async () => {
    await provider
      .addInteraction(
        new GraphQLInteraction()
          .given('user with ID 123 exists')
          .uponReceiving('a query for user 123')
          .withQuery(`
            query GetUser($id: ID!) {
              user(id: $id) {
                id
                name
                email
                posts {
                  id
                  title
                }
              }
            }
          `)
          .withVariables({ id: '123' })
          .willRespondWith({
            status: 200,
            body: {
              data: {
                user: {
                  id: '123',
                  name: like('John Doe'),
                  email: like('john@example.com'),
                  posts: eachLike({
                    id: like('1'),
                    title: like('Post Title')
                  }, { min: 1 })
                }
              }
            }
          })
      )
      .executeTest(async (mockServer) => {
        const client = createApolloClient(mockServer.url)

        const result = await client.query({
          query: GET_USER,
          variables: { id: '123' }
        })

        expect(result.data.user).toMatchObject({
          id: '123',
          name: expect.any(String),
          email: expect.any(String),
          posts: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String)
            })
          ])
        })
      })
  })

  test('mutation to create post', async () => {
    await provider
      .addInteraction(
        new GraphQLInteraction()
          .given('user is authenticated')
          .uponReceiving('a mutation to create a post')
          .withQuery(`
            mutation CreatePost($input: CreatePostInput!) {
              createPost(input: $input) {
                id
                title
                content
                author {
                  id
                  name
                }
              }
            }
          `)
          .withVariables({
            input: {
              title: 'New Post',
              content: 'Post content'
            }
          })
          .willRespondWith({
            status: 200,
            body: {
              data: {
                createPost: {
                  id: like('456'),
                  title: like('New Post'),
                  content: like('Post content'),
                  author: {
                    id: like('123'),
                    name: like('John Doe')
                  }
                }
              }
            }
          })
      )
      .executeTest(async (mockServer) => {
        const client = createApolloClient(mockServer.url)

        const result = await client.mutate({
          mutation: CREATE_POST,
          variables: {
            input: {
              title: 'New Post',
              content: 'Post content'
            }
          }
        })

        expect(result.data.createPost).toMatchObject({
          id: expect.any(String),
          title: 'New Post',
          content: 'Post content',
          author: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String)
          })
        })
      })
  })
})
```

---

## 5. Message/Event Contract Testing

### Async Message Contracts

```typescript
// consumer/tests/message-contract.spec.ts
import { MessageConsumerPact } from '@pact-foundation/pact'

const messagePact = new MessageConsumerPact({
  consumer: 'OrderProcessor',
  provider: 'PaymentService',
  dir: './pacts'
})

describe('Payment Event Contracts', () => {
  test('receives payment completed event', async () => {
    await messagePact
      .given('payment is completed')
      .expectsToReceive('payment completed event')
      .withContent({
        eventType: like('payment.completed'),
        eventId: regex('[a-f0-9-]+', 'a1b2c3d4-e5f6-7890'),
        timestamp: iso8601DateTime(),
        payload: {
          orderId: like('ORD-123'),
          paymentId: like('PAY-456'),
          amount: like(99.99),
          currency: like('USD'),
          status: like('completed')
        }
      })
      .withMetadata({
        'content-type': 'application/json',
        'correlation-id': regex('[a-f0-9-]+', 'corr-123')
      })
      .verify(async (message) => {
        // Consumer's message handler
        await handlePaymentEvent(message.contents)

        // Assert expected side effects
        const order = await getOrder('ORD-123')
        expect(order.status).toBe('paid')
      })
  })

  test('receives payment failed event', async () => {
    await messagePact
      .given('payment has failed')
      .expectsToReceive('payment failed event')
      .withContent({
        eventType: like('payment.failed'),
        eventId: regex('[a-f0-9-]+', 'b2c3d4e5-f6g7-8901'),
        timestamp: iso8601DateTime(),
        payload: {
          orderId: like('ORD-124'),
          paymentId: like('PAY-457'),
          amount: like(149.99),
          currency: like('USD'),
          status: like('failed'),
          errorCode: like('INSUFFICIENT_FUNDS'),
          errorMessage: like('Insufficient funds in account')
        }
      })
      .verify(async (message) => {
        await handlePaymentEvent(message.contents)

        const order = await getOrder('ORD-124')
        expect(order.status).toBe('payment_failed')
        expect(order.errorReason).toBe('INSUFFICIENT_FUNDS')
      })
  })
})
```

---

## 6. Best Practices

### 1. Contract Evolution

```typescript
// Handle breaking changes gracefully
await provider
  .given('user exists')
  .uponReceiving('request with optional new field')
  .withRequest({
    method: 'GET',
    path: '/users/123',
    query: {
      // Optional new query parameter
      includeMetadata: optional(boolean())
    }
  })
  .willRespondWith({
    status: 200,
    body: {
      id: like(123),
      name: like('John'),
      // New optional field (backward compatible)
      metadata: optional({
        lastLogin: iso8601DateTime()
      })
    }
  })
```

### 2. Provider States

```typescript
// Reusable provider states
const commonStates = {
  'authenticated user': async () => {
    return setupAuthenticatedUser({ id: 123, role: 'admin' })
  },

  'empty database': async () => {
    await clearDatabase()
  },

  'rate limit not exceeded': async () => {
    await resetRateLimit('test-user')
  }
}

// Compose states
await provider
  .given('authenticated user')
  .given('rate limit not exceeded')
  .uponReceiving('request to create resource')
  // ...
```

### 3. Matching Flexibility

```typescript
import { MatchersV3 } from '@pact-foundation/pact'

const {
  like,          // Type matching
  eachLike,      // Array with type matching
  regex,         // Regex matching
  iso8601DateTime, // Date format
  uuid,          // UUID format
  integer,       // Integer type
  decimal,       // Decimal type
  boolean,       // Boolean type
  string,        // String type
  optional       // Optional field
} = MatchersV3

// Use appropriate matchers
body: {
  id: uuid('a1b2c3d4-e5f6-7890-1234-567890abcdef'),
  count: integer(42),
  price: decimal(19.99),
  active: boolean(true),
  email: regex('^[a-z]+@[a-z]+\\.[a-z]+$', 'test@example.com'),
  tags: eachLike(string('tag'), { min: 1, max: 5 })
}
```

---

## When to Use This Skill

Invoke the Contract Testing skill when:

1. **Building microservices** that need to communicate
2. **Testing API integrations** without running full services
3. **Ensuring backward compatibility** during API changes
4. **Testing consumer-provider relationships** independently
5. **Implementing CI/CD** for microservices
6. **Testing event-driven architectures** with message queues
7. **Validating GraphQL** schema compatibility
8. **Managing API evolution** across teams

---

## Related Resources

- **API Design Patterns**: `examples/skills/api-design-patterns.md`
- **Testing Strategy**: `guides/advanced-patterns/testing-strategy.md`
- **Microservices Patterns**: `examples/skills/microservices-patterns.md`

---

**Version**: 1.0.0
**Last Updated**: 2026-01-10
**Status**: Production Ready ✅
