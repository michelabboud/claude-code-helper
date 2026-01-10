---
integration_name: SaaS Application Platform
description: Multi-tenant SaaS with authentication, subscriptions, analytics, and webhooks
priority: P1
complexity: Advanced
---

# SaaS Application Platform Integration Example

Real-world example of building a complete multi-tenant SaaS platform using multiple agents and tools.

## System Overview

### Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Next.js App   │────▶│   API Gateway    │────▶│  Tenant DB  │
│  (Multi-tenant) │     │   (Kong/Tyk)     │     │ (PostgreSQL)│
└─────────────────┘     └──────────────────┘     └─────────────┘
       │                         │                        │
       │                         ▼                        │
       │                ┌──────────────────┐              │
       │                │   Auth Service   │              │
       └───────────────▶│   (Auth0/Clerk)  │◀─────────────┘
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  Billing Service │
                        │    (Stripe)      │
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  Analytics       │
                        │  (Segment/Mixpanel)│
                        └──────────────────┘
```

### Components
- **Frontend**: Next.js 14 with App Router, multi-tenant routing
- **Backend**: NestJS with multi-tenancy middleware
- **Database**: PostgreSQL with row-level security (RLS)
- **Authentication**: Clerk for user auth + custom tenant management
- **Billing**: Stripe for subscriptions and metered billing
- **Email**: Resend for transactional emails
- **Analytics**: PostHog for product analytics
- **Queue**: BullMQ for background jobs
- **Cache**: Redis for sessions and rate limiting
- **Storage**: AWS S3 for tenant files
- **Webhooks**: Svix for reliable webhook delivery

## Agents Used

### 1. React/Next.js Expert
**For**: Multi-tenant frontend development
- Tenant-aware routing and layouts
- User dashboard with analytics
- Admin panel for tenant management
- Subscription management UI
- Onboarding flows
- Team collaboration features

### 2. Node.js/TypeScript Backend Expert
**For**: Multi-tenant API development
- Tenant isolation middleware
- RESTful API with tenant scoping
- Subscription management logic
- Usage tracking and metering
- Webhook handling
- Background job processing

### 3. Security Expert
**For**: Multi-tenant security implementation
- Tenant data isolation (RLS)
- Authentication and authorization
- API security (rate limiting, CORS)
- Secure webhook signature verification
- Data encryption at rest
- Audit logging

### 4. DevOps/Infrastructure Expert
**For**: Scalable multi-tenant deployment
- Multi-tenant database sharding strategy
- Container orchestration for scale
- CI/CD with tenant-specific deployments
- Monitoring per tenant
- Backup and disaster recovery

### 5. QA/Testing Expert
**For**: Multi-tenant testing strategy
- Tenant isolation testing
- Subscription flow testing
- Load testing with multiple tenants
- Security testing for data isolation

## Implementation Workflow

### Phase 1: Foundation & Authentication (Day 1-3)

```bash
# 1. Project scaffolding
/scaffold nextjs-app saas-frontend --typescript --tailwind --auth
/scaffold nestjs-api saas-backend --database postgres --auth --multi-tenant

# 2. Authentication setup
Ask Security Expert: "Implement Clerk authentication with custom tenant management"

# Features:
# - User sign up/sign in
# - Organization/tenant creation
# - Team member invitations
# - Role-based access control (Owner, Admin, Member)
# - SSO support (Google, GitHub, SAML)

# 3. Multi-tenancy foundation
Ask Node.js Expert: "Implement tenant isolation middleware with PostgreSQL RLS"

# Tenant resolution strategies:
# - Subdomain: {tenant}.app.com
# - Path: app.com/{tenant}
# - Header: X-Tenant-ID
```

### Phase 2: Database Design (Day 4-5)

```bash
# 1. Multi-tenant schema design
Ask: "Design multi-tenant database schema with RLS policies"

# Schema approach: Single database with tenant_id column
# Core tables:
# - tenants (id, slug, name, plan, created_at, settings)
# - users (id, email, tenant_id, role, created_at)
# - subscriptions (id, tenant_id, stripe_subscription_id, plan, status)
# - usage_metrics (id, tenant_id, metric_type, value, timestamp)
# - api_keys (id, tenant_id, key_hash, name, permissions)
# - webhooks (id, tenant_id, url, events, secret)
# - audit_logs (id, tenant_id, user_id, action, metadata, timestamp)

# 2. Row-level security policies
-- Example RLS policy
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

# 3. Create migrations
/migrate create multi_tenant_schema
```

### Phase 3: Subscription & Billing (Day 6-8)

```bash
# 1. Stripe integration
Ask Node.js Expert: "Integrate Stripe for subscription management with metered billing"

# Plans:
# - Free: $0/month (1 user, 1000 API calls)
# - Starter: $29/month (5 users, 10K API calls)
# - Pro: $99/month (20 users, 100K API calls)
# - Enterprise: Custom pricing (unlimited)

# Features:
# - Subscription creation and cancellation
# - Plan upgrades/downgrades with proration
# - Usage-based billing (API calls, storage)
# - Invoice generation
# - Payment method management
# - Failed payment handling

# 2. Usage tracking
Ask Node.js Expert: "Implement usage tracking middleware for metered billing"

# Track:
# - API calls per endpoint
# - Storage usage
# - Team member count
# - Active users
# - Custom metrics

# 3. Webhook handling
Ask Node.js Expert: "Implement Stripe webhook handling for subscription events"

# Handle events:
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted
# - invoice.payment_succeeded
# - invoice.payment_failed
```

### Phase 4: Core Features (Day 9-14)

```bash
# 1. User dashboard
Ask React Expert: "Create tenant dashboard with analytics and usage metrics"

# Sections:
# - Usage overview (API calls, storage, active users)
# - Billing and invoices
# - Team management
# - API keys management
# - Webhook configuration
# - Audit logs
# - Settings

# 2. Admin panel
Ask React Expert: "Build admin panel for tenant management"

# Features:
# - Tenant list with search and filters
# - Tenant details and metrics
# - Subscription management
# - Usage monitoring
# - Impersonation for support
# - Feature flags per tenant

# 3. API implementation
Ask Node.js Expert: "Implement tenant-scoped RESTful API"

# Endpoints:
# GET    /api/v1/projects (tenant-scoped)
# POST   /api/v1/projects (tenant-scoped)
# GET    /api/v1/projects/:id (tenant-scoped)
# PUT    /api/v1/projects/:id (tenant-scoped)
# DELETE /api/v1/projects/:id (tenant-scoped)

# GET    /api/v1/usage (tenant metrics)
# GET    /api/v1/billing (subscription info)
# POST   /api/v1/webhooks (register webhook)
# GET    /api/v1/audit-logs (tenant audit trail)

# 4. Onboarding flow
Ask React Expert: "Create multi-step onboarding flow for new tenants"

# Steps:
# 1. Account creation
# 2. Organization setup
# 3. Team invitation
# 4. Integration setup
# 5. First project creation
# 6. Success and next steps
```

### Phase 5: Webhooks & Integrations (Day 15-16)

```bash
# 1. Webhook system
Ask Node.js Expert: "Implement reliable webhook delivery with Svix"

# Features:
# - Webhook registration and management
# - Event types subscription
# - Signature verification
# - Automatic retries with exponential backoff
# - Webhook delivery logs
# - Test webhook endpoint

# Event types:
# - project.created
# - project.updated
# - project.deleted
# - user.invited
# - subscription.updated
# - usage.limit_reached

# 2. API client SDK
Ask Node.js Expert: "Generate TypeScript SDK for API"

# Features:
# - Type-safe API client
# - Authentication handling
# - Automatic pagination
# - Error handling
# - Retry logic
# - Webhook verification helper

# 3. Integration marketplace
Ask React Expert: "Build integration marketplace UI"

# Integrations:
# - Slack notifications
# - GitHub integration
# - Zapier connector
# - Custom webhooks
```

### Phase 6: Analytics & Reporting (Day 17-18)

```bash
# 1. Product analytics
Ask Node.js Expert: "Integrate PostHog for product analytics"

# Track:
# - User actions (feature usage)
# - Funnel analysis (onboarding completion)
# - Retention cohorts
# - Feature adoption
# - Custom events

# 2. Usage analytics
Ask React Expert: "Build usage analytics dashboard"

# Visualizations:
# - API calls over time
# - Response time percentiles
# - Error rate trends
# - Storage usage growth
# - Active users timeline
# - Feature usage heatmap

# 3. Business metrics
Ask: "Create business metrics dashboard for admins"

# Metrics:
# - MRR (Monthly Recurring Revenue)
# - Churn rate
# - LTV (Lifetime Value)
# - CAC (Customer Acquisition Cost)
# - Conversion rates
# - Plan distribution
```

### Phase 7: Security Hardening (Day 19-20)

```bash
# 1. Security audit
/security-audit

# Focus areas:
# - Tenant isolation validation
# - SQL injection prevention
# - XSS protection
# - CSRF protection
# - API rate limiting
# - Secrets management

# 2. Row-level security testing
Ask Security Expert: "Test PostgreSQL RLS policies for tenant isolation"

# Test scenarios:
# - Cross-tenant data access attempts
# - SQL injection with tenant bypass
# - Authorization boundary testing
# - Tenant switching attacks

# 3. Rate limiting
Ask Security Expert: "Implement Redis-based rate limiting per tenant"

# Rate limits:
# - Free: 10 req/min per IP
# - Starter: 100 req/min per API key
# - Pro: 1000 req/min per API key
# - Enterprise: Custom limits

# 4. Audit logging
Ask Node.js Expert: "Implement comprehensive audit logging"

# Log events:
# - User authentication
# - Tenant management actions
# - Subscription changes
# - Data access/modification
# - API key usage
# - Webhook deliveries
```

### Phase 8: Performance & Scale (Day 21-22)

```bash
# 1. Database optimization
Ask Node.js Expert: "Optimize database queries with proper indexing"

# Optimizations:
# - Compound indexes for tenant_id + other columns
# - Partial indexes for active records
# - Query optimization for dashboards
# - Connection pooling configuration
# - Read replicas for analytics

# 2. Caching strategy
Ask Node.js Expert: "Implement Redis caching for tenant data"

# Cache:
# - Tenant configuration
# - User permissions
# - Subscription status
# - API rate limit counters
# - Usage metrics (short TTL)

# 3. Background jobs
Ask Node.js Expert: "Setup BullMQ for async processing"

# Jobs:
# - Usage aggregation (hourly)
# - Invoice generation (daily)
# - Webhook delivery
# - Email notifications
# - Data exports
# - Tenant analytics calculation

# 4. Load testing
Ask QA Expert: "Create load tests for multi-tenant scenarios"

# Scenarios:
# - 1000 concurrent tenants
# - 10K API calls/second across tenants
# - Tenant isolation under load
# - Database connection pool saturation
```

### Phase 9: Deployment (Day 23-25)

```bash
# 1. Infrastructure setup
Ask DevOps Expert: "Setup Kubernetes with multi-tenant considerations"

# Components:
# - Horizontal pod autoscaling per service
# - Database sharding strategy for scale
# - Redis cluster for cache
# - S3 for file storage with tenant prefixes
# - CDN configuration

# 2. Monitoring setup
Ask Observability Expert: "Configure multi-tenant monitoring"

# Dashboards:
# - Per-tenant metrics
# - Cross-tenant aggregations
# - Database performance per tenant
# - API latency by tenant tier
# - Error rates by tenant

# 3. Deploy to staging
/deploy staging --validate

# Validations:
# - Tenant isolation verified
# - Subscription flows tested
# - Webhook delivery working
# - Analytics tracking active
# - Rate limiting functional

# 4. Deploy to production
/deploy production --strategy blue-green

# Post-deployment:
# - Monitor tenant isolation
# - Verify billing accuracy
# - Check webhook deliveries
# - Monitor resource usage
# - Track error rates
```

## Key Features Implemented

### Multi-Tenancy Architecture

```typescript
// Tenant resolution middleware
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // Resolve tenant from subdomain, path, or header
    const tenant = await this.resolveTenant(req)
    
    if (!tenant) {
      throw new UnauthorizedException('Invalid tenant')
    }
    
    // Set tenant context for RLS
    await this.db.query(
      `SELECT set_config('app.current_tenant', $1, false)`,
      [tenant.id]
    )
    
    req['tenant'] = tenant
    next()
  }
  
  private async resolveTenant(req: Request): Promise<Tenant> {
    // Try subdomain: acme.app.com
    const subdomain = req.hostname.split('.')[0]
    if (subdomain) {
      return await this.tenantService.findBySlug(subdomain)
    }
    
    // Try header: X-Tenant-ID
    const tenantId = req.headers['x-tenant-id']
    if (tenantId) {
      return await this.tenantService.findById(tenantId)
    }
    
    // Try API key
    const apiKey = req.headers['authorization']?.replace('Bearer ', '')
    if (apiKey) {
      return await this.tenantService.findByApiKey(apiKey)
    }
    
    return null
  }
}
```

### Subscription Management

```typescript
// Subscription service with metered billing
export class SubscriptionService {
  async createSubscription(
    tenantId: string,
    plan: PricingPlan,
    paymentMethodId: string
  ): Promise<Subscription> {
    // Create Stripe customer
    const customer = await this.stripe.customers.create({
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
      metadata: { tenantId },
    })
    
    // Create subscription with usage-based billing
    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [
        { price: plan.stripePriceId }, // Base price
        { 
          price: plan.meteredPriceId, // Usage-based
          billing_thresholds: { usage_gte: plan.includedUsage },
        },
      ],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })
    
    // Store in database
    return await this.db.subscriptions.create({
      tenantId,
      stripeSubscriptionId: subscription.id,
      plan: plan.name,
      status: subscription.status,
    })
  }
  
  async trackUsage(tenantId: string, quantity: number): Promise<void> {
    const subscription = await this.getActiveSubscription(tenantId)
    const usageItem = subscription.items.find(i => i.price.recurring.usage_type === 'metered')
    
    // Report usage to Stripe
    await this.stripe.subscriptionItems.createUsageRecord(
      usageItem.id,
      {
        quantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      }
    )
    
    // Store in database for analytics
    await this.db.usageMetrics.create({
      tenantId,
      metricType: 'api_calls',
      value: quantity,
      timestamp: new Date(),
    })
  }
}
```

### Webhook System

```typescript
// Reliable webhook delivery with Svix
export class WebhookService {
  constructor(private svix: Svix) {}
  
  async registerWebhook(
    tenantId: string,
    url: string,
    events: string[]
  ): Promise<Webhook> {
    // Create webhook endpoint in Svix
    const endpoint = await this.svix.endpoint.create(tenantId, {
      url,
      version: 1,
      filterTypes: events,
    })
    
    // Store in database
    return await this.db.webhooks.create({
      tenantId,
      url,
      events,
      svixEndpointId: endpoint.id,
      secret: endpoint.secret,
    })
  }
  
  async sendEvent(
    tenantId: string,
    eventType: string,
    payload: any
  ): Promise<void> {
    // Send via Svix for reliable delivery
    await this.svix.message.create(tenantId, {
      eventType,
      payload,
    })
    
    // Svix handles:
    // - Signature generation
    // - Automatic retries with exponential backoff
    // - Delivery logging
    // - Webhook testing
  }
}
```

### Usage Tracking Middleware

```typescript
// Track API usage for billing
@Injectable()
export class UsageTrackingMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const tenant = req['tenant']
    const startTime = Date.now()
    
    // Track request
    res.on('finish', async () => {
      const duration = Date.now() - startTime
      
      // Track in Redis for real-time limits
      await this.redis.hincrby(
        `usage:${tenant.id}:${this.getCurrentHour()}`,
        'api_calls',
        1
      )
      
      // Queue for Stripe reporting (batched)
      await this.queue.add('report-usage', {
        tenantId: tenant.id,
        quantity: 1,
        timestamp: new Date(),
      })
      
      // Check usage limits
      const usage = await this.getHourlyUsage(tenant.id)
      const limit = tenant.subscription.plan.hourlyApiLimit
      
      if (usage >= limit) {
        await this.webhookService.sendEvent(
          tenant.id,
          'usage.limit_reached',
          { usage, limit }
        )
      }
    })
    
    next()
  }
}
```

## Testing Strategy

### Unit Tests (600+ tests)
```bash
# Multi-tenancy
- TenantMiddleware: Tenant resolution, context setting
- TenantService: CRUD operations, validation
- RLS Policies: Tenant isolation verification

# Subscription
- SubscriptionService: Creation, upgrades, cancellations
- UsageTracking: Metering, aggregation, reporting
- BillingService: Invoice generation, payment handling

# Webhooks
- WebhookService: Registration, delivery, retries
- SignatureVerification: Security validation
```

### Integration Tests (150+ tests)
```bash
# Multi-tenant flows
- User signup → Tenant creation → Subscription setup
- Team member invitation → Acceptance → Access verification
- Subscription upgrade → Proration → Billing adjustment
- Usage limit reached → Throttling → Notification

# Data isolation
- Cross-tenant data access attempts
- API with wrong tenant context
- Webhook delivery to correct tenant only
```

### E2E Tests (75+ scenarios)
```bash
# Complete user journeys
- Sign up → Onboarding → First project → Invite team
- Subscribe to paid plan → Use features → Receive invoice
- Configure webhook → Trigger event → Receive payload
- Reach usage limit → Upgrade plan → Continue usage
- Cancel subscription → Export data → Account deletion
```

### Load Tests
```bash
# Multi-tenant scale testing
- 1000 concurrent tenants
- 10K API calls/second distributed across tenants
- Database connection pool behavior
- Redis cache hit rates
- Webhook delivery at scale

# Target metrics:
- 95th percentile response time < 200ms
- Tenant isolation maintained under load
- Zero cross-tenant data leakage
- Successful webhook delivery rate > 99%
```

## Monitoring & Observability

### Metrics Tracked

#### Per-Tenant Metrics
- API request rate and latency
- Error rates by endpoint
- Database query performance
- Cache hit rates
- Storage usage
- Active users
- Feature adoption

#### Cross-Tenant Metrics
- Total MRR and growth rate
- Churn rate by plan
- Conversion rate (free → paid)
- Average revenue per user (ARPU)
- Customer lifetime value (LTV)
- Support ticket volume

### Dashboards

```
Multi-Tenant SaaS Dashboard
├── Business Metrics
│   ├── MRR/ARR (with trends)
│   ├── Active tenants by plan
│   ├── Churn rate
│   └── LTV:CAC ratio
├── Technical Metrics (Global)
│   ├── API request volume
│   ├── Response time p50/p95/p99
│   ├── Error rate by service
│   └── Database performance
├── Per-Tenant View
│   ├── API usage vs limits
│   ├── Storage usage
│   ├── Active users
│   └── Feature usage heatmap
└── Billing & Usage
    ├── Revenue by tenant
    ├── Usage vs plan limits
    ├── Failed payments
    └── Upgrade opportunities
```

### Alerts Configured

**Critical**:
- Tenant data isolation breach
- Failed payment > 3 attempts
- API error rate > 1%
- Database RLS policy violation
- Webhook delivery failure rate > 5%

**Warning**:
- Tenant approaching usage limit (80%)
- High API latency (p95 > 500ms)
- Low cache hit rate (< 80%)
- High database connection usage (> 80%)

**Info**:
- New tenant signup
- Subscription plan change
- Feature flag enabled for tenant
- Usage milestone reached

## Production Checklist

✅ **Multi-Tenancy**
- Row-level security policies tested and verified
- Tenant isolation validated under load
- Cross-tenant access attempts blocked
- API scoped correctly to tenant context

✅ **Authentication & Authorization**
- SSO providers configured (Google, GitHub, SAML)
- Role-based access control (RBAC) working
- API key authentication secure
- Session management with Redis

✅ **Subscription & Billing**
- Stripe integration tested (sandbox and live)
- Metered billing accurate
- Invoice generation working
- Failed payment handling implemented
- Proration calculations correct

✅ **Performance**
- Load tested for 1000 concurrent tenants
- Database queries optimized with indexes
- Redis caching effective (> 80% hit rate)
- CDN configured for static assets
- Background jobs processing efficiently

✅ **Security**
- PCI compliance for payment data
- Data encryption at rest and in transit
- API rate limiting per tenant tier
- Secrets stored in Vault/AWS Secrets Manager
- Audit logging comprehensive

✅ **Observability**
- Per-tenant monitoring active
- Business metrics tracking (MRR, churn)
- Error tracking with Sentry
- Log aggregation with structured logs
- Alerting configured for critical issues

✅ **Webhooks**
- Reliable delivery with Svix
- Signature verification working
- Retry logic tested
- Webhook logs accessible

✅ **Operations**
- CI/CD pipeline with tenant-aware deployments
- Database backup strategy (daily, retained 30 days)
- Disaster recovery plan documented
- Runbooks for common issues
- On-call rotation established

## Lessons Learned

### What Worked Well
✅ PostgreSQL RLS for tenant isolation - elegant and performant
✅ Svix for webhook reliability - saved weeks of development
✅ Clerk for authentication - great developer experience
✅ BullMQ for background jobs - reliable and feature-rich
✅ PostHog for product analytics - self-hosted option valuable

### Challenges Overcome
- **Tenant resolution complexity** → Standardized on subdomain + API key fallback
- **Database connection pooling** → Implemented per-tenant pool limits
- **Usage tracking accuracy** → Batched Stripe reporting, Redis for real-time
- **Webhook delivery reliability** → Delegated to Svix instead of building custom
- **Multi-tenant testing** → Created test fixtures with multiple tenant contexts

### Best Practices Applied
- Tenant isolation at database level (RLS)
- API rate limiting per tenant tier
- Background job processing for heavy operations
- Comprehensive audit logging
- Feature flags per tenant for gradual rollouts
- Automated usage-based billing
- Webhook signature verification
- Multi-tenant monitoring and alerting

## Repository Structure

```
saas-platform/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # Auth pages
│   │   │   ├── (dashboard)/    # Tenant dashboard
│   │   │   └── (admin)/        # Admin panel
│   │   ├── components/
│   │   ├── lib/
│   │   │   ├── auth.ts         # Clerk integration
│   │   │   ├── api.ts          # API client
│   │   │   └── analytics.ts    # PostHog tracking
│   │   └── hooks/
│   └── tests/
├── backend/                     # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── tenants/        # Tenant management
│   │   │   ├── subscriptions/  # Billing
│   │   │   ├── webhooks/       # Webhook system
│   │   │   ├── usage/          # Usage tracking
│   │   │   └── projects/       # Core features
│   │   ├── middleware/
│   │   │   ├── tenant.middleware.ts
│   │   │   └── usage-tracking.middleware.ts
│   │   └── guards/
│   │       └── tenant-scope.guard.ts
│   └── test/
├── infrastructure/              # K8s & Terraform
│   ├── kubernetes/
│   ├── terraform/
│   └── docker/
└── docs/                        # Documentation
    ├── architecture.md
    ├── multi-tenancy.md
    ├── api.md
    └── deployment.md
```

## Timeline Summary

- **Day 1-3**: Foundation & Authentication
- **Day 4-5**: Multi-tenant database design
- **Day 6-8**: Subscription & billing integration
- **Day 9-14**: Core features (dashboard, API, onboarding)
- **Day 15-16**: Webhooks & integrations
- **Day 17-18**: Analytics & reporting
- **Day 19-20**: Security hardening
- **Day 21-22**: Performance & scale optimization
- **Day 23-25**: Deployment & monitoring

**Total**: 25 days from zero to production

## Success Metrics

📈 **After 60 Days**:
- 500+ tenants onboarded
- $50,000+ MRR
- 5,000,000+ API calls processed
- 99.9% uptime
- < 150ms average response time
- Zero tenant data isolation incidents
- 99%+ webhook delivery success rate
- 15% free-to-paid conversion rate
- < 3% monthly churn rate

## Cost Breakdown

**Infrastructure** (~$3,000/month for 500 tenants):
- Kubernetes cluster: $1,200/month
- PostgreSQL (managed): $800/month
- Redis (managed): $300/month
- S3 storage: $200/month
- CDN: $300/month
- Monitoring: $200/month

**SaaS Services** (~$1,500/month):
- Clerk (auth): $500/month
- Stripe (payments): 2.9% + $0.30 per transaction
- Svix (webhooks): $300/month
- PostHog (analytics): $200/month
- Sentry (error tracking): $100/month
- Resend (email): $100/month

**Per-Tenant Margin**:
- Average plan: $50/month
- Infrastructure cost: ~$6/tenant/month
- SaaS services: ~$3/tenant/month
- **Gross margin**: ~82%

---

**Status**: Production Ready ✅
**Timeline**: 25 days
**Team**: 1 developer + Claude Code agents
**Tech Stack**: Next.js, NestJS, PostgreSQL, Clerk, Stripe, Svix, PostHog
**Architecture**: Multi-tenant SaaS with row-level security
