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

Treat this handoff as a proposal, not a completion claim. Do not invoke a general TDD or completion-verification workflow merely to show a coherent direction. Run one focused check only when requested or when its result could materially change the user's current decision; otherwise show the diff and state that final verification is deferred.

Structural edits do not create behavior, but preservation requires coverage. If existing tests protect the observable contract, preserve them; do not manufacture Red. If not, surface the gap and ask before adding the smallest characterization example.

For a behavior spike, implement only the requested slice. A focused failing example may clarify the contract, but do not complete neighboring cases.

## Plans

Only write a plan when the user requests an implementation plan, phased roadmap, multi-PR plan, or durable handoff:

Every roadmap or pair plan begins with a highlighted document TL;DR and compact At a Glance table covering every phase, task, PR, and named subsection below it. Give every named section, phase, task, and PR its own highlighted local TL;DR; a descriptive `<summary>` serves that role for a collapsed resume section. Keep prose sections to two short paragraphs; use bullets, tables, and labeled `<details>` blocks for agent-resume detail that would interrupt the human scan path.

1. Draft the requested artifact using `roadmap-template.md`, writing it to an uncommitted `.pair-plans/` directory in the user's project.
2. Present its human-readable TL;DR and at-a-glance sections immediately, then wait for direction approval.
3. After direction approval and before implementation, run `agents/plan-reviewer.md` once.
4. Fix blocking findings and surface useful advisory findings. Rerun only when the fix materially changes scope, ordering, or migration safety.
5. Present only the changed summary and affected sections, then wait for final approval before implementation.

Use a subagent when available; otherwise apply the prompt directly. Every written plan gets one review before execution, but reviewer work must not delay the user's first look at its direction.

## Validation and delivery

“Go ahead,” “looks right,” and direction approval authorize only the next bounded move under discussion. They do not start final verification.

If the user requests one or more named checks, run only that named scope and show the results. Remain in shaping unless they explicitly ask to finalize the work.

“Finalize this,” “finish this shaped diff,” “make it commit-ready,” or “commit it” opens the completion boundary for the current approved diff. A request to implement the remaining scope end to end, including “execute the plan,” switches to `execute-plan`.

At the completion boundary:

1. Run relevant tests and the project's required lint and type checks on the changed scope.
2. Inspect the complete diff for accidental scope.
3. Run `../ruby-programming/agents/ruby-verifier.md` for a substantial or cross-cutting Ruby change: multiple behavioral files, a new public interface or design shape, or a change whose callers span components.
4. For plan-backed work, also run `agents/compliance-reviewer.md` once.

Use subagents when available; otherwise apply the prompts directly. A pass remains valid until its input changes materially. Fix findings and rerun only the affected review.

A small planless mechanical diff does not need a Ruby verifier unless the user requests a full audit. If finalization finds changed behavior that current coverage does not protect, add or update the smallest focused coverage and verify it. Existing relevant coverage only needs to be rerun; never add a ceremonial test or recreate approved implementation merely to manufacture a Red step.

## Interaction

Ask one short question only when its answer changes the next edit. On resume, inspect the live worktree before roadmap notes.

During shaping, use at most five short lines:

```text
Changed: [bounded change]
Scope: [material caveat; otherwise omit]
Next: [one question]
```

## Boundaries

Never stage or commit without explicit approval.

Before presenting, remove files, tests, cleanup, and explanation that do not serve the requested move.

Use the current runtime's capabilities and relative bundled paths. Do not require Claude-only tool names, environment variables, or agent types.
