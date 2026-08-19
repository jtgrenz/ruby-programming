---
name: execute-plan
description: Use when the user explicitly delegates completion of an approved Ruby implementation plan or the remaining implementation of a well-scoped Ruby change through commit-ready verification. Not for exploratory work, bounded edits, an already-shaped diff needing only validation/finalization, or a direction still being chosen — those use `pair`.
---

# Execute a Ruby Plan

Complete the approved outcome autonomously. Keep the controller lean and reserve the expensive checks for meaningful boundaries.

## Entry gate

Require an implementation plan or an equally explicit agreed scope whose remaining implementation has been delegated. If the direction is still being evaluated, or the user only wants checks on an already-shaped diff, return to `pair`; do not turn a shaping or validation turn into autonomous delivery.

Before executing a written plan, confirm it received both direction approval and a final user approval after its latest required plan-reviewer pass. If the review is missing, run `../pair/agents/plan-reviewer.md` once, address blocking findings, surface advisory findings, present the changed summary and affected sections, and stop for final approval. Rerun only when a fix materially changes scope, ordering, or migration safety. Never review an unreviewed plan and begin implementing it in the same turn.

Read `implementer-prompt.md` before implementation. Resolve it relative to this skill directory.

## Execute

1. Inspect the current worktree and every file named by the plan.
2. Divide work by independently reviewable outcomes, not by tiny Red/Green mechanics.
3. Use the runtime's subagent capability only when tasks are genuinely independent or a fresh context materially helps; delegate implementation with `../ruby-programming/agents/ruby-builder.md`.
4. Apply the behavior, known-design, or structural loop from `implementer-prompt.md`.
5. Continue through the plan unless an unexpected decision changes scope or architecture.

Do not add speculative work. When an unplanned file is required, record why it is necessary to the approved outcome.

## Verify

Run focused checks during implementation. At the completed delivery boundary:

1. Run the relevant spec files.
2. Run the project's required linter and type checks on changed code.
3. Run broader suites once when project policy or cross-cutting risk requires them.
4. Inspect the complete diff against the plan.
5. For a substantial or cross-cutting Ruby diff, run `../ruby-programming/agents/ruby-verifier.md` once on the stable diff.
6. For a written plan, run `../pair/agents/compliance-reviewer.md` once against the same diff.

Run the two final reviewers in parallel when both apply. A substantial or cross-cutting change spans multiple behavioral files, introduces a public interface or design shape, or has callers across components; a small mechanical plan does not need the Ruby verifier. If subagents are unavailable, apply the prompts directly. A review remains valid until its code or plan changes materially. Fix concrete failures, then rerun only affected checks and reviews; do not restart every gate after each edit.

## Finish

Return a concise handoff:

- completed outcome;
- material plan deviations;
- failed checks, or one line saying verification passed;
- whether the work remains uncommitted.

Never stage or commit without explicit approval.

## Runtime portability

Use capabilities available in the current runtime. Do not require Claude-specific tool names, environment variables, agent types, or Superpowers. When those facilities exist they may help, but they are not dependencies.
