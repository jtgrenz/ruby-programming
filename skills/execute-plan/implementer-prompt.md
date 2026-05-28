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

### Simplicity Check
After the pre-flight, review each method you wrote and ask: "Is there a simpler way to express this?" Specifically:
- Can any method be replaced by a Ruby built-in? (`each_with_object` → `transform_values`, custom loop → `filter_map`)
- Does any method wrap a single built-in call? (inline it — the wrapper adds indirection without depth)
- Can any conditional be replaced by a guard clause + early return?
- Can any multi-line block be a one-liner without losing clarity?
- Is there a local variable that exists only to be returned on the next line? (inline it)
- Does any intermediate variable just restate the right-hand side? (`result = calculate_result` → inline it)
- Does any class with one public method exist that a lambda would handle? (downgrade unless it has meaningful state)
- Can any method be deleted because its caller could do the work inline?
- Is any method longer than its caller? (the abstraction may be at the wrong level)

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
