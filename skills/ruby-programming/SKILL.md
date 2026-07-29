---
name: ruby-programming
description: Use when writing, reviewing, or refactoring Ruby, Rails, RSpec, ActiveRecord, Sorbet, RuboCop, Sidekiq, Puma, or related code.
user-invocable: false
---

# Ruby Programming

Choose the work mode before applying Ruby guidance.

## Interactive shaping

Use when the user wants to work together, requests a bounded edit, wants to inspect a direction, or has not delegated the full outcome.

Make the change, show its diff, and stop. Before claiming preservation, inspect relevant coverage. If it is inadequate, surface the gap rather than silently adding tests. Avoid neighboring cleanup. Run a focused check only when the diff cannot establish the move; do not run broad checks, dispatch reviewers, or prepare for commit. Follow `pair` when active.

## Autonomous delivery

Use only when the user explicitly asks to finish, fix completely, execute a plan, or make the work commit-ready. Follow `execute-plan` when a plan exists.

Classify other work before editing:

- Behavior change: write a focused failing example, then the smallest coherent implementation.
- Structural or mechanical change: establish relevant coverage, then edit directly.
- Validated design or port: write the known target shape directly.

Fit established types and conventions on the first green pass. Do not deliberately introduce a naive representation merely to replace it immediately. Refactor only the requested scope. Run focused checks while working, then project-required tests, lint, and types once at the completion boundary. Run one Ruby verifier pass on the stable diff; plan-backed work also gets one compliance review.

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
- Shaping versus delivery: `references/calibrating-rigor.md`

Resolve paths relative to this skill; avoid runtime-specific variables.

## User-facing output

Lead with the result or finding. Keep required pre-work progress to one sentence. Omit routine command narration, TDD stage reports, passing checklist items, and irrelevant design vocabulary. Expand only when asked.

Follow the user's configured writing style for commits, PR descriptions, and external comments. Never stage or commit without explicit approval.
