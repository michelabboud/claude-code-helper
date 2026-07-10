---
name: route-language-task
skill_name: Route Language Task
description: 'Score a coding task by complexity (1-10) and recommend the right model (haiku/sonnet/opus) before invoking a language agent. Holds the per-language rubric for all language/framework experts.'
argument-hint: '<language> <task description> | hello | hello ID'
user-invocable: true
version: 1.0.0
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Route Language Task

Single source of truth for **complexity-aware model selection** across all language/framework agents in this repo. Implements Pattern B from the routing design — the dispatcher consults this skill **before** invoking a language agent so the right model is locked in at invocation time.

This skill is also the canonical reference for the rubrics embedded inline in each language agent (Pattern A) and self-referenced by each agent's Complexity Self-Assessment Protocol (Pattern C).

## Usage

```
/route-language-task <language> <task description>
/route-language-task rust "rewrite the storage layer to use Pin-projected self-referential streams"
/route-language-task python "add a /healthz endpoint to the FastAPI app"
```

The skill returns:

```
Score: 8/10
Model: opus
Drivers: base 1 +2 unsafe (Pin projection) +2 self-referential lifetime puzzle +2 async stream internals (custom Stream/Pin) +1 cross-crate refactor = 8
Recommendation: Invoke rust-expert on model opus.
```

(Each driver is a distinct rubric concept counted once; `cross-crate refactor` is `+1` per the rubric; the numbers sum to the score.)

## Routing Thresholds (universal)

| Score | Model  | Rationale                                                  |
|-------|--------|------------------------------------------------------------|
| 1–3   | haiku  | Boilerplate, formatting, dependency bumps, obvious fixes   |
| 4–6   | sonnet | Default — most feature work, refactoring, normal debugging |
| 7–10  | opus   | Type-system depth, soundness/concurrency analysis, perf    |

**Base score**: 1. Add modifiers from the rubric. Cap at 10.

## How to Use This Skill

**As a dispatcher (main Claude or `Agent` caller):**
1. Identify the target language (file extension, keywords, or user mention).
2. Read the rubric for that language below.
3. Add up modifiers that match the task, **counting each distinct concept once** — if a task matches two rubric lines describing the same underlying concept (e.g. `Pin` appears under both the lifetime line and the async line), score it once, at the higher value. Default to base 1 if nothing matches.
4. Map the score to a model.
5. Dispatch the `<lang>-expert` agent on the chosen model. Where the sub-agent tool accepts a per-call model (this harness's `Task`/`Agent` tool does — pass `model: "<chosen>"` alongside `subagent_type: "<lang>-expert"`), the model is locked at invocation. If your harness sets a sub-agent's model only via its frontmatter, surface the recommended model to the user instead of forcing a lower tier.

**As an agent (Self-Assessment, Pattern C):**
At the start of every task, run the rubric internally. If your score exceeds the band of the model you're running on, **stop** and respond:

> "Complexity score: X/10 (drivers: ...). I'm on {current_model} but this task scores in the {recommended_model} band. Recommend re-invoking with `model: {recommended_model}`. Proceeding now would risk: ..."

Do not proceed without explicit user override. This is a circuit breaker, not a router — the model is locked at invocation, the agent can only halt and request escalation.

## Per-Language Rubrics

### Rust (`rust-expert`)
- **+2** unsafe blocks, FFI bindings, raw pointers, `transmute`, `MaybeUninit`
- **+2** non-trivial lifetime puzzle: HRTB, GAT, variance, self-referential, `Pin` projection
- **+2** async runtime internals: custom `Future`/`Stream`/`Waker`, `Pin`/`Unpin`, manual `poll_*`
- **+2** soundness analysis (running Miri/Loom/Shuttle, reasoning about UB)
- **+1** proc-macros, complex `macro_rules!`, `build.rs` codegen
- **+1** trait coherence / orphan rule conflicts, specialization workarounds
- **+1** cross-crate refactor touching public APIs, semver-breaking changes
- **+1** perf hot path: SIMD, allocator tuning, cache-line layout

### Go (`go-expert`)
- **+2** custom synchronization (`sync.Cond`, lock-free with `sync/atomic`, race conditions)
- **+2** generics with complex type sets / constraints
- **+2** `cgo`, `unsafe`, runtime/scheduler internals
- **+1** reflection-heavy code, `go generate` pipelines
- **+1** cross-package interface refactoring
- **+1** perf optimization (escape analysis, allocation reduction, pprof analysis)
- **+1** non-trivial gRPC / protobuf code generation flows

### Python backend (`python-backend-expert`)
- **+2** metaclass / descriptor / `__init_subclass__` / class-creation magic
- **+2** asyncio/event-loop bugs, custom protocols, transport hacking
- **+2** type-system gymnastics: `Protocol`, `ParamSpec`, `TypeVar` variance, generics
- **+1** C extensions / FFI (`ctypes`, `cffi`, `cython`)
- **+1** framework internals (FastAPI dependency tree, Django ORM autoloader)
- **+1** GIL / multiprocessing / nogil edge cases
- **+1** ORM N+1 / query optimization deep dives

### Node.js + TypeScript (`nodejs-typescript-backend-expert`)
- **+2** advanced TS types: conditional, mapped, recursive, template-literal, distributive unions
- **+2** module/build interop: ESM/CJS hybrid, bundler internals, dual-package hazards
- **+2** V8-level perf, memory leak hunting, heap snapshot analysis
- **+1** native bindings (N-API, node-gyp)
- **+1** worker threads, cluster, multi-tenant isolation
- **+1** stream/backpressure design, transform pipelines
- **+1** ambient module declarations, DefinitelyTyped-grade typings

### Java + Spring Boot (`java-spring-boot-expert`)
- **+2** generics with wildcards, F-bounded types, type erasure traps
- **+2** Project Reactor (`Mono`/`Flux`) composition, backpressure, hot/cold flows
- **+2** JVM internals: classloader, GC tuning, JIT, JFR analysis
- **+1** Spring AOP, custom annotations + processors
- **+1** `@Transactional` propagation/isolation edge cases
- **+1** reflection, bytecode manipulation, ASM/ByteBuddy
- **+1** native interop (FFM API, JNI, JNA)

### Ruby + Rails (`ruby-rails-expert`)
- **+2** metaprogramming: `define_method`, `method_missing`, `prepend` ancestry tricks
- **+2** ActiveRecord query optimization, polymorphic+recursive joins
- **+2** concurrency: `Thread`, `Fiber`, `Ractor`
- **+1** monkeypatching across gem boundaries
- **+1** Rails internals: Railties, engines, Zeitwerk autoloader
- **+1** C extensions
- **+1** Sidekiq concurrency edge cases, idempotency design

### PHP (`php-expert`)
- **+2** advanced OOP: traits with conflict resolution, late static binding
- **+2** PHP 8+ attributes, enums implementing interfaces, readonly classes, asymmetric visibility
- **+2** fiber-based async (Amphp v3, ReactPHP), green-thread coordination
- **+1** reflection-based codegen / proxy generation
- **+1** opcache / preloading / JIT internals
- **+1** SAPI internals, custom request handlers
- **+1** type juggling / coercion edge cases

### Laravel (`laravel-expert`)
- **+2** Eloquent advanced: polymorphic + recursive, query-scope composition, chunked + transactional
- **+2** service container deep binding (contextual, tagged, primitive injection, scoped instances)
- **+2** queue/job concurrency, exactly-once design, race conditions
- **+1** Livewire/Volt reactive lifecycle bugs
- **+1** broadcasting/channels with auth + presence
- **+1** Horizon scaling / Octane edge cases
- **+1** custom Artisan commands integrating scheduler + signals

### React + Next.js (`react-nextjs-expert`)
- **+2** SSR/hydration mismatches, RSC client/server boundaries
- **+2** advanced TS generics in components (polymorphic `as` props, ref forwarding)
- **+2** concurrent features: Suspense boundaries, transitions, `useDeferredValue`, useEffectEvent
- **+1** perf debugging (Profiler, render bailouts, memo correctness)
- **+1** Webpack/Turbopack internals, custom loaders
- **+1** Server Actions + streaming + revalidation orchestration
- **+1** library integration with ref forwarding + portals

### Vue + Nuxt (`vue-nuxt-expert`)
- **+2** reactivity edge cases: `ref` vs `reactive`, deep tracking, shallowRef traps
- **+2** SSR hydration / Nitro runtime customization
- **+2** complex composables with effect scope + cleanup choreography
- **+1** custom directives, plugin authoring with hookable API
- **+1** advanced TS in `<script setup>`, generic components
- **+1** Vite/build tool customization, transform pipelines
- **+1** transition/animation orchestration

### Svelte + SvelteKit (`svelte-expert`)
- **+2** runes-based reactivity in libraries (cross-component invariants)
- **+2** SSR + form actions + progressive enhancement coordination
- **+2** complex transition orchestration (crossfade, custom transitions)
- **+1** stores with derivation chains, contextual invariants
- **+1** adapter customization (Cloudflare Workers, Vercel edge quirks)
- **+1** hooks: `handle`, `handleFetch`, `handleError`
- **+1** TypeScript with `$bindable` / `$props` variance

### Angular (`angular-expert`)
- **+2** advanced RxJS: multicasting, error recovery, custom operators
- **+2** change detection internals: zone vs zoneless, signals interop, OnPush traps
- **+2** standalone migration / AOT pipeline / build-target gymnastics
- **+1** custom decorators, DI provider trees, hierarchical injectors
- **+1** form composition: typed forms, `ControlValueAccessor`
- **+1** animation API choreography
- **+1** SSR + Angular Universal hydration

### Android (`android-expert`, `android-dev`)
- **+2** coroutine scope/lifecycle bugs (`StateFlow`/`SharedFlow` buffering, cancellation propagation)
- **+2** custom Compose layouts (`SubcomposeLayout`, custom modifiers, layout phases)
- **+2** NDK / JNI interop
- **+1** Gradle build customization, Kotlin Symbol Processing (KSP)
- **+1** Hilt scoping / multi-module DI graphs
- **+1** Room migrations with destructive-fallback edge cases
- **+1** Baseline Profiles, Macrobenchmark, startup analysis

### iOS / Swift (`ios-development-expert`)
- **+2** generic type inference: existential vs opaque, primary associated types
- **+2** Swift Concurrency: actor isolation, sendable boundaries, structured cancellation
- **+2** memory cycles: closure captures, weak/unowned, `@MainActor` traps
- **+1** SwiftUI environment / preference key composition
- **+1** Combine publisher composition, custom subscribers
- **+1** Objective-C bridging edge cases, `@objc` runtime
- **+1** Metal / Accelerate / advanced perf

### Flutter / React Native (`flutter-react-native-expert`)
- **+2** platform channels, native modules, codec design
- **+2** Reanimated worklets / shared values (RN), `runOnJS` boundaries
- **+2** Flutter custom paint / shader / Skia engine integration
- **+1** navigation deep linking with state preservation
- **+1** build variants / flavors / multi-environment configs
- **+1** codegen pipelines (BuildRunner, Hermes precompilation)
- **+1** ProGuard / R8 / minification interactions

### WordPress (`wordpress-expert`)
- **+2** complex hook interactions, action/filter dependency cycles
- **+2** multisite / network admin / cross-blog data
- **+2** custom REST API endpoints with auth + capability checks
- **+1** plugin compatibility resolution, version-skew conflicts
- **+1** Gutenberg block development with InnerBlocks + dynamic blocks
- **+1** WooCommerce internals (cart, checkout, order pipeline)
- **+1** WP_Query optimization, custom query classes

## Tie-Breaking Rules

1. **Multi-language tasks**: Score against each language and take the **maximum**.
2. **Score at a band ceiling** (exactly 3 = top of haiku, exactly 6 = top of sonnet): if any `+2` modifier contributed, escalate to the next band (3 → sonnet, 6 → opus). Scores are integers, so this is a band-ceiling escalation, not rounding.
3. **Production / safety-critical context**: bump one band up (sonnet → opus, haiku → sonnet).
4. **User explicitly requested a model**: user wins; record the override and proceed.
5. **Unknown / out-of-scope language**: default to sonnet, log "rubric not defined".

## Instructions

When invoked with `<language> <task>`:

1. Match `<language>` (case-insensitive) to a section above. Aliases:
   - `ts`, `typescript`, `node`, `nodejs` → Node.js + TypeScript
   - `js`, `javascript` → Node.js + TypeScript (or React/Vue/Svelte/Angular if framework named)
   - `py` → Python backend
   - `kotlin`, `android` → Android
   - `swift` → iOS
   - `dart`, `flutter`, `rn`, `react-native` → Flutter / React Native
2. Read the task description. Identify modifiers that apply.
3. Compute `score = 1 + sum(modifiers)`, capped at 10.
4. Apply tie-breaking rules.
5. Output:

```
Language: <name>
Score: <n>/10
Drivers: <list of modifiers, with their +N value>
Model: <haiku|sonnet|opus>
Agent: <lang>-expert
Invocation: Agent({subagent_type: "<lang>-expert", model: "<model>", prompt: "..."})
```

When invoked with `hello`:
> 🧭 Hello! I'm **Route Language Task** v1.0.0. I score coding tasks 1-10 and pick the right model. Use `/route-language-task hello ID` for the full guide.

When invoked with `hello ID`:
- **Name**: Route Language Task v1.0.0
- **Description**: Complexity-aware model selection for language/framework agents.
- **How to invoke**: `/route-language-task <language> <task description>`
- **Patterns**: Implements Pattern B (router); referenced by Pattern A (description rubric) and Pattern C (agent self-assessment) in every language agent.
- **Languages covered**: Rust, Go, Python, Node/TS, Java, Ruby, PHP, Laravel, React/Next, Vue/Nuxt, Svelte, Angular, Android, iOS, Flutter/RN, WordPress.
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

## Notes

- Rubrics are intentionally tuned for *signal*, not exhaustiveness — if a task has no listed driver, sonnet is the right default.
- The agent description (Pattern A) carries a one-line rubric summary for fast dispatcher reads; this skill carries the full rubric for deliberate routing.
- Agents themselves carry the Complexity Self-Assessment Protocol (Pattern C) referencing this skill — they halt and request escalation if their assessment exceeds the band of the model they were invoked with.
- When updating a rubric, update **here**, then propagate the one-line summary to the agent's `description:` field.

## Changelog

### 1.0.0 (2026-05-08)
- Initial release covering 16 language/framework agents.
- Implements Pattern B (router) of the A+B+C routing design.

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
