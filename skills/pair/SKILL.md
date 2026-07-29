---
name: pair
description: Use when the user wants to work together on code, inspect a direction before completion, make one bounded change at a time, or says pair, work together, stay involved, or show me the direction.
---

# Pair Programming

Make the smallest useful move, show it, and let the user choose the next move.

## Shaping

Unless the user explicitly delegates the outcome:

1. Inspect the exact scope.
2. Make only the requested change.
3. Check the diff for accidental scope.
4. Show it and stop.

The first review boundary is the diff, not a green suite or reviewer pass. Before direction approval, do not add adjacent improvements, silently add characterization coverage, refactor unrelated code, run broad checks, or dispatch implementation reviewers.

Structural edits do not create behavior, but preservation requires coverage. If existing tests protect the observable contract, preserve them; do not manufacture Red. If not, surface the gap and ask before adding the smallest characterization example. Run a focused check only when requested or when the diff alone cannot establish the move.

For a behavior spike, implement only the requested slice. A focused failing example may clarify the contract, but do not complete neighboring cases.

## Plans

Only write a plan when the user requests an implementation plan, phased roadmap, multi-PR plan, or durable handoff:

1. Draft the requested artifact using `roadmap-template.md`, writing it to an uncommitted `.pair-plans/` directory in the user's project.
2. Run `agents/plan-reviewer.md` once.
3. Fix findings and rerun until it reports no problems. After that, repeat only after a material revision.
4. Present the reviewed plan and wait for user approval before implementation.

Use a subagent when available; otherwise apply the prompt directly. Every written plan gets this review.

## Delivery and review

“Go ahead” authorizes only the bounded move under discussion. Explicit end-to-end requests such as “finish it,” “execute the plan,” or “make it commit-ready” switch to `execute-plan`.

After the user approves the direction and the implementation reaches a stable diff:

1. Run relevant tests and the project's linter on changed files.
2. Run `../ruby-programming/agents/ruby-verifier.md` once.
3. For plan-backed work, also run `agents/compliance-reviewer.md` once.

Use subagents when available; otherwise apply the prompts directly. A pass remains valid until its input changes materially. Fix findings and rerun only the affected review.

Before commit, the current diff needs a valid Ruby verifier pass; plan-backed work also needs a valid compliance pass.

## Interaction

Ask one short question only when its answer changes the next edit. On resume, inspect the live worktree before roadmap notes.

Use at most five short lines:

```text
Changed: [bounded change]
Scope: [material caveat; otherwise omit]
Next: [one question]
```

## Boundaries

Never stage or commit without explicit approval.

Before presenting, remove files, tests, cleanup, and explanation that do not serve the requested move.

Use the current runtime's capabilities and relative bundled paths. Do not require Claude-only tool names, environment variables, or agent types.
