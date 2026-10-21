---
name: ruby-programming
description: Use when writing, reviewing, or refactoring Ruby, Rails, RSpec, ActiveRecord, Sorbet, RuboCop, Sidekiq, Puma, or related code.
user-invocable: false
---

# Ruby Programming

Choose the work mode before applying Ruby guidance.

## Interactive shaping

Use when the user wants to work together, requests a bounded edit, wants to inspect a direction, or has not delegated the full outcome.

Make the change, show its diff, and stop. The handoff is a proposal, not a completion claim, so a general TDD or completion-verification workflow does not control this boundary. Before claiming preservation, inspect relevant coverage; if it is inadequate, surface the gap rather than silently adding tests. Avoid neighboring cleanup. Run one focused check only when requested or when its result could materially change the user's current decision. Do not run broad checks, dispatch reviewers, or prepare for commit. Follow `pair` when active.

## Requested validation

When the user names a check or asks to validate the current direction, run the narrowest check that answers that request and return its result. Do not infer permission to run the full delivery gate or switch to autonomous execution.

## Completion boundary

Use when the user explicitly asks to finalize, commit, or make an already-shaped diff commit-ready. Run relevant tests and the project's required lint and type checks on the changed scope, then inspect the complete diff. Run `ruby-verifier` only for substantial or cross-cutting Ruby changes; plan-backed work also gets one compliance review.

If finalization finds changed behavior that current coverage does not protect, add or update the smallest useful behavior coverage now and prove it. Existing relevant coverage only needs to be rerun. Do not delete and recreate approved code solely to claim a test-first sequence that did not happen.

## Autonomous delivery

Use only when the user delegates remaining implementation end to end: implement the agreed scope, fix it completely, execute a plan, or take an unimplemented scope through commit-ready verification. A request to finish an already-shaped diff belongs to the completion boundary. Follow `execute-plan` when a plan exists.

Classify other work before editing:

- Behavior change: use an existing focused example when it already expresses the missing contract; otherwise write one. Confirm the expected failure, then write the smallest coherent implementation.
- Structural or mechanical change: establish relevant coverage, then edit directly.
- Validated design or port: write the known target shape directly.

Input combinations do not earn separate examples unless they protect a distinct production decision, boundary, or failure. Put coverage at the owning layer; do not duplicate matrices across layers or pull adjacent backlog gaps into scope.

Fit established types and conventions on the first green pass. Do not deliberately introduce a naive representation merely to replace it immediately. Refactor only the requested scope. Run focused checks while working, then relevant project-required tests, lint, and types once at the completion boundary. Run broader suites only when project policy or cross-cutting risk requires them. Run one Ruby verifier pass for a substantial or cross-cutting stable diff; plan-backed work also gets one compliance review.

## Review

Remain read-only. Lead with actionable findings; do not implement them unless asked. Use `ruby-review` for a full design review.

## Core rules

- Treat the codebase as primary; follow local patterns.
- Keep scope literal; do not mix a feature with unrelated refactoring.
- Think in messages and responsibilities before classes.
- Match the file's Sorbet level without widening a bounded edit into a typing migration.
- Prefer immutable transformations and isolate mutation at boundaries.
- Apply patterns only to current complexity; an extraction must improve its caller.

## Test the message

| Message | Test |
|---|---|
| Incoming query | Return value |
| Incoming command | Side effect |
| Outgoing query | Receiver's responsibility |
| Outgoing command | Message sent |
| Private method | Do not test directly |

Add examples where the behavior belongs. Hard-code expectations instead of calling production code. Broad suites belong at a delivery boundary.

## Load details only when needed

- Design choice, pattern, seam, or connascence: `references/design-vocabulary.md`; for shapes, list the `## Shape` headings in `references/design-shapes.md` and read only the ones whose triggers match
- Existing structure may block a feature: `references/preparatory-refactoring.md`
- Advanced Sorbet decision: `references/sorbet-patterns.md`
- Final audit: `references/quality-checklist.md`
- Interaction boundaries and proportional rigor: `references/calibrating-rigor.md`

Resolve paths relative to this skill; avoid runtime-specific variables.

## User-facing output

Lead with the result or finding. Keep required pre-work progress to one sentence. Omit routine command narration, TDD stage reports, passing checklist items, and irrelevant design vocabulary. Expand only when asked.

Follow the user's configured writing style for commits, PR descriptions, and external comments. Never stage or commit without explicit approval.
