---
skill_name: Caching Expert
description: Caching strategies for static, object, HTTP, and CDN cache with implementation patterns
category: Performance
priority: P1
agent: redis-expert
---

# Caching Expert Skill

Comprehensive guide to caching strategies covering static cache, object cache, HTTP cache, and CDN cache with implementation patterns and best practices.

## Overview

Caching is essential for performance optimization, reducing latency, minimizing database load, and improving scalability. This guide covers four major caching types and their expert-level implementations.


## 📦 Installation

Copy this skill to your Claude Code skills directory:

```bash
# Global installation (available to all projects)
mkdir -p ~/.claude/skills/caching-expert
cp caching-expert.md ~/.claude/skills/caching-expert/SKILL.md

# Or project-specific installation
mkdir -p .claude/skills/caching-expert
cp caching-expert.md .claude/skills/caching-expert/SKILL.md
```

The skill will be automatically detected and hot-reloaded by Claude Code.

**Usage**: Once installed, Claude Code will use this skill automatically when relevant to your requests.

## 1. Static Cache

### Overview
Static caching stores compiled, generated, or preprocessed files that don't change frequently.

### Use Cases
- Compiled templates
- Generated HTML pages
- Preprocessed assets
- Build artifacts

### Implementation Patterns

**File-Based Static Cache**:
```php
// PHP static cache example
class StaticCache {
    private $cache_dir = '/var/cache/pages/';

    public function get(string $key): ?string {
        $file = $this->cache_dir . md5($key) . '.html';

        if (file_exists($file) && (time() - filemtime($file)) < 3600) {
            return file_get_contents($file);
        }

        return null;
    }

    public function set(string $key, string $content): void {
        $file = $this->cache_dir . md5($key) . '.html';
        file_put_contents($file, $content, LOCK_EX);
    }

    public function invalidate(string $key): void {
        $file = $this->cache_dir . md5($key) . '.html';
        if (file_exists($file)) {
            unlink($file);
        }
    }
}

// Usage
$cache = new StaticCache();

if ($html = $cache->get('/products/123')) {
    echo $html;
} else {
    $html = generateProductPage(123);
    $cache->set('/products/123', $html);
    echo $html;
}
```

**Static Site Generation**:
```javascript
// Next.js static generation
export async function getStaticProps({ params }) {
  const data = await fetchData(params.id);

  return {
    props: { data },
    revalidate: 3600 // Regenerate every hour
  };
}

export async function getStaticPaths() {
  const items = await fetchAllItems();

  return {
    paths: items.map(item => ({ params: { id: item.id } })),
    fallback: 'blocking'
  };
}
```

### Best Practices
- Pre-generate during build time when possible
- Implement cache warming strategies
- Use versioned URLs for cache busting
- Monitor cache hit rates

## 2. Object Cache

### Overview
Object caching stores serialized data structures, query results, and computed values in memory for fast retrieval.

### Technologies
- Redis
- Memcached
- In-memory caches (Node.js, Python)

### Implementation Patterns

**Redis Object Cache**:
```javascript
// Node.js Redis object cache
const redis = require('redis');
const client = redis.createClient();

class ObjectCache {
    async get(key) {
        const cached = await client.get(key);
        return cached ? JSON.parse(cached) : null;
    }

    async set(key, value, ttl = 3600) {
        await client.setEx(key, ttl, JSON.stringify(value));
    }

    async delete(key) {
        await client.del(key);
    }

    async remember(key, ttl, callback) {
        let value = await this.get(key);

        if (value === null) {
            value = await callback();
            await this.set(key, value, ttl);
        }

        return value;
    }
}

// Usage
const cache = new ObjectCache();

const user = await cache.remember(`user:${userId}`, 3600, async () => {
    return await database.users.findById(userId);
});
```

**Laravel Cache Facade**:
```php
// Laravel object caching
use Illuminate\Support\Facades\Cache;

// Store
Cache::put('key', 'value', $seconds);
Cache::put('key', 'value', now()->addMinutes(10));

// Retrieve
$value = Cache::get('key');
$value = Cache::get('key', 'default');

// Remember pattern
$users = Cache::remember('users.all', 3600, function () {
    return User::all();
});

// Tags (for group invalidation)
Cache::tags(['users', 'active'])->put('user:1', $user, 3600);
Cache::tags(['users'])->flush(); // Invalidate all user caches
```

**Python Dictionary Cache**:
```python
# Python in-memory cache with TTL
import time
from threading import Lock
from functools import wraps

class ObjectCache:
    def __init__(self):
        self._cache = {}
        self._lock = Lock()

    def get(self, key):
        with self._lock:
            if key in self._cache:
                value, expiry = self._cache[key]
                if time.time() < expiry:
                    return value
                del self._cache[key]
        return None

    def set(self, key, value, ttl=3600):
        with self._lock:
            self._cache[key] = (value, time.time() + ttl)

    def delete(self, key):
        with self._lock:
            self._cache.pop(key, None)

    def cache_result(self, ttl=3600):
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                cache_key = f"{func.__name__}:{args}:{kwargs}"
                result = self.get(cache_key)

                if result is None:
                    result = func(*args, **kwargs)
                    self.set(cache_key, result, ttl)

                return result
            return wrapper
        return decorator

# Usage
cache = ObjectCache()

@cache.cache_result(ttl=3600)
def get_expensive_data(user_id):
    return database.query(user_id)
```

### Best Practices
- Set appropriate TTL values
- Implement cache invalidation strategies
- Use cache warming for critical data
- Monitor memory usage
- Implement cache stampede prevention

## 3. HTTP Cache

### Overview
HTTP caching leverages browser and proxy caches using HTTP headers to reduce server load and improve response times.

### Cache-Control Headers

**Server-Side Implementation**:
```javascript
// Express.js HTTP caching
app.get('/api/products', (req, res) => {
    // Public cache for 1 hour
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('ETag', generateETag(products));
    res.json(products);
});

app.get('/api/user/profile', auth, (req, res) => {
    // Private cache (user-specific)
    res.set('Cache-Control', 'private, max-age=300');
    res.json(userProfile);
});

app.get('/api/real-time-data', (req, res) => {
    // No caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(realtimeData);
});
```

**ETag Validation**:
```javascript
function generateETag(data) {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

app.get('/api/data', (req, res) => {
    const data = getData();
    const etag = generateETag(data);

    // Check if client has current version
    if (req.headers['if-none-match'] === etag) {
        return res.status(304).end(); // Not Modified
    }

    res.set('ETag', etag);
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(data);
});
```

**Conditional Requests (Last-Modified)**:
```javascript
app.get('/api/articles/:id', (req, res) => {
    const article = getArticle(req.params.id);
    const lastModified = new Date(article.updatedAt);

    const ifModifiedSince = req.headers['if-modified-since'];
    if (ifModifiedSince && new Date(ifModifiedSince) >= lastModified) {
        return res.status(304).end();
    }

    res.set('Last-Modified', lastModified.toUTCString());
    res.set('Cache-Control', 'public, max-age=600');
    res.json(article);
});
```

**Nginx HTTP Cache**:
```nginx
# nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;

server {
    location /api/ {
        proxy_cache my_cache;
        proxy_cache_key "$scheme$request_method$host$request_uri";
        proxy_cache_valid 200 302 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_bypass $http_pragma $http_authorization;
        add_header X-Cache-Status $upstream_cache_status;

        proxy_pass http://backend;
    }
}
```

### Best Practices
- Use appropriate Cache-Control directives
- Implement ETags for validation
- Leverage browser caching
- Use versioned URLs for assets
- Implement cache invalidation

## 4. CDN Cache

### Overview
Content Delivery Network caching distributes content across global edge servers for minimal latency and high availability.

### Implementation Patterns

**CloudFront Configuration**:
```javascript
// AWS CloudFront distribution
const distribution = {
    Origins: [{
        Id: 'myOrigin',
        DomainName: 'origin.example.com',
        CustomOriginConfig: {
            HTTPPort: 80,
            HTTPSPort: 443,
            OriginProtocolPolicy: 'https-only'
        }
    }],
    DefaultCacheBehavior: {
        TargetOriginId: 'myOrigin',
        ViewerProtocolPolicy: 'redirect-to-https',
        AllowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        CachedMethods: ['GET', 'HEAD'],
        ForwardedValues: {
            QueryString: true,
            Cookies: { Forward: 'none' },
            Headers: ['Origin', 'Access-Control-Request-Method']
        },
        MinTTL: 0,
        DefaultTTL: 86400,
        MaxTTL: 31536000,
        Compress: true
    }
};
```

**Cache Invalidation**:
```javascript
// CloudFront cache invalidation
const AWS = require('aws-sdk');
const cloudfront = new AWS.CloudFront();

async function invalidateCache(distributionId, paths) {
    const params = {
        DistributionId: distributionId,
        InvalidationBatch: {
            CallerReference: Date.now().toString(),
            Paths: {
                Quantity: paths.length,
                Items: paths
            }
        }
    };

    return await cloudfront.createInvalidation(params).promise();
}

// Usage
await invalidateCache('E1234567890ABC', ['/images/*', '/css/*']);
```

**Cache-Control for CDN**:
```javascript
// Set headers for CDN caching
app.use('/static', express.static('public', {
    maxAge: '1y', // Browser cache
    immutable: true,
    setHeaders: (res, path) => {
        // CDN cache
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('CDN-Cache-Control', 'max-age=31536000');
    }
}));
```

**Cloudflare Page Rules**:
```javascript
// Cloudflare Workers for cache control
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);

    // Cache static assets aggressively
    if (url.pathname.match(/\.(jpg|png|css|js)$/)) {
        const cache = caches.default;
        let response = await cache.match(request);

        if (!response) {
            response = await fetch(request);
            const headers = new Headers(response.headers);
            headers.set('Cache-Control', 'public, max-age=31536000');

            response = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers
            });

            event.waitUntil(cache.put(request, response.clone()));
        }

        return response;
    }

    return fetch(request);
}
```

### Best Practices
- Use versioned URLs (e.g., `/assets/style.v123.css`)
- Set long cache times for immutable assets
- Implement cache warming
- Use geographic routing
- Monitor cache hit ratios
- Implement purge strategies

## Combined Caching Strategy

**Multi-Layer Cache Architecture**:
```
Request Flow:
1. Browser Cache (HTTP Cache)
2. CDN Edge Cache
3. Application Object Cache (Redis)
4. Static File Cache
5. Database
```

**Implementation Example**:
```javascript
// Multi-layer caching middleware
class CacheManager {
    constructor() {
        this.redis = new Redis();
        this.staticCache = new StaticCache();
    }

    async get(key) {
        // Try object cache first
        let data = await this.redis.get(key);
        if (data) return JSON.parse(data);

        // Try static cache
        data = this.staticCache.get(key);
        if (data) {
            // Populate object cache
            await this.redis.setEx(key, 3600, JSON.stringify(data));
            return data;
        }

        return null;
    }

    async set(key, data, ttl = 3600) {
        // Set in both caches
        await this.redis.setEx(key, ttl, JSON.stringify(data));
        this.staticCache.set(key, data);
    }

    async invalidate(key) {
        await this.redis.del(key);
        this.staticCache.invalidate(key);
        // Trigger CDN invalidation if needed
    }
}
```

## Monitoring and Metrics

**Key Metrics to Track**:
- Cache hit rate
- Cache miss rate
- Average response time (cached vs uncached)
- Memory usage
- Eviction rate
- CDN bandwidth savings

**Implementation**:
```javascript
class CacheMetrics {
    constructor() {
        this.hits = 0;
        this.misses = 0;
    }

    recordHit() {
        this.hits++;
    }

    recordMiss() {
        this.misses++;
    }

    getHitRate() {
        const total = this.hits + this.misses;
        return total > 0 ? (this.hits / total) * 100 : 0;
    }

    report() {
        return {
            hits: this.hits,
            misses: this.misses,
            hit_rate: this.getHitRate().toFixed(2) + '%'
        };
    }
}
```

## Related Resources

- **Redis Expert**: `agents/domain-experts/redis-expert.md`
- **Database Patterns**: `skills/database-design-patterns.md`
- **Performance Optimization**: `skills/performance-optimization.md`

---

**Version**: 1.0.0
**Last Updated**: 2026-01-10
**Status**: Production Ready ✅

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** MIT

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 9 MCP servers, and comprehensive guides.
