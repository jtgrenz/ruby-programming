# Preparatory Refactoring Triggers

Read this during the **Design** step (Step 1) of the Quality Loop when modifying existing code. This doc answers one question: **should I refactor the existing code before starting TDD?**

The principle: "Make the change easy, then make the easy change." (Kent Beck). When the existing code doesn't have the seams to receive new behavior cleanly, create them first — separate commit, zero behavior change, all tests green.

---

## The Decision

Ask: "If I write the simplest code that passes my new test (shameless green), will it make the existing design worse?"

- **No** → Start TDD normally (Step 2). The code has room for the new behavior.
- **Yes** → Prep-refactor first. Create the seam, then use it.

The forward question confirms: "If a second similar change arrives next quarter, how many files change?" If the answer is "the same bloated file grows again," the structure is wrong.

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

| Technique | Source | When to use | Key constraint |
|---|---|---|---|
| **Extract Class** | Fowler | Methods cluster around a shared concept in a bloated host | Must preserve the host's public interface |
| **Sprout Class** | Feathers | New behavior doesn't fit in existing structure, existing code is risky to refactor | Keep the sprout independent — inject, don't inherit |
| **Sprout Method** | Feathers | Like Sprout Class but smaller — one new method alongside existing code | When a full class is overkill |
| **Wrap Method** | Feathers | Need to add behavior before/after an existing method without modifying it | Rename the original, create a new method with the old name that calls both |
| **Characterization Tests** | Feathers | Existing code lacks test coverage, you need a safety net before refactoring | Assert what the code *does*, not what it *should* do |
| **Replace Conditional with Polymorphism** | Fowler | Same condition checked in 3+ methods | Only when the variants are stable — premature polymorphism is worse than conditionals |
| **Introduce Parameter Object** | Fowler | Same 3+ parameters passed together through multiple methods | Often the first step before Extract Class — the parameter object becomes the new class's constructor |

---

## What Preparatory Refactoring Is NOT

- **Not gold-plating.** You refactor exactly enough to create the seam. No more.
- **Not speculative.** You have a specific feature to add and a specific structural problem blocking it.
- **Not optional cleanup.** If the existing code can receive the new behavior cleanly, skip this entirely and go straight to TDD.
- **Not a license to rewrite.** Small, safe, incremental moves. Tests green after every change. If you can't describe the refactoring in one sentence, it's too big — break it down.
