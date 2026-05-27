---
name: ruby-guidelines
description: Use when writing, reviewing, or refactoring Ruby code, Rails controllers, ActiveRecord models, RSpec specs, service objects, or background jobs. Also use when reviewing PRs that contain Ruby changes. Triggers on Ruby, Rails, RSpec, ActiveRecord, Sorbet, RuboCop, Sidekiq, Puma.
---

# Ruby Programming

OOP design, type safety, refactoring discipline, and code quality — patterns Claude wouldn't apply by default.

## Core Principles

1. **The codebase is the primary source.** Check existing patterns before inventing new ones. Consistency with the codebase beats theoretical purity.
2. **Design for changeability, not perfection.** Every choice should make future modifications cheaper.
3. **Shameless Green first, then improve.** Write the simplest code that passes the test — strings not enums, hashes not structs, conditionals not class hierarchies. You don't have enough examples yet to know what the right abstraction is. The final code SHOULD have enums, typed structs, and clean architecture — but those emerge from refactoring, not from the first write.
4. **Think in messages, not classes.** "What messages need to be sent?" before "What classes should I create?"
5. **Type safety by default.** Sorbet sigs on all public methods. Prefer explicit types over `T.untyped`. Use `T.nilable` to handle nilability explicitly.
6. **One change at a time, always green.** Never mix refactoring and feature work. Tests pass after every change.

## The Quality Loop

For each unit of work, cycle through these stages. The code starts simple and ends well-factored — the iteration is the point.

### 1. Design
Before writing anything: What messages need to be sent? What are the dependencies? Object or data structure? Sketch the public interface in your head, not the implementation.

**Design analysis** — read `references/design-shapes.md` and `references/design-vocabulary.md`, then answer:
- What are the **axes of change**? What varies independently?
- Does the problem shape match any **shape trigger**? If yes, name the pattern and recommend it with rationale.
- Where are the **seams** — points where future behavior changes without editing in place?
- If no pattern fits, state why: "No shape triggers match because [reason]."

### 2. Red — write one failing test
Write a single test for the simplest behavior. Use the message testing matrix to decide what to assert. Run it (or confirm it would fail). Do not write implementation yet.

### 3. Green — Shameless Green
Write **only** the code needed to make that one test pass. This means:
- Strings, not enums. Hashes, not T::Struct. Conditionals, not class hierarchies.
- Hardcoded values are fine. Duplication is fine. Ugly is fine.
- If you're writing code that no test demands, stop. That's the next cycle.
- Include Sorbet sigs (typing is not an improvement — it's the baseline).

The test passing is the gate. If the test passes, Green is done.

### 4. Refactor
Now improve the code. Two passes — mechanical first, then design.

**Mechanical pass** — apply flocking rules, one change at a time, tests green after each:
- Strings → enums or constants
- Hashes → T::Struct
- Conditionals → polymorphism (when warranted by duplication)
- Inline logic → extracted methods with intent-revealing names
- Hardcoded values → injected dependencies

Each improvement is a separate change. If you can't describe it in five words, it's more than one change.

**Design pass** — after mechanical cleanup, step back and read `references/design-shapes.md`:
- Did the shameless green reveal a **shape** that wasn't visible in the spec?
- Apply the **deletion test** to any extraction: does complexity vanish or reappear across callers?
- Is each module **deep** (absorbing complexity) or **shallow** (adding indirection)?
- Name the pattern if one emerged. If you're recommending an extraction, state which shape trigger justifies it.

### 5. Next test
Go back to step 2 with the next behavior. Repeat the Red → Green → Refactor cycle until all behaviors are implemented. The code grows incrementally — each cycle adds one concept.

### 6. Pre-flight sweep
Before submitting to the verifier, do a quick mechanical pass over your code. These are the most common first-pass mistakes — binary checks, not judgment calls:
- [ ] Every `T.must` has an inline WHY comment proving nil is impossible
- [ ] No `T.untyped` for known structures — use `T.type_alias`, `T::Struct`, or explicit types. Only at real boundaries (untyped gems, deserialized data)
- [ ] No single-letter variables except `k`/`v`/`i` (check block params especially)
- [ ] No WHAT comments — if a comment restates what the code does, delete it
- [ ] Each `it` block has one `expect` (split multi-assertion tests)
- [ ] Outgoing commands are mocked (`allow + have_received`), not tested via side effects
- [ ] 2+ params use keyword args
- [ ] Methods under 15 lines
- [ ] Functional transforms (`map`/`select`/`flat_map`), not imperative `<<` loops

Fix anything you catch before spawning the verifier. This reduces verify/fix round-trips from ~4 to ~1-2.

### 7. Verify
When the pre-flight sweep is clean, spawn the `ruby-verifier` agent with only the changed file paths and the quality checklist path (`~/.claude/skills/ruby-programming/references/quality-checklist.md`). No implementation context, no justifications — fresh eyes. The agent returns PASS/FAIL per checklist item. Fix all FAILs, return to the appropriate stage (Design for structural issues, Refactor for smells), and spawn the agent again. Always use the sub-agent — never self-verify.

**Accumulate context across passes.** On each subsequent verify pass, include: (1) which prior FAILs were fixed, (2) which were overridden and why. This prevents the verifier from re-litigating resolved decisions and lets the loop converge. Without this context, each fresh-eyes pass finds different issues and the loop oscillates instead of converging.

**Overriding a FAIL:** You may disagree with a finding when broader context justifies it — but you must cite which skill principle applies (e.g., "codebase consistency, Principle #1") and state the reason inline. Silent dismissals are not overrides. If you can't name the principle, fix the code.

The loop exits when the verifier returns zero new FAILs. Then ask: *is this the best code we can write? Can we simplify or clarify anything further?* If yes, repeat the loop. If no — congrats, ship it.

## Designing

- **One responsibility per class.** Describe in one sentence — if you need "and", split it. Ask: which actor owns this?
- **Object or data structure — choose deliberately.** Objects hide data behind behavior — you tell them what to do, not what they contain (service objects, domain models). Data structures expose data with no behavior — you read their fields directly (T::Struct inputs, frozen hashes). Hybrids that do both are the worst of both worlds. The test: does the caller need to know the internal structure? If yes, it's a data structure. If no, it's an object.
- **Entity vs Use Case.** The abacus test: would this business rule exist if we ran the operation with pen, paper, and an abacus? If yes, it's a domain entity (e.g., tax calculation logic). If it only exists in the automated system (e.g., workflow orchestration, scheduling), it's a use case. Separate these into distinct classes — entities should have no knowledge of the application that calls them.
- **Business logic in POROs.** Core calculation/decision logic in plain Ruby objects — no Rails dependencies. Testable without loading Rails, portable across trigger points (API, worker, rake, console).
- **Don't marry the framework.** Domain objects should not inherit from Rails base classes. Keep framework annotations/callbacks in the outermost layer.
- **Inject dependencies** via constructor/keyword args. Don't hardcode class names inside methods.
- **Depend on things that change less often.** Abstractions over concretions. Interfaces over implementations.
- **is-a = inheritance. behaves-like-a = module. has-a = composition.** Prefer composition when in doubt.

## Naming

- **Names reveal intent without needing a comment.** If the name needs explanation, rename it.
- **Spell out variable names.** Only acceptable single-letter names: `k` (key), `v` (value), `i` (index). Everything else gets full descriptive names.
- **One word per concept.** Don't mix `fetch`/`retrieve`/`get` for the same operation. Don't pun — `add` for arithmetic vs `add` for collection insert are two different methods.
- **Name methods one abstraction level up.** Imagine other examples, ask "what's the category?" (column header technique).
- **No noise words.** If `ProductInfo` and `ProductData` mean the same thing, you have a naming failure.
- **Comments are generally design failures.** If you need a comment to explain what code does, the code is poorly designed — rename the method, extract a predicate, or restructure. Acceptable exceptions: complex domain reasoning that can't be captured in names (tax law edge cases, regulatory constraints, non-obvious business rules), and high-level algorithmic strategy where the code is well-factored but prose explaining the approach helps readers understand the overall plan. Never comment WHAT; rarely comment HOW; occasionally comment WHY when the domain or algorithm is genuinely complex.

## Writing Methods

- **One abstraction level per method.** High-level orchestration and low-level string formatting don't belong together. The public method tells the story; private methods are the chapters.
- **~10-15 lines max per method.** If longer, extract.
- **Command-query separation.** Methods either change state (command) or answer a question (query). Never both.
- **Boolean parameters that fork behavior are a smell.** If a boolean creates two entirely different execution paths (e.g., `dry_run:` switching between commit and rollback, `async:` switching between sync and enqueue), split into two well-named methods. Legitimate exceptions: Rails-idiomatic modifiers (`validate: false`), query filters (`include_inactive:`), and guard bypasses (`force:`) where the core algorithm is unchanged.
- **Use keyword arguments** for 2+ parameters. Eliminates ordering dependencies.
- **Encapsulate conditionals.** `if filing.active_california_filing?` not `if filing.state_code == 'CA' && filing.period_end > Date.today`.
- **Hide instance variables behind `attr_reader`.** Never raw `@variables` in method bodies.
- **Default to private visibility.** Public methods are your API contract.
- **Favor functional patterns for transformations.** `map`/`select`/`reduce`/`filter_map`/`transform_values`/`each_with_object` over imperative loops with mutation. Prefer immutable data: `freeze` constants, use `const` in T::Struct.
  - Yes: `filings.select(&:active?).map(&:total_tax)`
  - No: `result = []; filings.each { |f| result << f.total_tax if f.active? }; result`
- **Respect Demeter.** One dot fine, two dots smell, three dots problem. Tell, don't ask.
- **Memoize nil/false correctly:** `defined?(@val) ? @val : (@val = expr)` — `||=` fails for nil/false.
- **Cache ivars in locals inside loops:** `config = @config; items.each { |item| process(item, config) }`.
- **Use `find_each` not `each`** when iterating over ActiveRecord collections. `each` loads all records into memory.

## Sorbet & Types

- **Default to `typed: strict` for new files.** This means `T.sig` on every method — Sorbet enforces it. Match the existing typing level when modifying existing files.
- **Use `T::Struct` for data** (input parameters, value objects, config). Use classes with `extend T::Sig` for behavior (service objects, domain logic).
- **Express duck types as `T::Interface`.** Same principle (behavior over class), statically verified.
- **`T.nilable` for nullable values.** Handle nilability explicitly — don't return nil and hope callers check. Avoid nil where possible.
- **`T.untyped` is a code smell — use it only at real boundaries.** Acceptable: inputs from untyped gems, deserialized JSON, ActiveRecord attributes on `typed: false` models. Not acceptable: known internal structures where you could use `T.type_alias`, `T::Struct`, or explicit tuple types like `[String, Date, Date]`. If you know the shape, type it. Document WHY with an inline comment every time you use `T.untyped`.
- **Use `T.unsafe` sparingly.** Document WHY with an inline comment every time.
- **`T.must` is a code smell.** It's a "trust me bro" contract that suppresses nilability warnings without handling the nil case. Too often developers add `T.must` because a value *shouldn't* be nil — but it can be, and `T.must` just converts a type error into a runtime crash. Before using `T.must`, prove the value truly cannot be nil. If it CAN be nil, handle it explicitly (`raise` with context, return early, use a default). Only use `T.must` when Sorbet's type narrowing has a genuine blind spot and you can articulate why nil is impossible.
- **Abstract base classes are fine** when using `T::AbstractUtils` — they serve as enforced contracts.

## Error Handling

- **Methods called for side effects MUST raise on failure.** Return values get silently ignored.
- **Never return nil from your own methods.** Return empty collections, raise exceptions, Result monads, or use Special Case objects (Null Object pattern) — `NullEmployee` that returns `0` for pay instead of forcing every caller to nil-guard.
- **Wrap third-party exceptions** in your own hierarchy. Callers should never `rescue Faraday::Error` — they rescue `YourApp::ExternalServiceError`.
- **Never rescue `Exception`** — only `StandardError` or specific subclasses.
- **Never use exceptions for flow control.** Exceptions are 3.4x slower than if/else in MRI.
- **Fail-closed authorization.** `before_action :except` (forgetting = blocks) not `:only` (forgetting = allows).
- **Exponential backoff with jitter** for retries.

## Testing

### Message Testing Matrix

| Message Type | Test Strategy |
|---|---|
| Incoming query | Assert the return value (state) |
| Incoming command | Assert the side effect |
| Outgoing query | Do NOT test — receiver's job |
| Outgoing command | Assert message was sent (mock) |
| Private method | NEVER test directly |

### Rules

- **Build-Operate-Check structure.** Every test has three visually separated sections: setup (`let`/`before`), action (`subject`), assertion (`expect`). When these blur, the test is hard to read.
- **One concept per test.** One `context` per scenario, not one `it` block with five expectations.
- **Hard-code expected values.** Never call production methods in assertions (echo-chamber anti-pattern).
- **Domain-specific testing language.** Extract repetitive setup into helpers that read like domain prose.
- **Use verifying doubles.** `instance_double(AgentFilingTransmission)` not `double('transmission')`.
- **Shared examples for duck types.** All objects playing a role should pass the same interface tests.
- **Tests must be fast, silent, and independent.** No test depends on another's state.
- **If testing is hard, the design is wrong.** Use test pain as design feedback.
- **Before writing a new spec file, check if existing specs already cover it.** Prefer adding examples to an existing spec over creating a standalone file. Duplicate coverage is maintenance debt.
- **Don't assert what Sorbet already proves.** If a field is `typed: strict` and non-nilable, don't write `expect(x).to be_present` — Sorbet guarantees it at compile time. Don't guard against nil on non-nilable types.

### TDD Sequencing (follows the Quality Loop's Red → Green → Refactor cycle)

- Simplest transformation first: constant → variable → conditional → loop.
- Each test pushes code toward more generic behavior through the simplest possible change.

## Refactoring

### Flocking Rules

1. Find the things that are most alike
2. Identify the smallest difference between them
3. Make the simplest change to remove that difference — ONE change means one rename, one extraction, or one value substitution. If you can't describe it in five words, it's more than one change.
4. Run tests. Repeat.

### Discipline
  
- **Write dirty first, then clean.** Don't try to design perfectly on the first pass. Get it working, then refactor.
- **Accidental duplication is not real duplication.** Two code paths that look identical but change for different reasons should NOT be merged. Three tests: (1) would changing one require changing the other? (2) do they change for the same reason? (3) do they change at the same rate? If any answer is no, they're accidentally similar — leave them separate.
- **Never mix refactoring and feature work** in the same commit.
- **Small steps.** "Making a slew of simultaneous changes is not refactoring — it's rehacktoring."
- **Features are liabilities.** Every feature has maintenance cost. Celebrate removing features.

## Anti-Patterns

Flag any smell from the **Smells** table in the quality checklist (`~/.claude/skills/ruby-programming/references/quality-checklist.md`). The checklist is the canonical list — don't maintain a separate copy here.

## Code Review Mode

When reviewing a PR or diff, run the **design pass before the syntax pass**. Read `references/design-shapes.md` and `references/design-vocabulary.md` first.

1. **Design pass**: Does the diff's structure model the business domain correctly? Check each shape trigger. For every shape match, **name the pattern and provide a specific recommendation** — not "consider Strategy" but "this looks like Strategy because [shape evidence], and here's what it would look like: [sketch]."
2. **Forward question**: "If a new variant appears (new agency, new filing type, new transmission mode), how many files change?" If the answer is "many," the design is missing a seam.
3. **Syntax pass**: Naming, types, tests, smells — the existing checklist.

Design issues outrank syntax issues. A well-named method in a wrong architecture is still wrong.

## Sources

Design principles drawn from:
- Practical Object-Oriented Design in Ruby (Metz)
- 99 Bottles of OOP (Metz & Owen)
- Polished Ruby Programming (Evans)
- Eloquent Ruby (Olsen)
- Clean Code / Clean Architecture / The Clean Coder (Martin)
- The Pragmatic Programmer (Hunt & Thomas)
- The Complete Guide to Rails Performance (Berkopec)
- A Philosophy of Software Design (Ousterhout)
- Working Effectively with Legacy Code (Feathers)
- Design Patterns in Ruby (Olsen)
