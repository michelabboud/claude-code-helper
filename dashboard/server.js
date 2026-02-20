const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3200;

// ── Paths ──────────────────────────────────────────────
const HOME = os.homedir();
const CLAUDE_DIR = path.join(HOME, '.claude');
const PROJECTS_BASE = path.join(CLAUDE_DIR, 'projects');

// ── Helpers ────────────────────────────────────────────

/** Decode Claude's encoded project path: "-home-user-projects-foo" → "/home/user/projects/foo" */
function decodeProjectPath(encoded) {
  // encoded starts with "-" and uses "-" as separator
  return encoded.replace(/^-/, '/').replace(/-/g, '/');
}

/** Encode a project path the way Claude does: "/home/user/projects/foo" → "-home-user-projects-foo" */
function encodeProjectPath(absPath) {
  return absPath.replace(/\//g, '-');
}

/** Parse a JSONL file, return last `limit` entries */
function parseJsonl(filePath, limit = 500) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    const start = Math.max(0, lines.length - limit);
    const result = [];
    for (let i = start; i < lines.length; i++) {
      try { result.push(JSON.parse(lines[i])); } catch (_) { /* skip bad lines */ }
    }
    return result;
  } catch (_) { return []; }
}

/** Parse Claude debug log file into structured entries */
function parseDebugLog(filePath, limit = 500) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.trim().split('\n');
    const regex = /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+\[(\w+)\]\s+(?:\[([^\]]*)\])?\s*(.*)$/;
    const entries = [];

    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        entries.push({
          timestamp: match[1],
          level: match[2],
          component: match[3] || '',
          message: match[4]
        });
      } else if (line.trim() && entries.length > 0) {
        // Continuation line (stack trace, etc.) — append to previous
        entries[entries.length - 1].message += '\n' + line;
      }
    }
    return entries.slice(-limit);
  } catch (_) { return []; }
}

/** Resolve actual project path from session JSONL (cwd field) since hyphen-encoding is ambiguous.
 *  The cwd field may not be on the first line — scan the first 15 lines of the most recent session. */
function resolveProjectPath(encodedDir) {
  const fullDir = path.join(PROJECTS_BASE, encodedDir);
  try {
    const jsonls = fs.readdirSync(fullDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(fullDir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);

    for (const { name } of jsonls) {
      const lines = fs.readFileSync(path.join(fullDir, name), 'utf8').split('\n').slice(0, 15);
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.cwd) return entry.cwd;
        } catch (_) {}
      }
    }
  } catch (_) {}
  // Fallback: naive decode (works when no hyphens in dir names)
  return decodeProjectPath(encodedDir);
}

/** Discover all projects that have Claude session data */
function discoverProjects() {
  const projects = [];
  try {
    const dirs = fs.readdirSync(PROJECTS_BASE);
    for (const dir of dirs) {
      const fullDir = path.join(PROJECTS_BASE, dir);
      const stat = fs.statSync(fullDir);
      if (!stat.isDirectory()) continue;

      const actualPath = resolveProjectPath(dir);
      const pmDashboardPath = path.join(actualPath, '.claude', 'pm-dashboard.json');
      let pmData = null;
      try { pmData = JSON.parse(fs.readFileSync(pmDashboardPath, 'utf8')); } catch (_) {}

      // Count sessions
      let sessionCount = 0;
      try {
        sessionCount = fs.readdirSync(fullDir).filter(f => f.endsWith('.jsonl')).length;
      } catch (_) {}

      // Get latest activity
      let lastActivity = null;
      try {
        const jsonls = fs.readdirSync(fullDir)
          .filter(f => f.endsWith('.jsonl'))
          .map(f => ({ name: f, mtime: fs.statSync(path.join(fullDir, f)).mtime }))
          .sort((a, b) => b.mtime - a.mtime);
        if (jsonls.length > 0) lastActivity = jsonls[0].mtime.toISOString();
      } catch (_) {}

      projects.push({
        id: dir,
        path: actualPath,
        name: pmData?.projectName || path.basename(actualPath),
        sessionCount,
        lastActivity,
        hasPMDashboard: pmData !== null,
        overallScore: pmData?.overallScore || null,
        sessionsDir: fullDir
      });
    }
  } catch (_) {}

  return projects.sort((a, b) => {
    if (a.lastActivity && b.lastActivity) return new Date(b.lastActivity) - new Date(a.lastActivity);
    return (b.sessionCount || 0) - (a.sessionCount || 0);
  });
}

/** Validate ID-like params (UUIDs, encoded paths, agent IDs) */
function isValidId(id) {
  return /^[a-zA-Z0-9._-]+$/.test(id);
}

// ── Static files ───────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ─────────────────────────────────────────

// List all discovered projects
app.get('/api/projects', (_req, res) => {
  res.json(discoverProjects());
});

// PM Dashboard data for a specific project
app.get('/api/projects/:projectId/pm', (req, res) => {
  if (!isValidId(req.params.projectId)) return res.status(400).json({ error: 'Invalid project ID' });
  const actualPath = resolveProjectPath(req.params.projectId);
  const pmFile = path.join(actualPath, '.claude', 'pm-dashboard.json');
  try {
    res.json(JSON.parse(fs.readFileSync(pmFile, 'utf8')));
  } catch (_) {
    res.status(404).json({ error: 'No PM dashboard data', path: pmFile });
  }
});

// Debug logs (latest session or specific)
app.get('/api/debug', (req, res) => {
  const limit = Math.min(parseInt(req.query.lines) || 500, 2000);
  const debugDir = path.join(CLAUDE_DIR, 'debug');
  let logFile;

  // Try 'latest' symlink first
  try {
    let target = fs.readlinkSync(path.join(debugDir, 'latest'));
    if (!path.isAbsolute(target)) target = path.join(debugDir, target);
    logFile = target;
  } catch (_) {
    // Fallback: most recent .txt
    try {
      const files = fs.readdirSync(debugDir)
        .filter(f => f.endsWith('.txt'))
        .map(f => ({ name: f, mtime: fs.statSync(path.join(debugDir, f)).mtime }))
        .sort((a, b) => b.mtime - a.mtime);
      if (files.length > 0) logFile = path.join(debugDir, files[0].name);
    } catch (_) {}
  }

  if (!logFile) return res.json([]);
  res.json(parseDebugLog(logFile, limit));
});

// List sessions for a project
app.get('/api/projects/:projectId/sessions', (req, res) => {
  if (!isValidId(req.params.projectId)) return res.status(400).json({ error: 'Invalid project ID' });
  const sessionsDir = path.join(PROJECTS_BASE, req.params.projectId);
  try {
    const files = fs.readdirSync(sessionsDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => {
        const fp = path.join(sessionsDir, f);
        const stat = fs.statSync(fp);
        // Peek at first line for metadata
        let meta = {};
        try {
          const first = fs.readFileSync(fp, 'utf8').split('\n')[0];
          meta = JSON.parse(first);
        } catch (_) {}

        // Count subagents
        let subagentCount = 0;
        const subDir = path.join(sessionsDir, f.replace('.jsonl', ''), 'subagents');
        try { subagentCount = fs.readdirSync(subDir).filter(s => s.endsWith('.jsonl')).length; } catch (_) {}

        return {
          id: f.replace('.jsonl', ''),
          size: stat.size,
          modified: stat.mtime.toISOString(),
          sizeHuman: stat.size < 1024 * 1024
            ? (stat.size / 1024).toFixed(1) + ' KB'
            : (stat.size / (1024 * 1024)).toFixed(1) + ' MB',
          subagentCount,
          version: meta.version || null,
          slug: meta.slug || null,
          gitBranch: meta.gitBranch || null
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    res.json(files);
  } catch (_) { res.json([]); }
});

// Session messages
app.get('/api/projects/:projectId/sessions/:sessionId', (req, res) => {
  if (!isValidId(req.params.projectId) || !isValidId(req.params.sessionId))
    return res.status(400).json({ error: 'Invalid ID' });
  const limit = Math.min(parseInt(req.query.lines) || 300, 1000);
  const fp = path.join(PROJECTS_BASE, req.params.projectId, req.params.sessionId + '.jsonl');
  res.json(parseJsonl(fp, limit));
});

// List subagents for a session
app.get('/api/projects/:projectId/sessions/:sessionId/subagents', (req, res) => {
  if (!isValidId(req.params.projectId) || !isValidId(req.params.sessionId))
    return res.status(400).json({ error: 'Invalid ID' });
  const subDir = path.join(PROJECTS_BASE, req.params.projectId, req.params.sessionId, 'subagents');
  try {
    const files = fs.readdirSync(subDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => {
        const fp = path.join(subDir, f);
        const stat = fs.statSync(fp);
        return {
          id: f.replace('.jsonl', ''),
          size: stat.size,
          modified: stat.mtime.toISOString(),
          sizeHuman: (stat.size / 1024).toFixed(1) + ' KB'
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    res.json(files);
  } catch (_) { res.json([]); }
});

// Subagent messages
app.get('/api/projects/:projectId/sessions/:sessionId/subagents/:agentId', (req, res) => {
  const { projectId, sessionId, agentId } = req.params;
  if (!isValidId(projectId) || !isValidId(sessionId) || !isValidId(agentId))
    return res.status(400).json({ error: 'Invalid ID' });
  const limit = Math.min(parseInt(req.query.lines) || 200, 1000);
  const fp = path.join(PROJECTS_BASE, projectId, sessionId, 'subagents', agentId + '.jsonl');
  res.json(parseJsonl(fp, limit));
});

// Global history
app.get('/api/history', (req, res) => {
  const limit = Math.min(parseInt(req.query.lines) || 100, 500);
  res.json(parseJsonl(path.join(CLAUDE_DIR, 'history.jsonl'), limit));
});

// Tasks (most recent session)
app.get('/api/tasks', (_req, res) => {
  const tasksDir = path.join(CLAUDE_DIR, 'tasks');
  try {
    const sessions = fs.readdirSync(tasksDir)
      .filter(f => fs.statSync(path.join(tasksDir, f)).isDirectory())
      .sort((a, b) => fs.statSync(path.join(tasksDir, b)).mtime - fs.statSync(path.join(tasksDir, a)).mtime);
    if (sessions.length === 0) return res.json([]);

    const dir = path.join(tasksDir, sessions[0]);
    const tasks = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (_) { return null; } })
      .filter(Boolean);
    res.json(tasks);
  } catch (_) { res.json([]); }
});

// Log sources overview
app.get('/api/sources', (_req, res) => {
  const sources = {};
  try { sources.debugFiles = fs.readdirSync(path.join(CLAUDE_DIR, 'debug')).filter(f => f.endsWith('.txt')).length; } catch (_) { sources.debugFiles = 0; }
  try { sources.projectDirs = fs.readdirSync(PROJECTS_BASE).filter(f => fs.statSync(path.join(PROJECTS_BASE, f)).isDirectory()).length; } catch (_) { sources.projectDirs = 0; }
  try { sources.taskSessions = fs.readdirSync(path.join(CLAUDE_DIR, 'tasks')).filter(f => fs.statSync(path.join(CLAUDE_DIR, 'tasks', f)).isDirectory()).length; } catch (_) { sources.taskSessions = 0; }
  sources.claudeDir = CLAUDE_DIR;
  sources.projectsBase = PROJECTS_BASE;
  res.json(sources);
});

// ── Start ──────────────────────────────────────────────
app.listen(PORT, () => {
  const projects = discoverProjects();
  console.log('');
  console.log('  \x1b[1m\x1b[34mClaude Code Dashboard\x1b[0m');
  console.log('  \x1b[2m─────────────────────\x1b[0m');
  console.log(`  Local:     \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`  Claude:    ${CLAUDE_DIR}`);
  console.log(`  Projects:  ${projects.length} discovered`);
  projects.slice(0, 5).forEach(p => {
    const score = p.overallScore != null ? ` (${p.overallScore}/10)` : '';
    console.log(`    \x1b[2m•\x1b[0m ${p.name}${score} — ${p.sessionCount} sessions`);
  });
  console.log('');
});
