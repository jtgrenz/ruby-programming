---
name: execute-plan
description: Use when executing an implementation plan for Ruby code. Wraps superpowers execution with Ruby-specific implementer guidance and design-aware verification.
disable-model-invocation: true
---

# Ruby Execute Plan

Execute an implementation plan with Ruby-specific quality enforcement. The controller is lean — it orchestrates. Ruby knowledge flows through sub-agent prompts, not controller context.

## Process

### Step 1: Load Plan

Read the implementation plan. If no plan exists, stop and suggest using `ruby-programming:brainstorm` first.

### Step 2: Dispatch Execution

**If superpowers:subagent-driven-development is available**, invoke it and follow its process with these modifications:

1. **Implementer prompt enhancement**: When constructing each implementer subagent prompt, read `${SKILL_DIR}/implementer-prompt.md` and append its contents to the prompt. Do NOT read design-shapes.md, design-vocabulary.md, or the ruby-programming SKILL.md yourself — the implementer prompt is self-contained. You are the orchestrator, not the implementer.

2. **Quality review — run BOTH reviewers in parallel**: After the spec reviewer passes, dispatch BOTH of these as background agents simultaneously:

   **Superpowers code quality reviewer** — use the standard superpowers code-quality-reviewer-prompt.md as-is.

   **Ruby verifier** — dispatch a separate `general-purpose` agent with this prompt template (fill in the file paths from the task):

   ```
   You are a Ruby code quality verifier. Read every file listed below, then audit
   against the quality checklist that follows. Report PASS/FAIL for each item.

   ## Files to Review
   [LIST THE FILES THE IMPLEMENTER CREATED/MODIFIED]

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

   Read the quality checklist file ONCE at the start of execution and reuse its contents for each ruby verifier dispatch. Fix issues from EITHER reviewer before marking the task complete.

3. **Spec reviewer**: Use superpowers spec reviewer as-is.

**If superpowers is NOT available**, execute tasks sequentially yourself:
1. Read `${SKILL_DIR}/implementer-prompt.md` for Ruby guidance — follow it for each task
2. After each task: dispatch a ruby verifier agent (template above)
3. Fix all FAIL items, re-verify until clean

### Step 3: Finish

**If superpowers:finishing-a-development-branch is available**, invoke it.

**If not**, run tests, summarize changes, and ask the user how they want to integrate.

## Key Principle

**Controllers orchestrate, they don't learn.** The superpowers framework handles dispatching agents, tracking tasks, and managing review loops. Ruby-specific quality (Shameless Green, design shapes, Sorbet, pre-flight) flows through sub-agent prompts — never load reference files into the controller's context. This keeps the controller lean and prevents it from confusing its orchestration role with the implementer role.
