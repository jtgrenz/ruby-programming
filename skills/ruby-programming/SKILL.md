---
name: ruby-programming
description: Use when writing, reviewing, or refactoring Ruby code, Rails controllers, ActiveRecord models, RSpec specs, service objects, or background jobs. Also use when reviewing PRs that contain Ruby changes. Triggers on Ruby, Rails, RSpec, ActiveRecord, Sorbet, RuboCop, Sidekiq, Puma.
user-invocable: false
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

**Design analysis** — read `references/design-shapes.md`, `references/design-vocabulary.md`, and `references/sorbet-patterns.md`, then answer:
- What are the **axes of change**? What varies independently?
- Does the problem shape match any **shape trigger**? If yes, name the pattern and recommend it with rationale.
- Which **Sorbet type tool** expresses this design? Check the sorbet-patterns triggers against the proposed interface.
- Where are the **seams** — points where future behavior changes without editing in place?
- If no pattern fits, state why: "No shape triggers match because [reason]."

**Preparatory refactoring check** — read `references/preparatory-refactoring.md`, then answer: does the existing code have the structure to receive this change cleanly? If adding the new behavior with shameless green would force it into a known smell (growing a 600-line class, adding more mode-dependent conditionals, scattering related methods across an unrelated host), **refactor first in a separate commit**. Follow the Prep-Refactor Path in the reference doc:
1. **How well can you see the structure?** Clearly → step 2. Mostly but messy → tidy first (small committed improvements until the seam emerges). Lost → scratch refactor (throwaway branch to learn the structure, save learnings to working doc, discard branch).
2. **Locate the seam** — name the seam type (object, link, or preprocessing) and its enabling point.
3. Write characterization tests for the existing behavior if coverage is thin.
4. Extract/restructure along the seam. Verify all existing tests pass — zero behavior change.
5. Then start the TDD cycle (Step 2) against the clean structure.

Skip this when: the code is greenfield, the existing structure already has the right seam, or the change is small enough that the Refactor step (Step 4) can handle it after the fact without mixing concerns.

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

**Design pass** — after mechanical cleanup, step back and read `references/design-shapes.md` and `references/sorbet-patterns.md`:
- Did the shameless green reveal a **shape** that wasn't visible in the spec?
- Apply the **deletion test** to any extraction: does complexity vanish or reappear across callers?
- Is each module **deep** (absorbing complexity) or **shallow** (adding indirection)?
- Does the code now match a **sorbet type trigger**? (e.g., closed variants → `sealed!`, factory method → `T.attached_class`, callback block → `T.bind`)
- Name the pattern if one emerged. If you're recommending an extraction, state which shape trigger justifies it.

### 5. Simplify
**Mandatory after every code change.** This is not the pre-flight sweep and not the verifier — it's faster than both. It fires after every edit in the Red→Green→Refactor cycle, not just at the end.

Re-read each new or changed method. For each one:

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
- A method named `workflow_supported?` that also checks tax coupons and filing forms is a name that lies. The caller reads `return DEFAULT if workflow_supported?(...)` and has no idea those other checks are happening.

**Extraction justification:**
- Does each extracted method absorb complexity (deep) or just relocate it (shallow)?
- Apply the deletion test: if you deleted this method and inlined its body, would the caller get harder to read? If not, the extraction doesn't earn its keep.

**Loop until clean.** If you find something, fix it and re-read. Repeat until a full pass finds nothing. This self-loop is fast and self-limiting — it naturally terminates when the code stops changing. The design thinking in Step 4 often displaces mechanical scrutiny of the expression. This step exists to catch that gap.

### 6. Next test
Go back to step 2 with the next behavior. Repeat the Red → Green → Refactor → Simplify cycle until all behaviors are implemented. The code grows incrementally — each cycle adds one concept.

### 7. Pre-flight sweep
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

Fix anything you catch. If fixes were needed, run the Simplify pass (Step 5) on the changed code before moving to Verify. The verifier only sees code that has passed both this sweep and Simplify.

### 8. Verify
**The verifier is the gate before the user sees anything.** Never present code to the user without a clean verify pass. This is not optional even for small changes — the verifier checks simplicity, naming, and design with fresh eyes that self-review cannot replicate.

When the pre-flight sweep and simplify pass are both clean, spawn the `ruby-verifier` agent with only the changed file paths and the quality checklist path (`~/.claude/skills/ruby-programming/references/quality-checklist.md`). No implementation context, no justifications — fresh eyes. The agent returns PASS/FAIL per checklist item. Fix all FAILs, return to the appropriate stage (Design for structural issues, Refactor for smells, Simplify for expression-level or naming issues), and spawn the agent again. Always use the sub-agent — never self-verify.

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

For advanced features (sealed!, generics, T.attached_class, T.bind, T.proc, etc.), read `references/sorbet-patterns.md`.

- **Default to `typed: strict` for new files.** This means `T.sig` on every method — Sorbet enforces it. Match the existing typing level when modifying existing files.
- **Use `T::Struct` for data** (input parameters, value objects, config). Use classes with `extend T::Sig` for behavior (service objects, domain logic).
- **Express duck types as `T::Interface`.** Same principle (behavior over class), statically verified.
- **`T.nilable` for nullable values.** Handle nilability explicitly — don't return nil and hope callers check. Avoid nil where possible.
- **`T.untyped` is a code smell — use it only at real boundaries.** Acceptable: inputs from untyped gems, deserialized JSON, ActiveRecord attributes on `typed: false` models. Not acceptable: known internal structures where you could use `T.type_alias`, `T::Struct`, or explicit tuple types like `[String, Date, Date]`. If you know the shape, type it. Document WHY with an inline comment every time you use `T.untyped`.
- **Use `T.unsafe` sparingly.** Document WHY with an inline comment every time.
- **`T.must` is a code smell.** It's a "trust me bro" contract that suppresses nilability warnings without handling the nil case. Too often developers add `T.must` because a value *shouldn't* be nil — but it can be, and `T.must` just converts a type error into a runtime crash. Before using `T.must`, prove the value truly cannot be nil. If it CAN be nil, handle it explicitly (`raise` with context, return early, use a default). Only use `T.must` when Sorbet's type narrowing has a genuine blind spot and you can articulate why nil is impossible.
- **Abstract base classes are fine** when using `T::AbstractUtils` — they serve as enforced contracts.
- **Don't overload T::Enum with metadata.** Enums are dumb identifiers. If variants need per-variant data or behavior, use `sealed!` + `T::Struct` variants instead.
- **Use `sealed!` for sum types** where each variant carries different data. Use `T.absurd` in the else branch for exhaustiveness.

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
- **Run specs focused, not whole files.** During the Red→Green loop, run only the example or file under work (`rspec path/to/spec.rb:42`), never the full suite — full runs belong at the verify gate. A Rails boot plus a large spec run is usually the biggest wall-clock cost in the cycle, paid every iteration. If a full spec file proves large or slow (50+ examples, or tens of seconds), record a memory noting that spec is large so future sessions run it focused from the start.

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

## Writing About Code

Commit messages, PR descriptions, and code comments written by this plugin. If the user has a personal writing style configured (e.g., `write-like-me` skill, CLAUDE.md style rules), use that and ignore these defaults. These are fallbacks for when nothing else is configured.

### Commit messages
- Succinct — 40-80 chars.
- Lead with WHY, not WHAT. "Fix the N+1 in scheduling query" not "update scheduling query to use includes."
- Prose body when the diff isn't self-explanatory. First person, active voice.
- The simpler the change, the simpler the message. 
- Verbosity scales with novelty: version bumps get one-liners, architectural changes get paragraphs.

### PR descriptions
- Open with context: why this change exists, what prompted it, where it fits in the larger effort.
- Don't enumerate what the diff already shows. The reviewer can read the code — explain the decisions.
- Omit rudimentary test methodology details. Don't mention that Sorbet type-checks pass, specs pass, or RuboCop is clean — those are table stakes, not PR content.
- Flag follow-up work and tech debt honestly. What this PR doesn't include and why.

### What to omit
- Don't list "Added X, Updated Y, Fixed Z" changelogs. Tell the story instead.
- Don't fill template sections with filler. Blank is better than fluff.
- Don't describe testing methodology unless it's unusual or novel. "With specs" or blank.
- Don't mention linting, type checking, or CI passing as accomplishments.

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
