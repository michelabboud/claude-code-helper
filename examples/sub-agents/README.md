# Additional Sub-Agents (P3)

This directory contains additional comprehensive sub-agents added in version 1.0.0 and 1.1.0 to provide complete coverage across all major technology stacks.

## Directory Structure

Note: The repository has two sub-agent locations:
1. **`examples/agents/subagents/`** - Original P0, P1, P2 agents (18 files)
2. **`examples/sub-agents/`** - Additional P3 agents (17 files, this directory)

**Total: 33 unique sub-agents** (2 files exist in both locations with different versions)

## Sub-Agents in This Directory (P3)

### Frontend Frameworks
1. **angular-expert.md** - Angular 17+, Signals, Standalone Components, RxJS, NgRx
2. **vue-nuxt-expert.md** - Vue 3 Composition API, Nuxt 3 (comprehensive version)

### Mobile Development
3. **android-expert.md** - Kotlin, Jetpack Compose, Hilt DI, Material Design 3

### Backend Languages
4. **ruby-rails-expert.md** - Rails 7+, Hotwire, Turbo, Stimulus, Action Cable
5. **rust-expert.md** - Ownership/Borrowing, Async/Tokio, Axum, SQLx
6. **go-expert.md** - Goroutines, Channels, Gin, Context, Modules
7. **php-expert.md** - PHP 8.2+, Enums, Attributes, Modern Patterns

### Backend Frameworks
8. **laravel-expert.md** - Laravel 10+, Eloquent, Blade, Livewire, Sanctum
9. **wordpress-expert.md** - Plugin Development, Custom Post Types, Gutenberg, WooCommerce

### Data & Infrastructure
10. **redis-expert.md** - All Data Structures, Caching, Pub/Sub, Clustering

### Cloud Platforms
11. **aws-architect-expert.md** - EC2, Lambda, ECS, RDS, DynamoDB, CloudFormation, CDK
12. **azure-architect-expert.md** - Azure Functions, AKS, Cosmos DB, ARM, Bicep
13. **gcp-architect-expert.md** - Cloud Functions, GKE, BigQuery, Dataflow, Terraform

### Specialized Domains
14. **iot-embedded-expert.md** - Arduino, ESP32/ESP8266, MQTT, Sensors, Power Management
15. **game-design-expert.md** - Unity, Unreal Engine, Game Mechanics, AI Patterns
16. **huggingface-expert.md** - Transformers, Fine-tuning, Inference, Deployment

### Testing (Comprehensive Version)
17. **qa-testing-expert.md** - E2E testing, load testing, test automation (comprehensive version)

## Installation

### Install All P3 Agents
```bash
cp examples/sub-agents/*.md ~/.claude/agents/
```

### Install Specific Domain
```bash
# Cloud architects
cp examples/sub-agents/aws-architect-expert.md ~/.claude/agents/
cp examples/sub-agents/azure-architect-expert.md ~/.claude/agents/
cp examples/sub-agents/gcp-architect-expert.md ~/.claude/agents/

# Backend languages
cp examples/sub-agents/rust-expert.md ~/.claude/agents/
cp examples/sub-agents/go-expert.md ~/.claude/agents/
cp examples/sub-agents/ruby-rails-expert.md ~/.claude/agents/
```

## Duplicates Note

Two files exist in both locations:
- `qa-testing-expert.md` - Version in this directory is more comprehensive
- `vue-nuxt-expert.md` - Version in this directory has more examples

If installing from both locations, the more recent (comprehensive) versions will overwrite the originals, which is the intended behavior.

## Complete Agent List

For the complete list of all 33+ sub-agents across both directories, see:
- [../agents/subagents/README.md](../agents/subagents/README.md) - Original agents
- This directory - Additional comprehensive agents

---

**Created**: 2026-01-10 (v1.0.0 - P3 completion)
**Updated**: 2026-01-10 (v1.1.0)
