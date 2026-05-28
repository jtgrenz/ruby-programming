---
name: ruby-review
description: Use when reviewing Ruby code, PRs, or local changes. Adds design shape analysis, connascence evaluation, and the Ruby quality checklist. Run alongside /code-review for full coverage.
allowed-tools: Bash(gh pr view *), Bash(gh pr diff *), Bash(gh api *), Bash(command git diff *), Bash(command git log *), Bash(command git blame *), Read, Grep, Glob, Agent
---

# Ruby Code Review

Design-focused code review for Ruby. Checks design shapes, threshold gates, connascence, and runs the quality checklist. Complements the built-in `/code-review` (structural scan) — run both for full coverage.

## Process

### Step 1: Identify What to Review

Determine the review target from the user's request:
- A GitHub PR URL (e.g. `https://github.com/Gusto/zenpayroll/pull/1234`) → extract the owner, repo, and PR number from the URL, then use `gh pr diff <number> --repo <owner>/<repo>` to get the diff
- A PR number → use `gh pr diff <number>` to get the diff (uses current repo context)
- Local changes (current branch) → use `command git diff main...HEAD` to capture all commits on the branch, then also `command git diff` for any uncommitted work. Combine both diffs for the full picture.
- Specific files → read them directly

**URL detection is critical.** If the argument contains `github.com` and `/pull/`, always treat it as a remote PR review — never fall through to local changes.

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

### Step 3: Run Ruby Verifier

After completing the design pass, dispatch the Ruby verifier for mechanical quality checks:

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
2. **Quality findings** (from the ruby verifier — naming, method structure, testing patterns) — mechanical issues

**Remind the user:** "For the structural scan (bugs, CLAUDE.md compliance, git history), also run `/code-review`."

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
