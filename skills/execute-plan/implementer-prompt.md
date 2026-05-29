# Ruby Implementer Prompt Addendum

Append this to the superpowers implementer subagent prompt when the task involves Ruby code. This is SELF-CONTAINED — the implementer does not need to read any other skill files.

```
## Ruby-Specific Guidance

### Implementation Approach: Shameless Green
Write ONLY the code needed to make the current test pass:
- Strings, not enums. Hashes, not T::Struct. Conditionals, not class hierarchies.
- Hardcoded values are fine. Duplication is fine. Ugly is fine.
- If you're writing code that no test demands, stop.
- Include Sorbet sigs (typing is the baseline, not an improvement).

The test passing is the gate. Clean code comes in the Refactor step, not the Green step.

**Shameless Green does NOT mean "follow a bad plan faithfully."** If the design analysis (below) reveals that the plan would make an existing design smell worse — adding more mode-dependent fields to a struct that already has them, growing an if/elsif chain that's already 3+ branches — STOP. Flag it as a concern and propose an alternative before implementing. Implementing a plan you know creates technical debt is not simplicity, it's avoidance.

### Design Analysis
Before writing code, check the EXISTING code you'll be modifying:
- What are the axes of change? (dimensions that vary independently — each suggests a seam)
- Does the existing code have mode-dependent fields? (fields meaningless in some configurations → Strategy or sum type)
- Forward question: "If a new variant appears, how many files change?"
- Would the plan make an existing smell WORSE? If yes, flag it before implementing.
- Don't over-engineer: check that the pattern earns its keep before applying it

**Preparatory refactoring check:** Does the existing code have the structure to receive this change cleanly? If adding the new behavior with shameless green would force it into a known smell (growing a bloated class, adding scattered related methods, duplicating conditionals on the same threshold), **refactor first in a separate commit**:
1. **How well can you see the structure?** Clearly → step 2. Mostly but messy → tidy first (small committed improvements until the seam emerges). Lost → scratch refactor (throwaway branch to learn the structure, save learnings to the implementation plan or a working doc, discard branch).
2. **Locate the seam** — name the seam type (object, link, or preprocessing) and its enabling point.
3. Extract the class/method along the seam, verify all existing tests pass (zero behavior change), then start TDD against the clean structure.

Skip when greenfield, the seam already exists, or the Refactor step can handle it after the fact.

### Pre-flight Sweep
Before submitting for review, do a mechanical pass over ALL code you wrote. Report the results explicitly:
- [ ] Every T.must has an inline WHY comment
- [ ] No T.untyped for known structures
- [ ] No single-letter variables (except k/v/i)
- [ ] No WHAT comments (comments describing what code does — well-named identifiers do that)
- [ ] Each `it` block has one `expect`
- [ ] Outgoing commands are mocked in tests
- [ ] 2+ params use keyword args
- [ ] Methods under 15 lines
- [ ] Functional transforms, not imperative loops (map/select/reject, not loop-and-append)

### Simplify (mandatory after every code change)
After every edit — not just at the end — re-read each new or changed method and loop until a full pass finds nothing:

**Expression-level compression:**
- Can any temp variable be inlined? (assigned-then-used-on-next-line = inline)
- Does any intermediate variable just restate the right-hand side? (`result = calculate_result` → inline it)
- Can any conditional become a guard clause + early return?
- Can any method be replaced by a Ruby built-in? (`each_with_object` → `transform_values`, custom loop → `filter_map`)
- Does any method wrap a single built-in call? (inline it — the wrapper adds indirection without depth)
- Can any multi-line block become a one-liner without losing clarity?
- Does any class with one public method exist that a lambda would handle? (downgrade unless it has meaningful state)
- Can any method be deleted because its caller could do the work inline?
- Is any method longer than its caller? (the abstraction may be at the wrong level)

**Name-at-call-site audit:**
- Read each method name **where it's called**, not where it's defined.
- Does the name accurately describe the method's **full behavior**, including all branches and early returns?
- If the method does more than the name promises, either rename it to cover the full scope, or inline it back into the caller where the individual checks are explicit.

**Extraction justification:**
- Does each extracted method absorb complexity (deep) or just relocate it (shallow)?
- Apply the deletion test: if you deleted this method and inlined its body, would the caller get harder to read? If not, the extraction doesn't earn its keep.

The goal is the SHORTEST, CLEAREST code that passes the tests. Not clever — clear. Every line should earn its place.

### Sorbet
- Default to `typed: strict` for new files
- T.sig on every public method
- T::Struct for data objects, classes with extend T::Sig for behavior
- T.nilable for nullable values — handle nil explicitly, don't return bare nil
- T.unsafe/T.must get an inline comment explaining WHY

### Naming
- Every name reveals intent without needing a comment
- No noise words (data, info, manager, processor, handler)
- Variables spelled out — no abbreviations except k/v/i
- Method names at the right abstraction level
```
