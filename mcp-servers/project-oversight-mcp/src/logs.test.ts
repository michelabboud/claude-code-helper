/**
 * Unit tests for findSessionLog (src/logs.ts) against a temp fixture.
 *
 * Regression coverage for the "source=session always returns empty" bug: the
 * old code resolved to ~/.claude/projects/<sessionId> (a directory) and the
 * read swallowed the resulting EISDIR. The finder must locate the real
 * <sessionId>.jsonl inside a per-project subdirectory.
 */

import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { findSessionLog } from "./logs.js";

describe("findSessionLog", () => {
  let root: string;
  let projectsDir: string;
  const SESSION = "abc123-def456";

  beforeAll(async () => {
    root = await mkdtemp(path.join(tmpdir(), "po-logs-test-"));
    projectsDir = path.join(root, "projects");
    // Two project subdirectories; the session lives only in the second.
    await mkdir(path.join(projectsDir, "-home-user-projectA"), { recursive: true });
    await mkdir(path.join(projectsDir, "-home-user-projectB"), { recursive: true });
    await writeFile(
      path.join(projectsDir, "-home-user-projectB", `${SESSION}.jsonl`),
      '{"type":"user"}\n'
    );
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("finds the session log inside the correct project subdirectory", async () => {
    const found = await findSessionLog(projectsDir, SESSION);
    expect(found).toBe(
      path.join(projectsDir, "-home-user-projectB", `${SESSION}.jsonl`)
    );
  });

  it("throws a clear error when the session id has no log", async () => {
    await expect(findSessionLog(projectsDir, "no-such-session")).rejects.toThrow(
      /Session log not found for session "no-such-session"/
    );
  });

  it("throws when the projects directory does not exist", async () => {
    await expect(
      findSessionLog(path.join(root, "does-not-exist"), SESSION)
    ).rejects.toThrow(/No Claude Code projects directory/);
  });

  it("does not match a directory named like the session log (the original bug)", async () => {
    // A directory that happens to share the <sessionId>.jsonl name must be
    // ignored — only regular files count.
    const trap = "trap-session";
    await mkdir(path.join(projectsDir, "-home-user-projectA", `${trap}.jsonl`), {
      recursive: true,
    });
    await expect(findSessionLog(projectsDir, trap)).rejects.toThrow(
      /Session log not found/
    );
  });
});
