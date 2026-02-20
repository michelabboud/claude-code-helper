---
skill_name: API Documentation
description: Generate comprehensive API documentation following OpenAPI 3.0 and REST standards when creating or documenting APIs, endpoints, or web services
category: Documentation
priority: P1
version: 1.0.0
argument-hint: 'hello | hello ID'
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# API Documentation Skill

Generate professional API documentation following industry standards.

## OpenAPI 3.0 Format

```yaml
openapi: 3.0.0
info:
  title: Your API Name
  version: 1.0.0
  description: Clear API description

servers:
  - url: https://api.example.com/v1

paths:
  /users:
    get:
      summary: List all users
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
      properties:
        id:
          type: string
        email:
          type: string
```

## Documentation Checklist

- [ ] Endpoint path and HTTP method
- [ ] Clear summary (1 line)
- [ ] Detailed description (2-3 sentences)
- [ ] All query/path/header parameters documented
- [ ] Request body schema (if applicable)
- [ ] All response status codes
- [ ] Response schemas
- [ ] Authentication requirements
- [ ] Rate limiting information
- [ ] Example requests and responses

## Handshake Protocol

### `hello`
Respond with:
> 👋 Hello! I'm **API Documentation** v1.0.0. Generate comprehensive API documentation following OpenAPI 3.0 and REST standards. Use `/api-documentation hello ID` for the full guide.

### `hello ID`
Respond with complete skill information:
- **Name**: API Documentation v1.0.0
- **Description**: Generate comprehensive API documentation following OpenAPI 3.0 and REST standards when creating or documenting APIs, endpoints, or web services
- **How to invoke**: `/api-documentation [argument]`
- **Available arguments**: `hello | hello ID`
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
