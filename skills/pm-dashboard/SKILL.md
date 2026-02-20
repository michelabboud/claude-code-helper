---
skill_name: PM Dashboard
description: 'Update the Project Manager dashboard with assessment scores, tasks, and risks. Use after running a project health assessment.'
argument-hint: '[open|update|reset]'
user-invocable: true
---

# PM Dashboard Manager

Manage the Project Manager dashboard data file used by both the terminal and web dashboards.

## Usage

- `/pm-dashboard update` - Write/update assessment data after an expert consultation
- `/pm-dashboard open` - Open the web dashboard in the browser
- `/pm-dashboard reset` - Reset all scores to start a fresh assessment

## Data File Location

The PM agent writes assessment data to `.claude/pm-dashboard.json` in the project root. Both the terminal and web dashboards read from this file.

## Data Schema

The PM dashboard data file follows this structure:

```json
{
  "projectName": "my-project",
  "lastAssessment": "2026-02-20T10:30:00Z",
  "assessmentCount": 1,
  "experts": {
    "qa": { "score": 7, "status": "good", "topFinding": "...", "recommendation": "...", "riskIfIgnored": "..." },
    "uiux": { "score": null, "status": "not-assessed", "topFinding": null, "recommendation": null, "riskIfIgnored": null },
    "security": { ... },
    "devops": { ... },
    "networking": { ... },
    "development": { ... },
    "architecture": { ... },
    "product": { ... },
    "api": { ... },
    "monitoring": { ... },
    "database": { ... },
    "performance": { ... },
    "documentation": { ... },
    "specifications": { ... },
    "projectDocs": { ... },
    "progress": { ... }
  },
  "overallScore": 6.5,
  "tasks": [
    {
      "id": "t1",
      "title": "Fix authentication vulnerabilities",
      "status": "todo",
      "priority": 1,
      "impact": "high",
      "effort": "medium",
      "expert": "security",
      "quadrant": "quick-win"
    }
  ],
  "risks": [
    {
      "id": "r1",
      "description": "Exposed API keys in config",
      "severity": "critical",
      "likelihood": "high",
      "expert": "security",
      "mitigation": "Move to environment variables"
    }
  ],
  "technicalDebt": [
    {
      "id": "d1",
      "item": "Legacy jQuery dependency",
      "category": "code",
      "impact": "medium",
      "effort": "days",
      "interestRate": "accruing"
    }
  ],
  "history": [
    {
      "date": "2026-02-20T10:30:00Z",
      "scores": { "qa": 7, "security": 4, "devops": 8 }
    }
  ]
}
```

## Expert Keys

| Key | Expert Domain |
|-----|--------------|
| `qa` | QA & Testing |
| `uiux` | UI/UX Design |
| `security` | Security |
| `devops` | DevOps & IT |
| `networking` | Networking |
| `development` | Development |
| `architecture` | Architecture |
| `product` | Product/Specs |
| `api` | API Quality |
| `monitoring` | Monitoring |
| `database` | Database |
| `performance` | Performance |
| `documentation` | Documentation |
| `specifications` | Specifications |
| `projectDocs` | Project Docs |
| `progress` | Progress |

## Instructions for PM Agent

After completing an assessment, write the results to `.claude/pm-dashboard.json`:

```bash
# The PM agent writes this file after each assessment
cat > .claude/pm-dashboard.json << 'DASHBOARD_EOF'
{
  ... assessment data ...
}
DASHBOARD_EOF
```

To open the web dashboard:
```bash
# Copy dashboard HTML to project and open
cp ~/.claude/skills/pm-dashboard/dashboard.html .claude/pm-dashboard.html
open .claude/pm-dashboard.html  # macOS
xdg-open .claude/pm-dashboard.html  # Linux
```
