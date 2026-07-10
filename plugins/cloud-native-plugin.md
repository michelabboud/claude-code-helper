---
plugin_name: Cloud Native Plugin
description: Complete Kubernetes, Docker, and cloud deployment solution
priority: P1
version: 1.0.1
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Cloud Native Plugin

Complete solution for cloud-native development with Kubernetes, Docker, and cloud platform integrations.

## Components Included

### Sub-Agents
- ✅ AWS Architect Expert
- ✅ Azure Architect Expert
- ✅ GCP Architect Expert
- ✅ DevOps/Infrastructure Expert
- ✅ Terraform/IaC Expert

### Skills
- ✅ CI Best Practices

### MCP Servers
- ✅ CI/CD Pipeline MCP

## Installation

```bash
# Agents
cp agents/domain-experts/aws-architect-expert.md ~/.claude/agents/
cp agents/domain-experts/azure-architect-expert.md ~/.claude/agents/
cp agents/domain-experts/gcp-architect-expert.md ~/.claude/agents/
cp agents/domain-experts/devops-infrastructure-expert.md ~/.claude/agents/
cp agents/domain-experts/terraform-iac-expert.md ~/.claude/agents/

# Skill
cp -r skills/ci-best-practices ~/.claude/skills/

# MCP server (build required)
cd mcp-servers/cicd-pipeline && npm install && npm run build
```

## Features

### 🐳 Container Management
- Multi-stage Dockerfile generation
- Image optimization
- Security scanning
- Registry management

### ☸️ Kubernetes Deployment
- Manifest generation
- Helm chart creation
- Resource management
- Auto-scaling configuration

### ☁️ Cloud Integration
- AWS EKS, GCP GKE, Azure AKS
- Infrastructure as Code (Terraform)
- Cloud resource optimization
- Cost monitoring

### 🚀 CI/CD Pipelines
- Multi-platform pipeline generation (GitHub Actions, GitLab CI, Jenkins)
- Pipeline optimization and troubleshooting
- Deployment strategies (blue-green, canary, rolling)

## Usage Examples

### Deploy Application
```
Ask: "Generate a Kubernetes deployment manifest for my-app with 3 replicas in production"
```

### Scale Resources
```
Ask: "Help me configure horizontal pod autoscaling for my-app with CPU and memory targets"
```

### Rollback Strategy
```
Ask: "Design a rollback strategy for my-app back to a known-good version"
```

### Generate a CI/CD Pipeline
```
Ask: "Generate a GitHub Actions pipeline with tests, build, and deploy for this project"
```

### CI Pipeline Best Practices
```
/ci-best-practices
```

## Best Practices

### Container Security
- ✅ Non-root user
- ✅ Minimal base images
- ✅ Security scanning
- ✅ Secrets management

### Kubernetes Deployment
- ✅ Resource limits and requests
- ✅ Health checks (liveness/readiness)
- ✅ Horizontal Pod Autoscaling
- ✅ Pod Disruption Budgets

### CI/CD
- ✅ Automated testing gates
- ✅ Caching strategies
- ✅ Security scanning in pipeline
- ✅ Rollback-ready deployments

## What You Get

- **Production-ready** Kubernetes manifests
- **Optimized** Docker images
- **Automated** CI/CD pipelines
- **Multi-cloud** infrastructure guidance (AWS, GCP, Azure)
- **Cost-optimized** cloud resources
- **Secure** configurations

---

**Status**: Production Ready ✅
**Platforms**: AWS, GCP, Azure, Kubernetes

## Changelog

### 1.0.1 (2026-07-10)
- Removed fictional bundled components that don't exist in this repo: "GitOps Workflow" skill, Container/Docker MCP, Cloud Resource Management MCP, `/deploy` `/scale` `/rollback` commands, Infrastructure Validation Hook, Cost Monitoring Hook
- Removed fictional `claude-code install cloud-native` and `cp -r plugins/cloud-native` install steps (no `plugins/<name>/` bundle directory or plugin installer exists in this repo) — replaced with real `cp`/`npm run build` steps for each bundled component
- Removed the `~/.claude/plugins/cloud-native/config.json` configuration section (no unified plugin config mechanism exists)
- Reconciled Components to real, verified files only: AWS/Azure/GCP Architect Expert agents, DevOps/Infrastructure Expert agent, Terraform/IaC Expert agent, CI Best Practices skill, CI/CD Pipeline MCP server
- Fixed skill name: "CI/CD Best Practices" → "CI Best Practices" (`ci-best-practices`)
- Replaced fictional `/deploy`, `/scale`, `/rollback` command examples with `Ask:` prompts and the real `/ci-best-practices` skill invocation

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
