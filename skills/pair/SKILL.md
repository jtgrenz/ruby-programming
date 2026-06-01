---
name: pair
description: Use when building a feature collaboratively across multiple PRs, when scope spans short-term delivery and long-term design, or when the user wants to stay involved and not have the agent auto-execute. Triggers on pair programming, phased implementation, multi-PR feature work, collaborative coding, "work together", "don't just build it", "stay involved".
disable-model-invocation: true
---

# Pair Programming

Sustained collaborative work where the agent is a thinking partner, not an executor. The user stays in the loop at every step. Work happens in phases — each phase gets its own PR, its own implementation plan, and full user review before anything is committed.

**Session hygiene.** Every loaded skill and MCP server is re-read on every turn. Before a long run, disable the ones the work won't touch (e.g. data/Jira/frontend tooling for a backend Ruby feature). One-time setup, not part of the loop.

<HARD-GATE>
NEVER auto-transition to writing-plans, subagent-driven-development, or executing-plans. Those skills execute continuously without user checkpoints. Pair mode means the user controls every transition. If you catch yourself thinking "I'll just invoke writing-plans to speed this up" — stop. That's the opposite of what this skill does.
</HARD-GATE>

## Process

### Phase 1: Context Building

Two rounds of questions. Do not combine them.

**WHAT round** (3-5 questions, one at a time):
- What are we building?
- What exists today? Where does it live in the codebase?
- What's the input/output? Who uses it?
- What's the immediate deliverable?

**WHY round** (3-5 questions, one at a time):
- Why are we building this now?
- Is this a one-off or part of a larger system?
- What's coming in the next 1-3 months that relates to this?
- Are there similar-but-different variants planned? (e.g., one client now, several later)
- What would make this design wrong in 6 months?

**Migration safety** — if the WHAT or WHY reveals that this work replaces or migrates an existing production system, ask:
- How do we safely transition from the old system to the new one?
- Can we run both in parallel to validate before cutting over?
- What's the rollback plan if something goes wrong?
- What does "safe to cut over" look like — how do we know the new system is ready?

This doesn't fire for greenfield features. It fires when you're replacing something that's live in production — especially when the work ships piecemeal across multiple PRs.

The WHY round is what prevents building something technically correct that paints you into a corner. Don't skip it — even for "simple" tasks.

<HARD-GATE>
Do NOT proceed to Phase 2 until you can answer both: "What is the immediate deliverable?" AND "What is the 3-month context this lives in?" If the user says "I don't know" to the future questions, that's a valid answer — document it as "future direction unknown, optimizing for flexibility" and proceed.
</HARD-GATE>

### Phase 2: Codebase Research

Read these before searching:
- `${SKILL_DIR}/../ruby-programming/references/design-shapes.md`
- `${SKILL_DIR}/../ruby-programming/references/design-vocabulary.md`

Search the codebase for:
- Existing patterns related to what we're building
- Interfaces the new code will interact with
- Similar features that might inform the design
- Code that will need to change in future phases

Present findings using the design vocabulary. Name shapes, axes of change, connascence. Example: "I found the existing TransmissionStrategy uses Shape 1 — mode-dependent fields. Given your plan to add parallel mode, the Strategy pattern seam is already there."

<HARD-GATE>
Present research findings to the user and wait for confirmation before proceeding. The user may know things the codebase doesn't reveal.
</HARD-GATE>

### Phase 3: Phased Roadmap

Create a living roadmap document using `${SKILL_DIR}/roadmap-template.md`. Scale the document to the work — a 2-phase bug fix series gets a short doc, a 6-phase feature gets the full treatment.

Key constraints:
- Each phase targets <600 lines of code changes (excluding auto-generated fixtures, which get their own commit)
- Each phase gets its own PR
- YAGNI for implementation, but leave seams for known future work. Ship stubs (raise/no-op) to prove extension points work.
- Include "revisit when" conditions for design decisions — so future sessions know when assumptions expire

**Stay at the WHAT/WHY level.** The roadmap defines what each phase delivers and why in that order — not how it's implemented. Design shape observations are useful when they inform phasing: "This looks like Shape 1 — there's a protocol-level concern and an agency-specific concern, which suggests separating them into different phases." But detailed implementation decisions (specific classes, interfaces, response types) belong in the per-phase implementation plan in Phase 4, not here.

**Build vs. reuse vs. refactor.** For each component the roadmap mentions, explicitly note whether it's: (a) new code to build, (b) existing code to reuse as-is, or (c) existing code that needs refactoring or replacement. Pay special attention to dependencies on systems mentioned in the WHY context — if something is being deprecated or migrated away from, don't build new dependencies on it. Call out the dependency and flag whether it needs a replacement.

Save to `.pair-plans/<short-plan-name>/roadmap.md`, where `<short-plan-name>` is a kebab-case slug for the feature (e.g. `withholding-period-totals`). This folder is the single home for everything this pairing feature needs — the roadmap and every phase plan live together so a future session can resume from one place. These are uncommitted working documents; the PR description, not the roadmap, is the durable team-facing artifact.

**Plan review.** Before presenting the roadmap to the user, dispatch a `general-purpose` agent using the plan-reviewer prompt (see `${SKILL_DIR}/agents/plan-reviewer.md`). Give it the WHAT/WHY summary and the proposed roadmap. Fix any issues the reviewer finds before presenting to the user.

<HARD-GATE>
The user MUST review and approve the roadmap before any implementation begins. Present it and ask: "Does this phasing make sense? Should we adjust anything before starting Phase 1?" Wait for explicit approval.
</HARD-GATE>

### Phase 4+: Iterative Phase Execution

**Default rhythm: one session per phase.** The `.pair-plans/<short-plan-name>/` folder is the durable handoff, not the conversation — finish a phase, then start the next in a fresh session (see Session Continuity). One long session spanning every phase accumulates context fast.

The loop for each phase:

**1. Plan together.** Write a detailed plan for just this phase — what files change, what tests to write, what order.

Check whether existing code needs preparatory refactoring before the feature work (see `${SKILL_DIR}/../ruby-programming/references/preparatory-refactoring.md`). If yes, follow the Prep-Refactor Path:
- **Structure is clear** → locate the seam, plan the prep-refactor as a separate commit at the start of the phase.
- **Structure is messy but emerging** → schedule tidying (small committed improvements) at the start of the phase until the seam becomes visible.
- **Lost** → schedule scratch refactoring first (throwaway branch to learn the structure — save learnings to `.pair-plans/<short-plan-name>/scratch-notes.md`, then discard the branch). Once the structure is visible, locate the seam.

Save the plan as a numbered markdown file in this feature's folder (e.g., `.pair-plans/<short-plan-name>/001-phase-1.md`, `002-phase-2a.md`, `003-phase-2b.md`). Number sequentially; split a phase into `2a`/`2b` when it grows past the LOC budget. These are working documents — do NOT commit them. They exist so future sessions can pick up mid-phase. Present the plan to the user for approval. Do NOT invoke `writing-plans` — that auto-transitions to execution.

**2. Build — decide inline vs subagent first.** Make this call *before reading any build guidance*: if you offload, the builder reads it in its own context, so loading it here first wastes the savings. Default to inline; offer the subagent per phase, only when the user opts in, and favor it for mechanical phases over ones where the design is still being discovered at the keyboard.

- **Subagent (token saving, with a tradeoff).** The user isn't in the loop *during* the build — they review the finished diff in step 3 — so dispatch the **ruby-builder** agent (see `${SKILL_DIR}/../ruby-programming/agents/ruby-builder.md`) with the approved phase plan and the WHAT/WHY context. It reads the implementer guidance itself, runs the quality loop, self-checks against the checklist until clean, and hands back a summary plus the diff. It does **not** commit, present, or run review gates — its prompt enforces that. **Do NOT read the implementer prompt yourself** — that guidance stays off the main thread too. **Tradeoff:** step 3's teaching ("name patterns as you apply them") gets reconstructed from the diff rather than narrated live, so the pairing feel softens.
- **Inline.** Read `${SKILL_DIR}/../execute-plan/implementer-prompt.md` (Shameless Green, pre-flight sweep, simplify) and run the full quality loop yourself — Red, Green, Refactor, Simplify, Pre-flight — without pausing at intermediate steps. The user doesn't need to see the failing test or the shameless green separately. Phases should be small enough that the final code is reviewable.

**Quality + compliance gates — run in parallel.** Dispatch both concurrently on the phase diff — they're independent, so don't wait for one before the other:
- **ruby-verifier** (see `${SKILL_DIR}/../ruby-programming/agents/ruby-verifier.md` and `${SKILL_DIR}/../ruby-programming/references/quality-checklist.md`) — mechanical quality, fresh eyes.
- **compliance-reviewer** — a `general-purpose` agent using the compliance-reviewer prompt (see `${SKILL_DIR}/agents/compliance-reviewer.md`). Give it the WHAT/WHY summary, the roadmap, and the code diff.

When both return: if either has FAILs, fix every item — or, if the build ran in ruby-builder, re-dispatch the builder with the items rather than fixing on the main thread — then re-dispatch **both** gates in parallel again. A verifier fix can shift compliance scope and vice versa, so re-run both rather than reasoning about which to repeat. Loop until both come back clean.

**3. Review together.** When both the verifier and compliance reviewer pass, present the final code to the user — what changed, why, and how it connects to the broader design. Teach as you go:
- Name patterns as you apply them: "This is Shape 4 — parallel conditionals."
- Use the forward question: "If a new variant appears, how many files change?"
- When placing extension points, explain what they're for.
- When refactoring, name the flocking rule or design improvement.
- Be ruthless about simplicity — every line earns its place.

The user reviews, asks questions, requests changes. Iterate until both sides are happy.

**4. Commit.** Only after the user approves. Follow the "Writing About Code" section in the ruby-programming skill. User's personal writing style (if configured) takes precedence.

<HARD-GATE>
NEVER run `git commit` or `git add` without the user's explicit approval. No silent commits. Never mix refactoring and feature work in the same commit.
</HARD-GATE>

**5. Repeat — and prefer a fresh session.** Update the roadmap (mark phase complete, note what changed, adjust future phases) and capture any phase-completion notes into the phase plan. Then, before moving on, run the handoff check below and offer a fresh session.

**Handoff check (do this before offering to clear context).** A fresh session is only safe if `.pair-plans/<short-plan-name>/` holds everything the next session needs. Verify, in order:
1. The roadmap reflects the just-finished phase (status, what changed, impact on future phases).
2. The next phase's plan exists, or there's enough in the roadmap to write it cold.
3. **Nothing learned this session lives only in the transcript.** Scan since the docs were last written — decisions, surprises, constraints, anything the user said that isn't in the code. Write it into the roadmap or phase plan *now*, or it's lost on `/clear`.

Only once the docs are complete, ask: **"Clear context and start the next phase fresh, or keep going in this session?"** Fresh is the default and the cheaper path; staying is fine for a small next phase or when the user wants continuity of discussion. The user decides — never clear on your own.

### Session Continuity

Each pairing feature lives in `.pair-plans/<short-plan-name>/` — `roadmap.md` plus the numbered phase plans. To resume (new session or after `/clear`), invoke `/pair` and point at that folder. Read the roadmap and the latest phase plan, identify the current phase, and pick up there. The handoff check guarantees the folder is complete, so a fresh session loses no ground — it just sheds the token weight of the prior phases.

## When to Use This vs Other Skills

- **pair** — sustained work across multiple PRs where you want to stay involved at every step
- **brainstorm** — quick design exploration that hands off to writing-plans and execution
- **execute-plan** — well-scoped implementation where continuous execution is fine

If you're not sure: pair is the safe default. You can always speed up by saying "go ahead." You can't slow down execute-plan once it starts.

## Anti-Patterns

| Rationalization | Reality |
|---|---|
| "I'll commit and show them after" | No. The user reviews before any commit. Every time. |
| "The plan is approved so I can skip the review" | Plan approval authorizes scope. The user still reviews the final code. |
| "The verifier passed so it's ready to commit" | The verifier checks mechanical quality. The user reviews design intent and correctness. Both are required. |
| "I'll invoke writing-plans to be more efficient" | Writing-plans auto-transitions to execution. That's the opposite of pair mode. |
| "This phase is too small to need a plan" | Every phase gets a plan the user approves. Small plans are fast to review. |
| "I'll reuse the existing client/library for convenience" | Check the WHY context. If that dependency is being deprecated, convenience now is pain later for every future consumer. |

## What This Skill Does NOT Do

- Does not replace brainstorm (use brainstorm for quick design explorations that hand off to execution)
- Does not invoke writing-plans, subagent-driven-development, or executing-plans
- Does not execute autonomously between user checkpoints
- Does not commit without explicit user approval
