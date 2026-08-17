# 0002 — Route Codex work by risk, complexity, and independent review

- **Status:** Accepted (2026-08-17)
- **Deciders:** Michel Abboud, executed by Codex

## Context

Using the strongest model for every subtask produces excellent work but spends premium
capacity on mechanical execution. Starting every task on the cheapest model is also
inefficient: difficult integration work can require repeated turns, and security or
concurrency mistakes are more expensive than the model capacity saved.

The Task 9 experiment in `virtual-pod-apparel` showed both sides. Luna-max produced
substantial, high-quality bounded implementation, but independent Sol review still found
important proof and integration gaps. The desired operating model is a strong root that
plans, lower tiers that execute within explicit boundaries, fast escalation, and review
authority that remains independent of implementation.

## Decision

Add a global Codex skill named `smart-model-orchestrator` with these invariants:

1. Planning and architecture use the strongest available model.
2. Implementation uses the lowest capable model selected from a documented hard-override
   and five-dimension routing matrix.
3. Every subagent receives a stop-and-escalate contract; evidence is carried upward from
   Luna to Terra to Sol.
4. Every task receives independent review, hard-risk and escalated tasks receive immediate
   Sol-xhigh review, every five sealed tasks receive cumulative Sol-xhigh review, and the
   final branch always receives Sol-xhigh review.
5. Reviewers do not edit or approve their own fixes.
6. Routing, escalations, verification, and review verdicts are recorded durably.

The canonical package lives in this repository under
`skills/smart-model-orchestrator/` and is installed globally under
`~/.codex/skills/smart-model-orchestrator/`.

## Alternatives rejected

- **Use Sol for everything.** Highest single-call quality, but wastes premium capacity on
  exact, reversible work and prevents measuring whether economy models are sufficient.
- **Use Luna by default and escalate only after failure.** Cheap per call but expensive in
  total turns, and unacceptable for security, concurrency, architecture, or financial
  authority where a wrong first answer can damage the design.
- **Use a script-only numeric classifier.** Deterministic but falsely precise. Task risk,
  ambiguity, and trust boundaries require semantic judgment. The skill uses observable
  scoring dimensions with explicit hard overrides instead.
- **Let implementers self-review and run only a final review.** Misses defects while their
  context is cheap to reconstruct and allows the author to become its own seal authority.

## Consequences

- Model selection and review spend become visible in a model ledger.
- More subagent calls are expected, especially for per-task review and reseal loops.
- Strong models are reserved for planning, hard domains, escalation, and independent seal.
- The root session remains responsible for orchestration because a skill cannot change the
  already-running root model automatically.
- The policy requires forward-testing because it shapes agent discipline under cost and
  deadline pressure.

## Status

Accepted. Any future change that weakens independent review, hard-risk routing, or the
escalation ladder must supersede this ADR rather than editing it.
