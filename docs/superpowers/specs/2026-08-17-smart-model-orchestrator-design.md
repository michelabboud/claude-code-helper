# Smart Model Orchestrator Design

- **Status:** Approved by Michel on 2026-08-17
- **Scope:** Global Codex skill, installed under `~/.codex/skills`
- **Canonical source:** `skills/smart-model-orchestrator/`
- **Decision record:** `docs/adr/0002-smart-model-orchestrator.md`

## Goal

Create a global Codex skill that keeps planning and architecture on the strongest
available model, routes bounded implementation work to the lowest capable model,
escalates before an agent guesses or loops, and owns an independent code-review cycle
through final seal.

The orchestrator optimizes total delivery cost, not the price of an individual turn.
A cheap worker that needs repeated rescue is more expensive than starting a visibly hard
task on a stronger tier.

## Non-goals

- The skill does not change the model of the already-running root session. It can select
  explicit models and reasoning effort for spawned subagents.
- It does not replace repository instructions, user authority, release rules, TDD,
  verification, or destructive-action boundaries.
- It does not infer access to unrelated repositories, production systems, secrets, MAI,
  or external services.
- It does not parallelize tasks that share files, mutable state, or ordering dependencies.
- It does not treat a worker's self-review as an independent seal.

## Package

The canonical package contains:

```text
skills/smart-model-orchestrator/
├── SKILL.md
├── agents/openai.yaml
└── references/
    ├── routing-matrix.md
    └── escalation-and-review-contract.md
```

`SKILL.md` stays concise and procedural. The routing matrix owns model and specialist
selection. The escalation/review contract owns status schemas, review cadence, report
formats, and reseal rules. No classifier script is included in v1: risk and ambiguity
are semantic judgments, and a numeric script would create false precision.

## Operating model

### 1. Root planning

Planning, design, task decomposition, architecture, and final integration judgment use
`gpt-5.6-sol` with `high` or `xhigh` reasoning. When the root session cannot confirm it
meets that floor, it dispatches a `gpt-5.6-sol`/`xhigh` planner and treats the returned
plan as a proposal subject to the normal user plan gate.

Before dispatch, the root:

1. Reads the applicable repository and global instructions.
2. Inspects current git/worktree state and durable progress.
3. Decomposes work into independently testable tasks with explicit ownership.
4. Records dependencies, risk, acceptance evidence, and permitted side effects.
5. Scans once for plan contradictions and raises only material conflicts.

### 2. Task classification

Hard overrides are evaluated before scoring. The following start on
`gpt-5.6-sol`/`xhigh`:

- security, authentication, authorization, cryptography, secrets, privacy, PII, or trust
  boundaries;
- paid usage, funding, accounting, irreversible data mutation, release authority, or
  production incident response;
- concurrency, memory models, race safety, unsafe code, Rust, C, or C++ systems work;
- public API, schema, protocol, storage, or cross-system architecture decisions;
- independent review of any item in this list.

All other implementation tasks receive a score from five observable dimensions, each
`0..2`: ambiguity, integration breadth, failure blast radius, domain difficulty, and
verification difficulty.

| Score | Default model | Effort | Typical work |
|---:|---|---|---|
| 0–3 | `gpt-5.6-luna` | `max` | Exact, reversible, 1–2-file mechanical work |
| 4–6 | `gpt-5.6-terra` | `high` | Multi-file feature or ordinary integration |
| 7–8 | `gpt-5.6-terra` | `xhigh` | Difficult debugging or broad coordination |
| 9–10 | `gpt-5.6-sol` | `high` | High-judgment implementation |

The root also selects the narrowest applicable specialist `agent_type`; model tier and
subject expertise are independent decisions. Every dispatch records the five scores,
hard overrides, selected model/effort, specialist role, file ownership, and why the
choice is the lowest capable tier.

### 3. Worker contract

Every worker receives a bounded task brief, explicit owned files/responsibility, the
statement that other agents may be editing the repository, exact verification gates,
and this escalation clause:

> You are on the lowest model expected to handle this task. If it exceeds you—after one
> genuine attempt you are stuck, looping, missing required context, or would be
> guessing—stop and return `ESCALATE:` with what is beyond you, what you tried, exact
> evidence, and the next capability needed. Do not continue by approximation.

Workers follow repository-required TDD and return one of `DONE`,
`DONE_WITH_CONCERNS`, `NEEDS_CONTEXT`, `BLOCKED`, or `ESCALATE`.

### 4. Escalation

Escalation is triggered by any of:

- explicit `ESCALATE` or inability to verify a required claim;
- two failed correction attempts for the same symptom;
- unexplained, nondeterministic, or contradictory evidence;
- unexpected scope expansion or a plan/repository contradiction;
- discovery of a hard-override domain;
- a reviewer finding that shows the assigned model misunderstood the contract.

The ladder is Luna → Terra → Sol. A newly discovered hard override jumps directly to
Sol-xhigh. Re-dispatch carries the original brief plus the prior agent's attempts,
evidence, and blocker; it does not force the stronger model to rediscover dead ends. The
same tier is not retried without new context or a narrowed task. If Sol-xhigh remains
blocked, the root reports the exact evidence to Michel instead of looping.

### 5. Review orchestration

The orchestrator, not the worker, schedules and adjudicates reviews:

1. Every implementer performs a self-review.
2. Every completed task receives an independent task review. The reviewer is at least
   Terra-high and is right-sized to the task's risk.
3. Security-sensitive, hard-override, or escalated tasks receive immediate independent
   Sol-xhigh review.
4. After every five independently sealed tasks, Sol-xhigh reviews the cumulative exact
   range and all open Minor findings.
5. The final whole-branch review always uses Sol-xhigh, even when fewer than five tasks
   exist.

Reviewers are read-only and never fix their own findings. Reports state exact base/head,
scope, model/effort, evidence inspected, verification performed, findings grouped as
Critical/Important/Minor, unverified claims, and a `GRANTED` or `WITHHELD` verdict.
Critical and Important findings return to an implementation agent selected from the
finding's actual complexity and domain, followed by an independent reseal. Minor
findings remain visible in the ledger and final review; they are never silently dropped.

### 6. Durable evidence

Each repository run stores recovery state under:

```text
$(git rev-parse --git-path sdd)/smart-model-orchestrator/
```

Required artifacts are `progress.md`, per-task brief/report/review files, cumulative
five-task reviews, `model-ledger.md`, and `final-review.md`. The ledger records task,
role, model, effort, status, escalation path, commits, gates, and review verdict. It
records token/cost data only when the runtime exposes trustworthy measurements.

Project rules decide which final reports are also copied into tracked `docs/reports/`.
After compaction, git state plus this ledger—not conversational recollection—determine
the resume point.

### 7. Parallelism and ownership

Parallel dispatch is allowed only for independently scoped work with disjoint ownership
and no shared runtime state. Before a large fan-out, the root announces count, purpose,
and rough cost and applies Michel's host-load formula and the runtime's four-slot ceiling.
Implementation that shares files stays sequential. Reviews occur against stable exact
ranges after the corresponding implementation stops editing.

## Installation and compatibility

The repository copy is canonical and committed. Installation copies the complete skill
directory to `~/.codex/skills/smart-model-orchestrator/` and validates the installed
copy. The skill uses Codex model identifiers:

- `gpt-5.6-luna` with `max` reasoning;
- `gpt-5.6-terra` with `high` or `xhigh` reasoning;
- `gpt-5.6-sol` with `high` or `xhigh` reasoning.

The skill must explicitly set both `model` and `reasoning_effort` for every subagent.
It must use a context-limited fork whenever it overrides either value; it must not rely
on inherited full-session context.

## Acceptance criteria

The skill is accepted only when all of these pass:

1. A no-skill baseline demonstrates at least one routing, escalation, or review failure
   under realistic combined pressure.
2. With the skill, a mechanical task selects Luna-max; an integration task selects
   Terra; and a security/concurrency task selects Sol-xhigh plus the correct specialist.
3. A stuck Luna worker emits the complete `ESCALATE` baton and the root re-dispatches on
   Terra without losing evidence.
4. A hard-override discovery jumps directly to Sol-xhigh.
5. Five completed tasks trigger a cumulative Sol-xhigh review; a final review occurs for
   fewer than five tasks.
6. A reviewer finding produces a fixer/reseal loop and cannot be self-approved.
7. Independent pressure tests show the skill resists cost pressure, deadline pressure,
   sunk-cost pressure, and a worker claiming success without evidence.
8. `quick_validate.py` accepts the canonical and installed packages.
9. The canonical and installed package hashes match.

## Consequences

This design spends more calls on review, but lowers the cost of late rework and makes
model quality auditable. Luna becomes a useful economy worker for bounded work rather
than a substitute for planning or judgment. Sol remains the planning and seal authority,
while Terra absorbs the broad middle where Luna's extra turns can cost more than a
stronger first dispatch.
