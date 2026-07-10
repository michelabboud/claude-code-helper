/**
 * logs.ts — pure log-path resolution helpers for the project-oversight server.
 *
 * Kept separate from index.ts (which runs `runServer()` at import time) so the
 * directory-scanning logic can be unit-tested against a temp fixture.
 */

import path from "node:path";
import { readdir, stat } from "node:fs/promises";

/**
 * Locate a Claude Code session transcript by session id.
 *
 * Session logs live at <projectsDir>/<encoded-project-path>/<sessionId>.jsonl —
 * one project subdirectory per working directory. The session id alone does not
 * identify the project, so we scan the project subdirectories for a matching
 * `<sessionId>.jsonl`. Throws a clear error if none is found.
 *
 * `sessionId` must already be validated by the caller (the server validates it
 * against SESSION_ID_REGEX before this is reached), so it is safe in a path.
 */
export async function findSessionLog(projectsDir: string, sessionId: string): Promise<string> {
  const fileName = `${sessionId}.jsonl`;

  let projectDirs: string[];
  try {
    const entries = await readdir(projectsDir, { withFileTypes: true });
    projectDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    throw new Error(`No Claude Code projects directory found at ${projectsDir}`);
  }

  for (const dir of projectDirs) {
    const candidate = path.join(projectsDir, dir, fileName);
    try {
      const info = await stat(candidate);
      if (info.isFile()) {
        return candidate;
      }
    } catch {
      // Not in this project subdirectory — keep looking.
    }
  }

  throw new Error(
    `Session log not found for session "${sessionId}" under ${projectsDir}`
  );
}
