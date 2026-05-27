---
name: code-review
description: Use when reviewing Ruby code, PRs, or local changes. Wraps the built-in /code-review with design shape analysis, connascence evaluation, and the Ruby quality checklist. One command for the full review.
---

# Ruby Code Review

Full code review for Ruby: structural scan + design analysis + quality checklist. Wraps the built-in `/code-review` and adds a Ruby-specific design layer on top.

## Process

### Step 1: Identify What to Review

Determine the review target from the user's request:
- A PR number → use `gh pr diff <number>` to get the diff
- Local changes → use `git diff` (staged + unstaged)
- Specific files → read them directly

### Step 2: Design Pass (do this FIRST, before the structural scan)

Read these references once:
- `${SKILL_DIR}/../ruby-programming/references/design-shapes.md`
- `${SKILL_DIR}/../ruby-programming/references/design-vocabulary.md`

Then review the diff with design eyes:
- **Shape triggers**: Check all 12 shapes against the changed code. Name any that match.
- **Threshold gates**: For each shape found, check if the threshold is crossed. Don't recommend patterns that aren't warranted.
- **Forward question**: "If a new variant appears, how many files change?" for any polymorphism-adjacent code.
- **Connascence**: Name the coupling type the change creates or eliminates.
- **SOLID**: Cite relevant principles when they apply.
- **Rejected framings**: Flag if the diff matches any ("add a param with a default = backward compatible", "boolean flag that forks execution", etc.)

**Make it readable for the team.** Code reviews are read by the PR author AND future readers. Most engineers haven't seen connascence or design shapes before:
- Never use bare abbreviations (OCP, SRP, CoM, ISP). Always use full names on first mention: "Open/Closed Principle", not "OCP"
- Add a brief parenthetical explanation the first time: "Connascence of Meaning (when callers must remember what a boolean value *means* to use it correctly)" or "Open/Closed Principle (adding a new variant should mean adding a new class, not editing existing ones)"
- Don't assume the reader knows SOLID, connascence, or design shapes — treat every term as new on first use
- Wrap the design analysis in a `<details>` block when posting to GitHub so it doesn't overwhelm the practical feedback

### Step 3: Run Structural Scan + Ruby Verifier (in parallel)

After completing YOUR design pass, kick off both of these:

**Structural scan** — Invoke the built-in `code-review` skill via the Skill tool. Pass the PR number or relevant args. This runs the 5-agent parallel scan (CLAUDE.md compliance, bug scan, git history, prior PRs, code comments).

**Ruby verifier** — Dispatch a `general-purpose` background agent with this prompt:

```
You are a Ruby code quality verifier. Read every file listed below, then audit
against the quality checklist that follows.

## Files to Review
[LIST THE CHANGED FILES]

## Quality Checklist
[PASTE THE FULL CONTENTS OF ${SKILL_DIR}/../ruby-programming/references/quality-checklist.md]

## Rules
- Be strict. When in doubt, FAIL.
- Don't infer intent. Flag poor names even if you can guess what they meant.
- Don't skip items. Every checklist item gets a verdict.
- Don't suggest fixes. Just identify problems.
- If a checklist item doesn't apply, mark PASS with "(n/a)".

## Output Format
### FAIL (N items)
- [ ] **[item]** — [one-line reason] (`file.rb:line`)

### PASS (N items)
- [x] **[item]**
```

Read the quality checklist file once at the start and reuse for each dispatch.

### Step 4: Present Findings

Combine findings from ALL three layers. Organize by severity:

1. **Design concerns** (from your design pass — shapes, connascence, SOLID) — architectural issues
2. **Correctness issues** (from the structural scan — bugs, CLAUDE.md violations, historical context) — ship-blocking issues
3. **Quality findings** (from the ruby verifier — naming, method structure, testing patterns) — mechanical issues

When writing for a GitHub PR, wrap the design analysis in a collapsible block:
```markdown
<details>
<summary>Design analysis (shapes, connascence, threshold gates)</summary>

[Full design analysis here]

</details>
```

## What This Skill Does NOT Do

- Does not write code (suggest changes, don't implement them)
- Does not recommend patterns without checking threshold gates
