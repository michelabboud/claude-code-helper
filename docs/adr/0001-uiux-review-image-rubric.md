# 0001 — uiux-review-mcp returns image + rubric instead of server-computed scores

- **Status:** Accepted (2026-07-10)
- **Deciders:** Michel Abboud (via the 2026-07-10 remediation plan), executed by Claude

## Context

`uiux-review-mcp` exposed nine tools (`analyze_design`, `check_accessibility`,
`review_typography`, `validate_spacing`, `check_color_scheme`, `check_usability`,
`suggest_improvements`, `compare_designs`, `generate_wireframe`) whose stated job is
to analyze a UI screenshot. In practice, every analysis tool read the image only to
confirm it existed (`await fs.readFile(imagePath)`), discarded it, and returned
**hardcoded scores** (8/7/9…) and fabricated findings that were identical regardless
of the actual image. `compare_designs` chose its A/B winner with `Math.random()`. A
source comment even admitted: *"in production, Claude would analyze the actual image /
For now, we provide the structure."* This is a NO-FAKES violation: the server emitted
numbers and verdicts that looked measured but were invented, behind "Production Ready"
framing.

An MCP server written in Node has no vision capability of its own. The **calling model**
(Claude) does — MCP tool results can contain `image` content blocks, which the model
then sees and reasons over.

## Decision

The analysis tools no longer compute or return scores. Each returns:

1. the **real screenshot** as an MCP `image` content block (`{ type: "image", data:
   <base64>, mimeType }`), read from disk and encoded by a shared `imageContentBlock()`
   helper (mime type inferred from extension), and
2. a **structured evaluation rubric** (WCAG 1.4.3/1.4.4/2.4.7/2.5.8, Nielsen's
   heuristics, type-scale/spacing-grid criteria, etc.) as a text block, phrased as
   instructions to evaluate *the attached image*.

`compare_designs` returns both images plus a comparison rubric — no random winner.
`generate_wireframe` is unchanged (it deterministically renders a text description and
never claimed to analyze an image). The rubric-building logic lives in a side-effect-free
`rubrics.ts` module so it is unit-testable, and a static regression guard scans the
server source for `Math.random` / hardcoded `score:` to prevent the fabrication from
returning.

## Alternatives rejected

- **Call a vision model from inside the server.** Adds an API key, network dependency,
  cost, and latency to what is a local dev tool, and duplicates the vision capability the
  calling model already has. Rejected.
- **Keep numeric scores but label them "illustrative."** Still ships numbers that read as
  measurements; users (and downstream tooling) would treat them as real. Rejected — this
  is the quality-theater the NO-FAKES rule exists to prevent.
- **Delete the tools.** The rubric content is genuinely useful domain knowledge; the only
  problem was presenting invented findings as fact. Rejected in favor of repurposing.

## Consequences

- **Honest by construction:** the server never emits a score it did not compute, because
  it computes none. The analysis is done by the vision-capable caller against a real image.
- **Backward compatible at the interface:** tool names and input schemas are unchanged;
  only the response *content* changed (text-only → image + rubric).
- A documented cast is needed at the `mcp-shared` tracked-handler boundary, because that
  shared type currently models text-only content while the MCP protocol permits image
  blocks. A future improvement is to widen the shared handler type to the full MCP content
  union so the cast can be removed.
- Tests assert the response shape (image block + rubric, no hardcoded score) rather than
  specific numeric outputs.
