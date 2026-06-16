# Design Vocabulary

Precise terms for design discussions. Use these terms exactly — don't drift into vague synonyms. When reviewing or designing code, thinking in this vocabulary forces pattern recognition that informal language obscures.

---

## Required Terms

**Shape** — The structural signature of code that suggests a pattern wants to emerge. What you observe in the code, not what you apply to it. "I see mode-dependent fields" (shape), not "you should use Strategy" (premature prescription).

**Axis of change** — A dimension along which requirements will vary independently. Each axis suggests a seam. Serial-vs-parallel transmission is one axis. IRS-vs-NY agency rules are another. If two things change for different reasons, they belong in different classes.

**Seam** — A point where behavior can be altered without editing in place (Michael Feathers, *Working Effectively with Legacy Code*). Constructor injection, method override, and configuration are seams. Hardcoded class names and inline conditionals are not. Every seam has an **enabling point** — the place where you decide which behavior to use. Three types in Ruby: object seam (inject a different collaborator), link seam (swap a module), preprocessing seam (rare — metaprogramming/ERB). See `preparatory-refactoring.md` for the full taxonomy and decision tree.

**Mode** — A runtime configuration that changes which behavior applies. Modes that carry different data are strategies, not booleans. If a mode makes some fields meaningless, you have two types sharing a trenchcoat.

**Variant** — A distinct case within a sum type. Each variant carries only its own data — no nil fields "for the other variant." Sorbet's `T::Struct` subclasses under a sealed module are Ruby's sum types.

**Depth** — How much complexity a module absorbs relative to the simplicity of its interface (John Ousterhout, *A Philosophy of Software Design*). Deep modules have simple interfaces that hide complex implementations. Shallow modules have interfaces nearly as complex as their implementations — they add indirection without reducing complexity.

**Threshold gate** — Conditions that must ALL be true before applying a pattern. Prevents reflexive pattern application. "I see a case statement" does not pass the gate for polymorphism — you also need growing cases and non-trivial branch logic.

---

## SOLID Principles

The five SOLID principles describe properties of well-structured OO code. You don't need to name them in every discussion, but when a design decision directly relates to one, cite it by name.

**Single Responsibility Principle (SRP)** — A class should have one reason to change. "Reason to change" means one stakeholder or business concern. A class that handles both transmission scheduling and retry logic has two reasons to change.

**Open/Closed Principle (OCP)** — Code should be open for extension, closed for modification. Adding a new transmission mode should mean adding a new class, not editing existing workers or conditionals. The forward question ("how many files change for a new variant?") is OCP applied as a litmus test.

**Liskov Substitution Principle (LSP)** — Subtypes must be substitutable for their base type without breaking callers. If `ParallelTransmissionStrategy` is a subtype of `TransmissionStrategy`, the worker must work correctly with either — no special-casing by type.

**Interface Segregation Principle (ISP)** — Clients shouldn't depend on methods they don't use. A `TransmissionConfiguration` with fields that only apply to some modes violates ISP — parallel configs carry `delay_seconds` they never read.

**Dependency Inversion Principle (DIP)** — Depend on abstractions, not concretions. The worker should depend on `TransmissionStrategy` (abstract), not `SequentialTransmissionStrategy` (concrete). Constructor injection is the seam that enables this.

---

## Connascence — Measuring Coupling Quality

Connascence is a way to measure and name the *type* of coupling between components — not just "is this coupled?" but "how is it coupled, and how expensive is that?" Think of it like a taxonomy of dependencies: some kinds of coupling are cheap and safe (two components share a name), others are expensive and fragile (two components must update in lockstep to stay consistent). Refactoring often means trading expensive coupling for cheaper coupling.

Use connascence to explain WHY a refactoring improves design, not just THAT it does. When recommending a pattern, state which connascence it reduces.

**Always use full names on first mention** (e.g., "Connascence of Meaning"), with the abbreviation in parentheses if you'll reference it again. Never use bare abbreviations like "CoM" without introducing them first — most readers won't know what they mean.

**Hierarchy (weakest/cheapest → strongest/most expensive):**

| Type | What must agree | Static/Dynamic | Example |
|------|----------------|----------------|---------|
| Connascence of Name (CoN) | Entity names | Static | Renaming a method requires updating callers |
| Connascence of Type (CoT) | Types | Static | Using `is_a?` checks — prefer duck typing |
| Connascence of Meaning (CoM) | Value semantics | Static | Magic numbers, boolean params where `true` means different things in different contexts |
| Connascence of Position (CoP) | Argument order | Static | 3+ positional args — use keyword args to reduce to Connascence of Name |
| Connascence of Algorithm (CoA) | Shared logic | Static | Same calculation in two places — extract to reduce to Connascence of Name |
| Connascence of Execution (CoE) | Operation order | Dynamic | `generate` must precede `publish` |
| Connascence of Timing (CoTime) | Timing | Dynamic | Race conditions, timeouts |
| Connascence of Value (CoV) | Value relationships | Dynamic | Related values that must stay consistent |
| Connascence of Identity (CoI) | Same entity reference | Dynamic | Mutating shared state |

**Formula: (Strength × Degree) ÷ Locality = Coupling Cost.** High strength + high degree + low locality = expensive coupling. Refactor toward weaker forms or improve locality.

**Practical use:** When you spot a rejected framing below, name the connascence. "This boolean parameter creates Connascence of Meaning (CoM) — `true` means 'serial' here but callers have to remember that. Strategy reduces it to Connascence of Name (CoN) — `SerialTransmission` is self-documenting."

---

## Actions, Calculations, and Data

A classification lens for deciding *where behavior should live*. Every piece of code is one of three things — listed below from most dangerous to safest:

**Action** — code whose result depends on *when* it runs or *how many times* it runs. DB reads/writes, network calls, reading the clock (`Time.current`), randomness (`SecureRandom`), logging, enqueueing a job, and any mutation of shared state are actions. Actions are **contagious**: a method that calls an action is itself an action. They are the hardest to test (you must stub the world) and the easiest to get wrong.

**Calculation** — a computation from inputs to outputs with **no implicit inputs or outputs**: same arguments always produce the same return value, and nothing in the world changes. A pure function. Trivial to test (pass inputs, assert the return), trivial to compose and move.

**Data** — inert facts about events. A `T::Struct`, a `Data` value, a frozen hash. No behavior of its own; interpreted by calculations. The easiest to store, compare, and serialize.

**The diagnostic & directive.** A method is a calculation *only if* it has no implicit inputs (ivars/globals/clock/DB) and no implicit outputs (mutating args, writing the DB, logging) — convert an implicit input into an argument and an implicit output into a return value, and an action becomes a calculation. Prefer Data over Calculations over Actions: shrink the action surface to a thin shell at the edges, and push every real decision into calculations. This is the *test* behind "business logic in POROs" (a PORO method is core logic only when it's a calculation), and it's sharper than command-query separation — CQS splits *do* from *answer*; this says **extract the answer out of code that touches the world** (see Shape 13 in `design-shapes.md`).

---

## Ruby Techniques That Pair With Patterns

**Function composition (`>>`, `<<`)** — Ruby's proc/lambda/method composition operators enable pipeline-style code. Use with Shape 11 (Railway). `step_one >> step_two >> step_three` reads as a pipeline; each step must respond to `#call`.

**Pattern matching (`case/in`)** — Ruby 3.x structural pattern matching pairs with sum types (Shape 1) and Railway results (Shape 11). Use to destructure variants cleanly:
```ruby
case result
  in Success(value) then process(value)
  in Failure(error: message) then log(message)
end
```
Don't use for simple type checks or nil guards — `is_a?` and `nil?` are clearer.

**Options pattern** — Use `T::Struct` , `Struct` or `Data` for configuration objects, not classes with `attr_accessor`. Inject the config; separate loading (from ENV, YAML) from the config object itself. Relevant when Shape 8 (Builder) seems like overkill — sometimes you just need a well-typed config struct.

---

## Rejected Framings

These are heuristics that sound reasonable but lead to bad design. When you catch yourself thinking one of these, stop and apply the correct framing.

### "This file is too long → extract a class"

**Why it fails:** Length is not a smell. A 300-line class with one cohesive responsibility is better than three 100-line classes with tangled dependencies. File length is a secondary signal — incoherent responsibility is the primary one.

**Correct framing:** "Does this class have multiple reasons to change? Can I describe it without 'and'?" If yes, split by responsibility. If no, the length is fine.

### "There's a case statement → use polymorphism"

**Why it fails:** Case statements are fine when cases are stable and branch logic is trivial. Polymorphism is for when new cases appear regularly and each case has substantive behavior. Replacing a 5-line case with a 3-file class hierarchy is not an improvement.

**Correct framing:** "Will new cases appear? Is the branch logic more than a single expression? Is this same condition checked in 3+ places?" If all yes, polymorphism earns its keep. If no, the case statement is the right design.

### "Two things look similar → DRY them up"

**Why it fails:** Accidental duplication is not real duplication. Three tests: (1) Would changing one require changing the other? (2) Do they change for the same reason? (3) Do they change at the same rate? If any answer is no, they're accidentally similar. Merging them creates coupling between things that should evolve independently.

**Correct framing:** "Do these change together, for the same reason, at the same rate?" The third example reveals whether duplication is real. Two is a coincidence; three is a pattern.

### "Rails model too fat → extract concerns"

**Why it fails:** Concerns are horizontal inheritance — they add methods to a class without reducing its responsibility count. A 500-line model with 5 concerns is still a 500-line model that changes for 5 reasons. The complexity is hidden, not eliminated.

**Correct framing:** "Can this behavior stand alone as a domain concept with its own tests?" If yes, extract a collaborating object (composition), not a concern (inheritance). Concerns are for genuinely shared behavior across unrelated models (e.g., `Auditable`, `SoftDeletable`).

### "Add a param with a default → backward compatible"

**Why it fails:** A parameter that only applies in one mode is a missing type. Adding `gap_seconds: nil` to a config that doesn't use gaps in parallel mode is not backward compatibility — it's encoding an invalid state. Every future reader has to figure out which params matter in which modes.

**Correct framing:** "If this param is meaningless in some configurations, do I have two types pretending to be one?" See Shape 1 (mode-dependent fields) in `design-shapes.md`.

### "Boolean flag + conditional → just check the flag"

**Why it fails:** Boolean parameters that fork execution paths are strategies masquerading as options. `process(data, async: true)` that has completely different behavior for async vs sync is two methods pretending to be one. The boolean hides the design decision from the type system.

**Correct framing:** "Does this boolean change what the method does, or just how it does it?" If WHAT (different algorithm, different data flow), split into two methods or use Strategy. If HOW (add logging, skip validation), a boolean modifier is fine.

### "Extract a service object because the controller is long"

**Why it fails:** Service objects extracted for length rather than responsibility become grab-bags — `CreateUserService` that does validation, persistence, email sending, and analytics tracking. It has the same problem as the controller, just in a different file. Apply the deletion test: if deleting the service object would leave the controller no simpler, the extraction adds indirection without depth.

**Correct framing:** "What is this object's one job? Can I name it without 'and'?" A service object should represent a single use case or domain operation. If you need "and" to describe it, it needs splitting — not moving to a service object.

---

## Applying Vocabulary in Practice

During **Design** (Quality Loop Step 1):
- Identify the axes of change before writing code
- Name the seams — where will future modifications happen?
- Check if the problem shape matches any trigger in `design-shapes.md`
- State your recommendation: "I see [shape], which suggests [pattern], because [axis of change]"

During **Refactor** (Quality Loop Step 4):
- After mechanical cleanup, do a design pass
- Ask: did the shameless green reveal a shape that wasn't visible in the spec?
- Apply the deletion test to any proposed extraction
- Check: is each module deep (absorbing complexity) or shallow (adding indirection)?

During **Code Review**:
- Design pass BEFORE syntax pass
- Name the shapes you see in the diff
- For each shape, provide your recommended pattern with rationale
- Ask the forward question: "If a new variant appears, how many files change?"
