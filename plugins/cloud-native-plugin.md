---
plugin_name: Cloud Native Plugin
description: Complete Kubernetes, Docker, and cloud deployment solution
priority: P1
version: 1.0.0
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Cloud Native Plugin

Complete solution for cloud-native development with Kubernetes, Docker, and cloud platform integrations.

## Components Included

### Sub-Agents
- ✅ DevOps/Infrastructure Expert
- ✅ Observability Expert

### Skills
- ✅ GitOps Workflow
- ✅ CI/CD Best Practices

### MCP Servers
- ✅ Container/Docker MCP
- ✅ Cloud Resource Management MCP

### Commands
- `/deploy` - Deploy to Kubernetes/cloud
- `/scale` - Scale application resources
- `/rollback` - Rollback deployment

### Hooks
- Infrastructure Validation Hook
- Cost Monitoring Hook

## Installation

```bash
# Install the plugin
claude-code install cloud-native

# Or manually
cp -r plugins/cloud-native ~/.claude/plugins/
```

## Configuration

Create `~/.claude/plugins/cloud-native/config.json`:

```json
{
  "cloud_provider": "aws",
  "kubernetes": {
    "context": "production",
    "namespace": "default"
  },
  "docker": {
    "registry": "your-registry.io",
    "buildkit": true
  },
  "monitoring": {
    "prometheus_url": "http://prometheus:9090",
    "grafana_url": "http://grafana:3000"
  }
}
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

### 📊 Observability
- Prometheus metrics
- Grafana dashboards
- Distributed tracing
- Log aggregation

### 🚀 GitOps Workflow
- ArgoCD integration
- Flux CD support
- Automated deployments
- Rollback capabilities

## Usage Examples

### Deploy Application
```bash
/deploy my-app --environment production --replicas 3
```

### Scale Resources
```bash
/scale my-app --replicas 5 --cpu 2 --memory 4Gi
```

### Rollback
```bash
/rollback my-app --to-version v1.2.3
```

### Monitor Resources
Ask: "Show me the resource usage for my-app"
- CPU and memory utilization
- Pod status and health
- Network traffic
- Error rates

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

### Observability
- ✅ Structured logging
- ✅ Distributed tracing
- ✅ Metrics collection
- ✅ Alert configuration

## What You Get

- **Production-ready** Kubernetes manifests
- **Optimized** Docker images
- **Automated** CI/CD pipelines
- **Complete** observability stack
- **Cost-optimized** cloud resources
- **Secure** configurations

---

**Status**: Production Ready ✅
**Platforms**: AWS, GCP, Azure, Kubernetes

## Changelog

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
