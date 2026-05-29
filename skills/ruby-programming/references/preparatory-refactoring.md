# Preparatory Refactoring

Read this during the **Design** step (Step 1) of the Quality Loop when modifying existing code. This doc answers one question: **should I refactor the existing code before starting TDD?**

The principle: "Make the change easy, then make the easy change." (Kent Beck). When the existing code doesn't have the structure to receive new behavior cleanly, reshape it first — separate commit, zero behavior change, all tests green.

---

## The Decision

Ask: "If I write the simplest code that passes my new test (shameless green), will it make the existing design worse?"

- **No** → Start TDD normally (Step 2). The code has room for the new behavior.
- **Yes** → Prep-refactor first. But how depends on whether you can see the structure.

The forward question confirms: "If a second similar change arrives next quarter, how many files change?" If the answer is "the same bloated file grows again," the structure is wrong.

---

## The Prep-Refactor Path

Once you've decided the code needs reshaping, follow this sequence:

### 1. How well can you see the structure?

Can you name the clusters of related methods, identify which responsibilities are tangled, and point to where you'd cut?

- **Clearly** → Go to step 2 (Locate the seam).
- **Mostly — the code is messy but the shape is emerging** → Tidy first (see below). Small, safe, committed improvements until the seam becomes visible. Then go to step 2.
- **Not at all — I'm lost** → Scratch refactor (see below). Throwaway exploration to learn the structure. Then come back to step 2.

### 2. Locate the seam

Before picking a technique, identify where you'll cut. Every refactoring move needs a **seam** — a point where behavior can be altered without editing in place. Don't jump to Extract Class or Sprout Method until you can name the seam and its enabling point.

**How to find seams:**
1. Trace the code path you need to change. What methods does it call? What objects does it create?
2. For each coupling point, ask: "Can I swap this without editing the method body?" Constructor injection, method override, and module inclusion are seams. Hardcoded class names (`MyService.new`) and inline conditionals are not.
3. Name the seam type:
   - **Object seam** — swap behavior by injecting a different collaborator or overriding a method. Enabling point: the constructor or method call that chooses the object. Most common and safest in Ruby.
   - **Link seam** — swap a dependency at the module level (`include`/`extend` a different module). Enabling point: the `include`/`extend` statement. Useful for legacy code where constructor injection isn't feasible.
   - **Preprocessing seam** — alter behavior before the code runs (ERB, code generation). Rare in Ruby application code.
4. Name the enabling point: the specific place where you choose which behavior to use.

If you thought you could see the structure but can't actually name a seam, go back to step 1 — you may need tidying or scratch refactoring.

### 3. Pick the technique and execute

Match the signal you're seeing to a technique (see Signals and Techniques Reference below). Then execute the refactoring: separate commit, zero behavior change, all tests green. When done, start the TDD cycle (Step 2 of the Quality Loop) against the clean structure.

---

## Tidy First

When the structure is mostly visible but messy — you can roughly see the clusters but the code is cluttered enough that you can't confidently name a seam — **make small, safe, committed improvements until the shape emerges.** Rename a confusing variable. Extract a helper method. Reorder methods so related ones are adjacent. Each tidy is a real commit (separate from the feature work, zero behavior change).

Tidying is lighter-weight than scratch refactoring. The code you write is keep-able. The seam you need often reveals itself after a few small moves.

**When to use:**
- The structure is roughly visible but noisy — naming is unclear, methods are in random order, helpers are inlined
- You have a hunch about where you'd cut but aren't confident enough to commit to a technique
- The code has decent test coverage, so small moves are safe

**How:**
1. Make one small structural improvement — rename, extract, reorder. Run tests. Commit it.
2. Re-read. Can you name the seam now? If yes, go to step 2 of the Prep-Refactor Path.
3. If not, make another small improvement. Run tests. Commit. Repeat until the seam is visible.

If after several tidying passes you're still lost, the code is more tangled than it looked — escalate to scratch refactoring.

---

## Scratch Refactoring

When the code is too tangled to see the structure at all — you can't identify which methods cluster, where the responsibilities divide, or where you'd cut — **refactor aggressively on a throwaway branch just to learn.** Rename freely, extract wildly, inline recklessly. The goal is understanding, not clean code.

**When to use:**
- The class mixes so many concerns that you can't tell where one responsibility ends and another begins
- You can't identify which methods cluster together (Signal 1 is unclear)
- Reading the code isn't enough — you need to move things around to see the dependencies
- Tidying didn't reveal the structure — the tangle is deeper than surface noise

**How:**
1. Create a throwaway branch (`git checkout -b scratch-refactoring`)
2. Refactor aggressively — rename, extract, inline, delete. No tests, no commits, no discipline.
3. When the structure becomes clear — you can name the clusters, see the seams, identify where you'd cut — stop.
4. Save what you learned to a working document (`.pair-plans/scratch-notes.md` during pair mode, or the implementation plan if one exists). Record: which methods cluster together, what the responsibilities are, where the seams are, and what seam type each one is. This document must survive context clears — another agent or a future session needs it to pick up the real refactoring.
5. Discard the branch entirely (`git checkout - && git branch -D scratch-refactoring`)
6. Return to step 2 of the Prep-Refactor Path (Locate the seam) — now you can see the structure.

Scratch refactoring is explicitly disposable. Its only outputs are understanding and the working document. If you find yourself wanting to keep the scratch work, you skipped the discipline — start over properly.

---

## Signals That Trigger Preparatory Refactoring

### Signal 1: Scattered related methods in an unrelated host

**What you see:** 5+ private methods sharing a prefix or concept, living inside a class that handles many other concerns. The methods call each other and share state (thresholds, rates, intermediate calculations).

**Example:** `or_eugene_cspt_*` methods scattered across a 600-line `CompanyFilingWithholdingAnnualTotals` class that also handles Kentucky, Oregon Transit, and generic annual totals.

**Technique:** Extract Class (Fowler). Move the related methods into a calculator/service object. The host class instantiates the calculator and delegates. The CoOPTCalculator in this codebase is the established precedent.

**Steps:**
1. Identify the cluster of related methods and their shared dependencies
2. Create the new class with the same public interface as the private methods
3. Move methods one at a time, running tests after each move
4. Replace private method calls in the host with delegation to the new object
5. All existing tests pass — zero behavior change

### Signal 2: Conditional on the same discriminator in multiple methods

**What you see:** The same `if threshold_met?` or `case type` check appears in 3+ methods. Adding a new variant means touching every method that checks.

**Technique:** Replace Conditional with Polymorphism (Fowler), or extract the branching into a Strategy object. Often the conditional cluster is the same as Signal 1 — extracting the class removes the repeated condition naturally because the class itself embodies one side of the branch.

### Signal 3: New behavior would violate "never mix refactoring and feature work"

**What you see:** You can picture the clean end state (calculator class, strategy pattern), but getting there from shameless green means your feature commit also contains a major structural change. The diff is unreadable, the PR is unreviewable.

**Technique:** Split into two commits/PRs. First commit: pure refactoring, no new behavior. Second commit: new feature against the clean structure. The first commit is easy to review because the tests don't change. The second commit is easy to review because the structure is already right.

### Signal 4: Test setup is painful because of coupling

**What you see:** Writing a test for the new behavior requires setting up 10 unrelated dependencies because the class does too much. The test pain is design feedback — the class needs decomposition.

**Technique:** Sprout Class (Feathers). Create the new behavior in a separate, focused class with its own narrow constructor. Wire it into the existing code with minimal changes. This is lower-risk than Extract Class when the existing code is poorly tested.

### Signal 5: You need to understand what existing code does before changing it

**What you see:** The code lacks tests, or the tests are integration-level and don't document individual method behavior. You're not confident what the code does in edge cases.

**Technique:** Write Characterization Tests (Feathers) first. These test what the code *actually does*, not what it *should* do. Run the code with various inputs and assert the outputs you observe. Now you have a safety net for refactoring. Don't fix bugs you discover — document them and address them separately.

### Signal 6: The host class exceeds a complexity threshold

**What you see:** The file is 300+ lines, has 10+ private methods, or mixes concerns from multiple domains (tax calculation + period handling + employee counting + payment tracking all in one class).

**Technique:** Identify the clusters (often by method prefix or shared parameters), then Extract Class for each cluster. The host becomes an orchestrator that delegates to focused objects. Each extraction is a separate commit.

---

## Techniques Reference

| Technique | When to use | Key constraint |
|---|---|---|
| **Extract Class** | Methods cluster around a shared concept in a bloated host | Must preserve the host's public interface |
| **Sprout Class** | New behavior doesn't fit in existing structure, existing code is risky to refactor | Keep the sprout independent — inject, don't inherit |
| **Sprout Method** | Like Sprout Class but smaller — one new method alongside existing code | When a full class is overkill |
| **Wrap Method** | Need to add behavior before/after an existing method without modifying it | Rename the original, create a new method with the old name that calls both |
| **Characterization Tests** | Existing code lacks test coverage, you need a safety net before refactoring | Assert what the code *does*, not what it *should* do |
| **Tidy First** | Structure is mostly visible but noisy — small moves will reveal the seam | Keep-able commits — each tidy is a real commit with zero behavior change |
| **Scratch Refactoring** | Code is too tangled to identify clusters or seams by reading alone | Throwaway work — save learnings to working doc, revert, then do it for real |
| **Replace Conditional with Polymorphism** | Same condition checked in 3+ methods | Only when the variants are stable — premature polymorphism is worse than conditionals |
| **Introduce Parameter Object** | Same 3+ parameters passed together through multiple methods | Often the first step before Extract Class — the parameter object becomes the new class's constructor |

---

## What Preparatory Refactoring Is NOT

- **Not gold-plating.** You refactor exactly enough to create the seam. No more.
- **Not speculative.** You have a specific feature to add and a specific structural problem blocking it.
- **Not optional cleanup.** If the existing code can receive the new behavior cleanly, skip this entirely and go straight to TDD.
- **Not a license to rewrite.** Small, safe, incremental moves. Tests green after every change. If you can't describe the refactoring in one sentence, it's too big — break it down.
