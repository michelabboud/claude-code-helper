# API Specialist MCP Server

Comprehensive API testing, validation, security auditing, and improvement suggestion tool for REST, GraphQL, and gRPC APIs.

---

## 🎯 Features

### 8 Specialized Tools

| Tool | Purpose | Key Features |
|------|---------|--------------|
| **validate_openapi** | Validate OpenAPI specs | Structure checks, required fields, best practices |
| **test_endpoint** | Make HTTP requests | All methods, auth (Bearer/Basic/API Key), headers, body |
| **check_api_security** | Security audit | HTTPS, CORS, headers, auth, rate limiting, injections |
| **analyze_api_structure** | Design analysis | REST naming, HTTP methods, status codes, versioning |
| **load_test** | Performance testing | Concurrent requests, response times, percentiles |
| **generate_api_docs** | Auto-generate docs | Markdown, HTML, Postman collections |
| **suggest_improvements** | Get recommendations | Performance, security, design, documentation |
| **validate_api_response** | Schema validation | JSON schema matching, type checking, strict mode |

---

## 📦 Installation

```bash
cd api-specialist-mcp
npm install
npm run build
```

**Verify:**
```bash
npm run inspector
```

---

## ⚙️ Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "api-specialist": {
      "command": "node",
      "args": ["/absolute/path/to/api-specialist-mcp/build/index.js"]
    }
  }
}
```

### Claude Code

Add to `.claude-code/config.json`:

```json
{
  "mcp_servers": [
    {
      "name": "api-specialist",
      "command": "node",
      "args": ["/absolute/path/to/api-specialist-mcp/build/index.js"]
    }
  ]
}
```

---

## 🚀 Usage Examples

### 1. Validate OpenAPI Specification

```javascript
{
  "tool": "validate_openapi",
  "args": {
    "specPath": "./openapi.json",
    "version": "3.0",
    "strict": true
  }
}
```

**Checks:**
- Required fields (info, paths, openapi version)
- Path formatting (must start with /)
- Response definitions
- Schema completeness
- Best practice violations

**Output:**
```json
{
  "valid": true,
  "version": "3.0.0",
  "errors": [],
  "warnings": [
    {
      "severity": "warning",
      "message": "GET /users missing description"
    }
  ],
  "stats": {
    "paths": 15,
    "operations": 42,
    "schemas": 18
  }
}
```

---

### 2. Test API Endpoints

```javascript
// GET request
{
  "tool": "test_endpoint",
  "args": {
    "url": "https://api.example.com/users/123",
    "method": "GET",
    "auth": {
      "type": "bearer",
      "token": "your-token-here"
    }
  }
}

// POST request
{
  "tool": "test_endpoint",
  "args": {
    "url": "https://api.example.com/users",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"name\": \"John\", \"email\": \"john@example.com\"}",
    "auth": {
      "type": "apikey",
      "apikey": "your-key",
      "header": "X-API-Key"
    }
  }
}
```

**Authentication types:**
- **Bearer Token:** OAuth 2.0, JWT
- **Basic Auth:** Username + Password
- **API Key:** Custom header (default: X-API-Key)

**Output:**
```json
{
  "success": true,
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json",
    "cache-control": "max-age=3600"
  },
  "body": {
    "id": 123,
    "name": "John",
    "email": "john@example.com"
  },
  "responseTime": "245ms",
  "size": 156
}
```

---

### 3. Security Audit

```javascript
{
  "tool": "check_api_security",
  "args": {
    "apiUrl": "https://api.example.com",
    "endpoints": ["/users", "/auth/login"],
    "checks": [
      "https",
      "cors",
      "headers",
      "authentication",
      "rate_limiting",
      "sql_injection"
    ]
  }
}
```

**Security Checks:**
- ✅ HTTPS enforcement
- ✅ CORS configuration
- ✅ Security headers (HSTS, CSP, X-Frame-Options)
- ✅ Authentication requirement
- ✅ Rate limiting
- ✅ SQL injection vulnerabilities
- ✅ XSS protection

**Output:**
```json
{
  "summary": {
    "critical": 0,
    "high": 1,
    "medium": 3
  },
  "issues": [
    {
      "severity": "high",
      "check": "cors",
      "message": "CORS allows all origins (*)",
      "recommendation": "Restrict CORS to specific domains"
    }
  ],
  "warnings": [
    {
      "severity": "medium",
      "check": "security_headers",
      "message": "Missing Strict-Transport-Security header"
    }
  ]
}
```

---

### 4. Analyze API Structure

```javascript
{
  "tool": "analyze_api_structure",
  "args": {
    "specPath": "./openapi.json",
    "framework": "rest",
    "standards": [
      "rest_naming",
      "http_methods",
      "status_codes",
      "versioning"
    ]
  }
}
```

**Checks:**
- REST naming conventions (plural nouns, no verbs)
- Proper HTTP method usage
- Correct status codes (201 for POST, 204 for DELETE)
- API versioning
- Resource hierarchy

**Output:**
```json
{
  "framework": "rest",
  "totalPaths": 15,
  "issues": [
    {
      "severity": "high",
      "path": "/getUser/{id}",
      "message": "Path contains verb 'get'",
      "suggestion": "Use /users/{id} with GET method"
    }
  ],
  "score": 78
}
```

---

### 5. Load Testing

```javascript
{
  "tool": "load_test",
  "args": {
    "url": "https://api.example.com/users",
    "method": "GET",
    "duration": 30,
    "concurrency": 10,
    "headers": {
      "Authorization": "Bearer token"
    }
  }
}
```

**Metrics:**
- Requests per second
- Response times (min/max/avg)
- Percentiles (p50, p95, p99)
- Success/failure rates
- Error details

**Output:**
```json
{
  "duration": "30s",
  "concurrency": 10,
  "totalRequests": 3542,
  "successful": 3540,
  "failed": 2,
  "requestsPerSecond": "118.07",
  "responseTimes": {
    "min": 45,
    "max": 892,
    "avg": "84.23",
    "p50": 78,
    "p95": 156,
    "p99": 234
  }
}
```

---

### 6. Generate Documentation

```javascript
{
  "tool": "generate_api_docs",
  "args": {
    "specPath": "./openapi.json",
    "format": "markdown",
    "includeExamples": true
  }
}
```

**Formats:**
- **Markdown:** GitHub/GitLab compatible
- **HTML:** Standalone documentation page
- **Postman:** Import into Postman

**Output:** Complete formatted documentation

---

### 7. Improvement Suggestions

```javascript
{
  "tool": "suggest_improvements",
  "args": {
    "specPath": "./openapi.json",
    "focusAreas": [
      "performance",
      "security",
      "design"
    ]
  }
}
```

**Categories:**
- **Performance:** Caching, pagination, field filtering
- **Security:** Rate limiting, validation, API keys
- **Design:** Versioning, HATEOAS, filtering
- **Documentation:** Examples, interactive docs
- **Error Handling:** Standard format, error codes

**Output:**
```json
{
  "totalSuggestions": 8,
  "critical": 1,
  "high": 3,
  "medium": 4,
  "improvements": [
    {
      "category": "security",
      "priority": "critical",
      "suggestion": "Implement rate limiting",
      "impact": "Prevent abuse and DDoS attacks",
      "implementation": "Use rate limiting middleware"
    }
  ]
}
```

---

### 8. Validate Responses

```javascript
{
  "tool": "validate_api_response",
  "args": {
    "response": "{\"id\": 123, \"name\": \"John\"}",
    "schema": "{\"type\": \"object\", \"properties\": {\"id\": {\"type\": \"number\"}, \"name\": {\"type\": \"string\"}}, \"required\": [\"id\", \"name\"]}",
    "strict": true
  }
}
```

**Validates:**
- Data types
- Required fields
- Object structure
- Extra fields (strict mode)

---

## 💬 Common Prompts

### Complete API Audit
```
"Audit my API at https://api.myapp.com:
1. Validate the OpenAPI spec at ./openapi.json
2. Test all endpoints
3. Run security checks
4. Analyze structure
5. Suggest improvements
Provide a comprehensive report"
```

### Security Review
```
"Run a security audit on https://api.myapp.com:
- Check HTTPS, CORS, headers
- Test authentication
- Check for SQL injection
- Verify rate limiting
Report all critical and high-severity issues"
```

### Performance Testing
```
"Load test https://api.myapp.com/users:
- 60 seconds duration
- 50 concurrent users
- Report p95 and p99 response times
- Identify bottlenecks"
```

### API Design Review
```
"Review my API design in ./openapi.json:
- Check REST naming conventions
- Verify HTTP methods usage
- Validate status codes
- Check for versioning
Score the API design"
```

---

## 🤖 Agent Configuration

Create `api-specialist-agent.json`:

```json
{
  "name": "api-specialist",
  "description": "API expert for testing, validation, and security",
  "instructions": "You are an API architecture expert. Use api-specialist-mcp tools to:\n\n1. Validate OpenAPI specs for correctness\n2. Test endpoints with proper authentication\n3. Audit security (HTTPS, CORS, headers, auth)\n4. Analyze API structure against REST best practices\n5. Load test for performance metrics\n6. Generate comprehensive documentation\n7. Suggest improvements prioritized by impact\n\nAlways:\n- Check security first (critical priority)\n- Validate against industry standards\n- Provide specific, actionable recommendations\n- Include examples in suggestions",
  "mcp_servers": ["api-specialist"],
  "temperature": 0.3
}
```

---

## 🎯 Use Cases

### Pre-Deployment Checklist
1. Validate OpenAPI spec
2. Security audit (all checks)
3. Load test critical endpoints
4. Verify error handling
5. Check documentation completeness

### API Migration
1. Analyze current structure
2. Suggest improvements
3. Validate new spec
4. Test endpoint compatibility
5. Generate migration docs

### Security Hardening
1. Run comprehensive security checks
2. Test authentication flows
3. Verify HTTPS enforcement
4. Check rate limiting
5. Test for injections

### Performance Optimization
1. Load test all endpoints
2. Identify slow responses
3. Check for caching opportunities
4. Suggest pagination
5. Recommend field filtering

---

## 🔧 Best Practices

### Testing Strategy
1. **Start with validation:** Validate spec before testing
2. **Security first:** Run security checks early
3. **Test incrementally:** One endpoint at a time
4. **Load test realistically:** Match production traffic
5. **Document findings:** Generate docs after changes

### Security Scanning
- Always check HTTPS
- Verify authentication on all endpoints
- Test CORS configuration
- Check security headers
- Scan for injections
- Verify rate limiting

### Performance Testing
- Warm up API before load testing
- Test at various concurrency levels
- Monitor p95 and p99 percentiles
- Test with realistic payloads
- Consider network latency

---

## 📊 Integration Examples

### CI/CD Pipeline

```yaml
# .github/workflows/api-validation.yml
- name: Validate API
  run: |
    claude-code --agent api-specialist \
      --prompt "Validate ./openapi.json and report any errors"

- name: Security Scan
  run: |
    claude-code --agent api-specialist \
      --prompt "Security audit https://staging-api.myapp.com"

- name: Load Test
  run: |
    claude-code --agent api-specialist \
      --prompt "Load test /api/users for 30s with 20 concurrent users"
```

### Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

if [[ $(git diff --cached --name-only | grep openapi.json) ]]; then
  echo "Validating OpenAPI spec..."
  claude-code --agent api-specialist \
    --prompt "Validate ./openapi.json" \
    --auto-approve
  
  if [ $? -ne 0 ]; then
    echo "❌ OpenAPI validation failed"
    exit 1
  fi
fi
```

---

## 🛠️ Dependencies

**Required:**
- Node.js 18+ (fetch API)
- OpenAPI specification file (JSON format)

**Optional:**
- YAML parser for .yaml specs: `npm install js-yaml`

---

## 📝 OpenAPI Spec Format

Example minimal spec:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "My API",
    "version": "1.0.0"
  },
  "paths": {
    "/users": {
      "get": {
        "summary": "List users",
        "responses": {
          "200": {
            "description": "Success"
          }
        }
      }
    }
  }
}
```

---

## 🚨 Limitations

- YAML specs require js-yaml package
- Load testing limited by single machine resources
- SQL injection checks are basic (not a replacement for dedicated tools)
- Certificate validation follows Node.js defaults

---

## 🤝 Integration with Other MCPs

Works great with:
- **Code Review MCP:** Security scanning code
- **Testing MCP:** Integration tests
- **Design System MCP:** API response formatting

---

Happy API testing! 🚀

---

## 👤 Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)

This project is open source under the MIT License. Free to use for personal and commercial projects.
