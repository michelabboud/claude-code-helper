# API Specialist MCP - Quick Start Guide

Get started with the API Specialist MCP in 10 minutes!

---

## 🚀 Installation

```bash
cd api-specialist-mcp
npm install
npm run build

# Test it
npm run inspector
```

**Configure Claude Desktop:**

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

Restart Claude Desktop, then ask: *"What API tools do you have?"*

---

## 📝 Quick Examples

### Example 1: Test a Public API

```
"Test the GitHub API users endpoint:
- URL: https://api.github.com/users/octocat
- Method: GET
- Show me the response"
```

**What happens:**
- Uses `test_endpoint` tool
- Makes GET request
- Returns status, headers, body, and timing

---

### Example 2: Security Audit

```
"Run a security audit on https://api.github.com:
- Check HTTPS
- Check CORS
- Check security headers
- Check authentication
Report any issues"
```

**What happens:**
- Uses `check_api_security` tool
- Tests multiple security vectors
- Reports critical/high/medium issues

---

### Example 3: Validate OpenAPI Spec

Create a sample `openapi.json`:

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
          "200": { "description": "Success" }
        }
      }
    }
  }
}
```

Then ask:

```
"Validate the OpenAPI spec at ./openapi.json in strict mode"
```

**What happens:**
- Uses `validate_openapi` tool
- Checks structure and completeness
- Reports errors and warnings

---

### Example 4: Load Test

```
"Load test https://httpbin.org/get:
- Duration: 10 seconds
- Concurrency: 5 users
- Report performance metrics"
```

**What happens:**
- Uses `load_test` tool
- Simulates 5 concurrent users for 10 seconds
- Reports requests/second, response times (p50/p95/p99)

---

### Example 5: Generate Documentation

```
"Generate Markdown documentation from ./openapi.json with examples"
```

**What happens:**
- Uses `generate_api_docs` tool
- Creates formatted documentation
- Includes all endpoints and parameters

---

### Example 6: Get Improvement Suggestions

```
"Analyze ./openapi.json and suggest improvements focusing on:
- Security
- Performance
- Design"
```

**What happens:**
- Uses `suggest_improvements` tool
- Provides prioritized recommendations
- Includes implementation guidance

---

## 🎯 Real-World Workflow

### Complete API Review

```
"Complete API review for my service:

1. Base URL: https://api.myapp.com
2. OpenAPI spec: ./openapi.json

Please:
- Validate the spec
- Test the /users endpoint (GET) with bearer token: abc123
- Run a security audit
- Load test /users for 30 seconds with 10 concurrent users
- Suggest improvements
- Generate Markdown documentation

Provide a comprehensive report with:
- Security score
- Performance metrics
- Design recommendations"
```

**This single prompt will:**
1. Validate OpenAPI spec structure
2. Test endpoint functionality
3. Check security (HTTPS, CORS, headers, auth)
4. Measure performance under load
5. Provide improvement suggestions
6. Generate complete documentation

---

## 🔧 Testing Different Auth Types

### Bearer Token (OAuth 2.0/JWT)

```
"Test POST https://api.myapp.com/data with bearer token:
- Token: eyJhbGciOiJIUzI1NiIs...
- Body: {\"name\": \"test\"}
- Content-Type: application/json"
```

### API Key

```
"Test GET https://api.myapp.com/users with API key:
- API Key: sk_live_abc123xyz
- Header name: X-API-Key"
```

### Basic Auth

```
"Test GET https://api.myapp.com/admin with basic auth:
- Username: admin
- Password: secret123"
```

---

## 📊 Understanding Results

### Security Audit Output

```json
{
  "summary": {
    "critical": 1,   // 🔴 Fix immediately
    "high": 2,       // 🟠 Fix ASAP
    "medium": 3      // 🟡 Should fix
  },
  "issues": [
    {
      "severity": "critical",
      "check": "https",
      "message": "API does not use HTTPS",
      "recommendation": "Enable HTTPS/TLS"
    }
  ]
}
```

**Priority:**
- **Critical:** Security vulnerabilities, fix immediately
- **High:** Important issues, fix this week
- **Medium:** Improvements, fix this sprint
- **Low:** Nice to have

---

### Load Test Output

```json
{
  "requestsPerSecond": "118.07",  // Higher is better
  "responseTimes": {
    "avg": "84.23",   // Average response time
    "p50": 78,        // 50% under this
    "p95": 156,       // 95% under this (target < 500ms)
    "p99": 234        // 99% under this
  }
}
```

**Good Targets:**
- p95 < 500ms: Good
- p95 < 200ms: Excellent
- p95 > 1000ms: Needs optimization

---

## 🎓 Best Practices

### 1. Always Start with Security

```
"Security audit first:
1. Check HTTPS
2. Verify authentication
3. Test CORS
4. Check security headers
Then test functionality"
```

### 2. Validate Before Testing

```
"Validate the spec, then test endpoints"
```

### 3. Test Realistic Scenarios

```
"Test the user registration flow:
1. POST /auth/register
2. POST /auth/login
3. GET /users/me
With realistic data and proper headers"
```

### 4. Load Test Incrementally

```
"Load test with increasing load:
- First: 5 users for 10 seconds
- Then: 10 users for 30 seconds  
- Finally: 20 users for 60 seconds"
```

---

## 💡 Pro Tips

### Combine Multiple Checks

```
"Quick API health check:
1. Validate spec
2. Security audit
3. Test 3 main endpoints
4. 10-second load test
Report pass/fail for each"
```

### Use for CI/CD

```bash
# Pre-deployment check
claude-code --agent api-specialist \
  --prompt "Validate ./openapi.json and report any critical issues" \
  --auto-approve
```

### Monitor APIs

```
"Daily API check:
- Test all endpoints
- Check response times
- Verify auth still works
- Alert if anything fails"
```

---

## 🐛 Troubleshooting

### Tool not found

Make sure API Specialist MCP is in your config:
```bash
ls /path/to/api-specialist-mcp/build/index.js
```

### Request timeout

Increase timeout:
```
"Test with 30 second timeout"
```

### Authentication failing

Double-check token format:
- Bearer: Full token (without "Bearer " prefix)
- Basic: Username and password
- API Key: Key and header name

---

## 🎉 Next Steps

**Try these:**
1. Test a public API (GitHub, JSONPlaceholder)
2. Validate your own OpenAPI spec
3. Run security audit on your API
4. Load test an endpoint
5. Generate documentation

**Read more:**
- Full README: `api-specialist-mcp/README.md`
- Agent config: `example-agents/api-specialist.json`

---

**Ready to audit APIs!** 🔌
