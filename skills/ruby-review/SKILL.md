---
name: ruby-review
description: Use when reviewing Ruby code, PRs, or local changes for design shape, coupling, and Ruby-specific quality.
allowed-tools: Bash(gh pr view *), Bash(gh pr diff *), Bash(gh api *), Bash(command git diff *), Bash(command git log *), Bash(command git blame *), Read, Grep, Glob, Agent
---

# Ruby Code Review

Design-focused code review for Ruby. Check design shapes, threshold gates, connascence, and the quality checklist. Complement this with the runtime's general code review when a structural bug scan is also needed.

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
- `../ruby-programming/references/design-vocabulary.md`
- `../ruby-programming/references/preparatory-refactoring.md`

For shapes, list the `## Shape` headings in `../ruby-programming/references/design-shapes.md`, then read only the shapes whose triggers plausibly match the diff. Do not load the whole file up front.

Then review the diff with design eyes:
- **Shape triggers**: Check all documented shapes against the changed code. Name any that match.
- **Threshold gates**: For each shape found, check if the threshold is crossed. Don't recommend patterns that aren't warranted.
- **Forward question**: "If a new variant appears, how many files change?" for any polymorphism-adjacent code.
- **Connascence**: Name the coupling type the change creates or eliminates.
- **SOLID**: Cite relevant principles when they apply.
- **Preparatory refactoring**: Was new code added to a bloated class when it should have been extracted first? Flag if the diff adds related methods to an already-large host without extracting them into a focused object. Check whether a seam existed (object seam via constructor injection, link seam via module inclusion) that would have made extraction safe — if so, the author should have cut along it before adding new behavior.
- **Rejected framings**: Flag if the diff matches any ("add a param with a default = backward compatible", "boolean flag that forks execution", etc.)

**Make it readable for the team.** Code reviews are read by the PR author AND future readers. Most engineers haven't seen connascence or design shapes before:
- Never use bare abbreviations (OCP, SRP, CoM, ISP). Always use full names on first mention: "Open/Closed Principle", not "OCP"
- Add a brief parenthetical explanation the first time: "Connascence of Meaning (when callers must remember what a boolean value *means* to use it correctly)" or "Open/Closed Principle (adding a new variant should mean adding a new class, not editing existing ones)"
- Don't assume the reader knows SOLID, connascence, or design shapes — treat every term as new on first use
- Wrap the design analysis in a `<details>` block when posting to GitHub so it doesn't overwhelm the practical feedback

### Step 3: Run Ruby Verifier

After completing the design pass, run the shared verifier for mechanical quality checks: `../ruby-programming/agents/ruby-verifier.md`. Dispatch it as a fresh subagent when the runtime supports one; otherwise apply that prompt directly. Do not restate its rules or output format here — a second copy drifts from the original.

Hand it the exact diff plus the changed file paths. For an explicit full-file review, label the paths as full-file audit targets instead. For a remote PR, paste the diff text: the working tree may hold unrelated changes, so local paths would resolve to the wrong content. Checking the PR out first (`gh pr checkout <number> --repo <owner>/<repo>`, which needs a clean tree) is the alternative.

### Step 4: Present Findings

Combine the design and quality findings. Organize by severity:

1. **Design concerns** (from your design pass — shapes, connascence, SOLID) — architectural issues
2. **Quality findings** (from the ruby verifier — naming, method structure, testing patterns) — mechanical issues

Lead with actionable findings. Omit passing checklist items and process narration. Keep each finding to one compact paragraph unless the user asks for a deeper design explanation.

When useful, remind the user to run the host's general review command (`/code-review` in Claude Code or `/review` in Codex) for a separate structural bug scan.

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
