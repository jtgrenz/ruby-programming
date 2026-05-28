---
name: brainstorm
description: Use when designing Ruby features, planning architecture, or starting implementation work that involves Ruby design decisions. Combines design pattern analysis with structured brainstorming.
disable-model-invocation: true
---

# Ruby Design Brainstorm

Structured design exploration with Ruby-specific pattern recognition. Enhances the brainstorming process with design shape analysis so proposals use concrete patterns and vocabulary, not vague "extensibility" advice.

## Process

### Step 1: Load Design Knowledge

Read these before doing anything else:
- `${SKILL_DIR}/../ruby-programming/references/design-shapes.md` — 12 shape triggers
- `${SKILL_DIR}/../ruby-programming/references/design-vocabulary.md` — terms, connascence, rejected framings
- `${SKILL_DIR}/../ruby-programming/references/preparatory-refactoring.md` — when to refactor existing code before starting TDD

### Step 2: Brainstorm Process

**If superpowers:brainstorming is available**, invoke it and follow its process through step 4 (propose approaches). It handles: exploring context, asking clarifying questions, proposing 2-3 approaches.

**If superpowers:brainstorming is NOT available**, do this yourself:
1. Explore the current codebase (files, docs, patterns in use)
2. Ask clarifying questions one at a time — purpose, constraints, success criteria
3. Propose 2-3 approaches with trade-offs and your recommendation

### Step 3: Design Analysis Enhancement

**Before presenting approaches** (whether from superpowers or self-driven), apply design analysis to each approach:

- **Axes of change**: What varies independently? Each axis suggests a seam.
- **Shape triggers**: Check all 12 shapes against the problem. Name any that match.
- **Forward question**: "If a new variant appears, how many files change?" for each approach.
- **Threshold gates**: Check before recommending any pattern. Don't over-engineer.
- **Preparatory refactoring**: Does the existing code need restructuring before the new feature? If approaches differ on this (one requires prep-refactor, another doesn't), call it out as a trade-off.
- **Connascence**: Name the coupling type each approach creates or eliminates.
- **Extension point validation**: If the design anticipates a future variant (e.g., parallel mode next month), propose stubbing it now (raise/no-op) to prove the seam works. Ship the stub — it validates the extension point and makes adding the real implementation a fill-in-the-blanks exercise.

**Be an active design partner.** For each approach, state your recommendation with rationale: "This is Shape 1 — serial and parallel carry different config. I recommend Strategy because adding Montana's parallel mode next month should be add-a-class, not edit-every-conditional. Ship ParallelTransmissionStrategy as a stub that raises — it proves the seam and makes Montana's PR purely behavioral."

Use the design vocabulary precisely — "axes of change", "seam", "mode", "variant", "depth". Not "flexible", "extensible", "clean".

**Make it readable for the team.** Most engineers haven't seen connascence or design shapes before. When using these terms:
- Always use full names on first mention (e.g., "Connascence of Meaning" not "CoM")
- Add a brief parenthetical explanation the first time — for both connascence AND SOLID: "Connascence of Meaning (when callers must remember what a boolean value *means* to use it correctly)" or "Open/Closed Principle (adding a new variant should mean adding a new class, not editing existing ones)"
- Don't assume the reader knows SOLID or connascence — treat every term as new on first use

**When writing to a GitHub PR or comment**, wrap the design analysis in a collapsible block so it doesn't overwhelm the main proposal:
```markdown
<details>
<summary>Design analysis (shapes, connascence, threshold gates)</summary>

[Full design analysis here]

</details>
```

### Step 4: Continue Process

**If superpowers:brainstorming is available**, return to it for: presenting design section-by-section, writing spec doc, spec self-review, user review gate, transition to writing-plans.

**If not available**, present the recommended approach, get user approval, and write a spec doc to `docs/specs/` or the project's preferred location.

## What This Skill Does NOT Do

- Does not write implementation code (that's execute-plan)
- Does not replace brainstorming's conversational exploration (it enhances the proposal step)
- Does not recommend patterns without checking threshold gates
