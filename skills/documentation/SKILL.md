---
skill_name: Documentation
description: Add comprehensive documentation including JSDoc/TSDoc, inline comments, README updates, and OpenAPI 3.0 API docs. Use when documenting code, generating docs, improving project documentation, adding docstrings, writing README files, creating API specifications, generating changelogs, or writing architecture decision records. Triggers on 'add docs', 'document this', 'write README', 'API spec', 'add docstrings', 'generate documentation'.
category: Documentation
priority: P1
argument-hint: '[target] | api | hello | hello ID'
allowed-tools: Read, Write, Edit, Grep, Glob
agent: documentation-expert
version: 1.2.0
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Documentation Skill

Systematic approach to adding comprehensive, maintainable documentation to any codebase.

## Usage

```
/documentation src/utils/helpers.ts
/documentation src/services/
/documentation                     # Document current changes
/documentation api                 # Generate OpenAPI 3.0 API docs
```

## Workflow

1. **Analyze** - Read the target code and understand its purpose, inputs, outputs, and edge cases
2. **Identify Gaps** - Find undocumented functions, missing parameter descriptions, absent README sections
3. **Generate** - Write documentation following the conventions below
4. **Verify** - Ensure all public APIs, exported functions, and complex logic are documented

## Documentation Types

### JSDoc / TSDoc (TypeScript/JavaScript)

```typescript
/**
 * Calculates the weighted average score across all expert dimensions.
 *
 * @param experts - Map of expert key to score data
 * @param weights - Optional weight overrides per expert (default: equal weight)
 * @returns Weighted average rounded to 1 decimal place
 * @throws {ValidationError} If any score is outside 0-10 range
 *
 * @example
 * ```ts
 * const score = calculateOverallScore(experts);
 * // => 7.6
 * ```
 */
export function calculateOverallScore(
  experts: Record<string, ExpertData>,
  weights?: Record<string, number>
): number {
```

### Python Docstrings

```python
def calculate_overall_score(experts: dict, weights: dict | None = None) -> float:
    """Calculate the weighted average score across all expert dimensions.

    Args:
        experts: Map of expert key to score data.
        weights: Optional weight overrides per expert. Defaults to equal weight.

    Returns:
        Weighted average rounded to 1 decimal place.

    Raises:
        ValidationError: If any score is outside 0-10 range.

    Example:
        >>> score = calculate_overall_score(experts)
        >>> print(score)
        7.6
    """
```

### Go Doc Comments

```go
// CalculateOverallScore calculates the weighted average score across all expert dimensions.
//
// If weights is nil, all experts are weighted equally. Returns the weighted average
// rounded to 1 decimal place. Returns an error if any score is outside the 0-10 range.
func CalculateOverallScore(experts map[string]ExpertData, weights map[string]float64) (float64, error) {
```

### Rust Doc Comments

```rust
/// Calculates the weighted average score across all expert dimensions.
///
/// # Arguments
/// * `experts` - Map of expert key to score data
/// * `weights` - Optional weight overrides per expert (default: equal weight)
///
/// # Returns
/// Weighted average rounded to 1 decimal place
///
/// # Errors
/// Returns `ValidationError` if any score is outside 0-10 range
///
/// # Examples
/// ```
/// let score = calculate_overall_score(&experts, None)?;
/// assert_eq!(score, 7.6);
/// ```
pub fn calculate_overall_score(
    experts: &HashMap<String, ExpertData>,
    weights: Option<&HashMap<String, f64>>,
) -> Result<f64, ValidationError> {
```

### Inline Comments

Add comments only where logic isn't self-evident:

```typescript
// Scan first 15 lines because cwd field appears around line 3-4, not line 0
for (const line of lines.slice(0, 15)) {

// Fallback: naive decode (works when no hyphens in directory names)
return decodeProjectPath(encodedDir);
```

**Do NOT add comments for obvious code:**
```typescript
// BAD: const port = 3000;  // Set port to 3000
// GOOD: just write the code, it's self-explanatory
```

### README Documentation

Every project/module README should include:
- **What** it does (1-2 sentences)
- **Setup** instructions (install, configure, run)
- **Usage** examples (common use cases)
- **API reference** (if applicable — public functions/endpoints)
- **Configuration** (environment variables, options)

### API Endpoint Documentation

```markdown
## POST /api/users

Create a new user account.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| name | string | Yes | Display name |
| role | string | No | User role (default: "member") |

**Response:** `201 Created`
```json
{ "id": "usr_abc123", "email": "user@example.com" }
```

**Errors:**
- `400` - Invalid email format
- `409` - Email already registered
```

## API Documentation

When invoked with `/documentation api`, generate OpenAPI 3.0 specifications for REST APIs.

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
          schema: { type: integer }
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
      required: [id, email]
      properties:
        id: { type: string }
        email: { type: string }
```

### API Documentation Checklist

- Endpoint path and HTTP method
- Clear summary and detailed description
- All query/path/header parameters documented
- Request body schema (if applicable)
- All response status codes and schemas
- Authentication requirements
- Rate limiting information
- Example requests and responses

## Best Practices

1. **Document the why, not the what** - Code shows what happens; comments explain why
2. **Keep docs close to code** - JSDoc on functions, not in a separate wiki
3. **Include examples** - A good example is worth 100 words of description
4. **Document edge cases** - What happens with null, empty, or extreme inputs?
5. **Update docs with code** - Stale docs are worse than no docs
6. **Use consistent style** - Pick JSDoc or TSDoc and stick with it project-wide
7. **Document public APIs thoroughly** - Internal helpers need less documentation

## Language-Specific Conventions

| Language | Style | Tool |
|----------|-------|------|
| TypeScript | TSDoc (`/** */`) | TypeDoc |
| JavaScript | JSDoc (`/** */`) | JSDoc |
| Python | Google-style docstrings | Sphinx / pdoc |
| Go | Package comments + `//` | godoc |
| Rust | `///` doc comments | rustdoc |
| Java | Javadoc (`/** */`) | Javadoc |

## Handshake Protocol

### `hello`
Respond with:
> 👋 Hello! I'm **Documentation** v1.2.0. Add comprehensive documentation including JSDoc/TSDoc, inline comments, README updates, and OpenAPI 3.0 API docs. Use `/documentation hello ID` for the full guide.

### `hello ID`
Respond with complete skill information:
- **Name**: Documentation v1.2.0
- **Description**: Add comprehensive documentation including JSDoc/TSDoc, inline comments, README updates, and OpenAPI 3.0 API docs. Use when documenting code, generating docs, or improving project documentation.
- **How to invoke**: `/documentation [target]` or `/documentation api`
- **Available arguments**: `[target] | api | hello | hello ID`
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

## Changelog

### 1.2.0 (2026-03-15)
- Improved description for better trigger accuracy
- Added Go and Rust documentation examples

### 1.1.0 (2026-03-14)
- Merged `api-documentation` skill into unified `/documentation api` subcommand
- Added OpenAPI 3.0 template and API documentation checklist

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
