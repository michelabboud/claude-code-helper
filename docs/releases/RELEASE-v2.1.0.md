# Release v2.1.0 - PM Expert Expansion & Monitoring Dashboard

**3 new PM experts, structured "What's Next?" algorithm, and professional multi-repo monitoring dashboard.**

---

## New PM Expert Dimensions

The Project Manager agent now consults **16 domain experts** (up from 13).

### #14 Specifications Expert
Analyzes project specifications, requirements completeness, and acceptance criteria quality.
- Includes 6 **requirements elicitation prompts** for when specs are missing
- Evaluates: spec completeness, requirements traceability, edge case coverage
- Distinct from Product Manager (#8) which assesses feature completeness

### #15 Project Documentation Expert
Documents decisions, retrospectives, and institutional memory.
- Evaluates: ADRs, decision rationale, retrospectives, searchable knowledge base
- Distinct from Documentation Expert (#13) which covers code/API/README docs

### #16 Progress Expert
Ensures task documentation enables resumability for agents and developers.
- Includes a **resumability checklist** for agentic development
- Evaluates: cold-start pickup, parallel agent safety, WIP documentation
- Scores whether any agent can pick up any task without asking questions

## "What's Next?" Decision Algorithm

New 6-step repeatable process triggered by "what next?" or "what should we do next?":

1. **Check Blockers** - Blocked work has highest opportunity cost
2. **Check Accruing Debt** - Compounding debt gets worse if ignored
3. **Score Floor Rule** - Any domain <= 3 is a project-level risk
4. **Quick Wins First** - High impact + low effort = best ROI
5. **Consider Momentum** - Same-domain work reduces context-switching
6. **Formulate Recommendation** - Structured WHAT/WHY/RISK/EFFORT/SCORES

## Monitoring Dashboard

New `dashboard/` directory with a professional multi-repo monitoring dashboard.

### Setup
```bash
cd dashboard && npm install && npm run dev
# Opens at http://localhost:3200
```

### Features
- **Multi-project overview** - Auto-discovers all Claude Code projects
- **PM Health view** - 16 expert bars, radar chart, priority matrix, tasks, risks, tech debt, history sparklines
- **Activity Logs** - Real-time debug log viewer with level filtering, search, auto-refresh
- **Session Browser** - View session transcripts and subagent activity
- **Professional UI** - Inter + JetBrains Mono fonts, dark/light theme, keyboard shortcuts

### Data Sources
- `~/.claude/debug/` - Debug logs with timestamps, levels, components
- `~/.claude/projects/` - Session transcripts (JSONL) and subagent logs
- `.claude/pm-dashboard.json` - Per-project PM assessment data
- `~/.claude/history.jsonl` - User input history
- `~/.claude/tasks/` - Task management data

### API Endpoints
| Endpoint | Description |
|----------|-------------|
| `GET /api/projects` | List all discovered projects |
| `GET /api/projects/:id/pm` | PM dashboard data for a project |
| `GET /api/debug?lines=500` | Latest debug log entries |
| `GET /api/projects/:id/sessions` | List sessions for a project |
| `GET /api/projects/:id/sessions/:sid` | Session messages |
| `GET /api/projects/:id/sessions/:sid/subagents` | List subagents |
| `GET /api/history` | Global input history |
| `GET /api/tasks` | Current session tasks |

## Schema Changes

### pm-dashboard.json
Three new expert keys added to `experts` object and all `history` entries:
- `specifications` - Requirements & acceptance criteria quality
- `projectDocs` - Decision documentation & knowledge base
- `progress` - Task resumability & agent readiness

### Dashboard Renderers
All renderers updated for 16 experts:
- `dashboard.html` - EXPERT_LABELS, DEMO_DATA, history
- `multi-project.html` - EXPERT_LABELS
- `pm-tui.sh` - EXPERTS bash array

## Files Changed

| File | Changes |
|------|---------|
| `agents/domain-experts/project-manager.md` | +3 experts, +algorithm, +triggers, count updates |
| `.claude/pm-dashboard.json` | +3 experts, +history keys, recalculated score |
| `skills/pm-dashboard/SKILL.md` | +3 table rows, +3 schema entries |
| `skills/pm-dashboard/dashboard.html` | +3 EXPERT_LABELS, +DEMO_DATA entries |
| `skills/pm-dashboard/multi-project.html` | +3 EXPERT_LABELS |
| `skills/pm-dashboard/pm-tui.sh` | +3 EXPERTS array entries |
| `dashboard/package.json` | **NEW** - Express dev server config |
| `dashboard/server.js` | **NEW** - API server for log/session/PM data |
| `dashboard/public/index.html` | **NEW** - Professional monitoring dashboard |
| `CHANGELOG.md` | v2.1.0 entry |
| `README.md` | Dashboard section, directory tree |
| `CLAUDE.md` | Directory tree update |
