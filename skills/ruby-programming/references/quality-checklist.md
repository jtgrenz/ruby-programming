# Ruby Quality Checklist

Read this during the **Verify** step (Step 8) of the Quality Loop and when reviewing Ruby code in PRs.

## Naming

- [ ] Every name reveals intent without needing a comment
- [ ] No noise words (`data`, `info`, `manager`, `processor`, `handler`)
- [ ] One word per concept across the module (not mixing `fetch`/`get`/`retrieve`)
- [ ] Variables spelled out — no abbreviations except `k`/`v`/`i`
- [ ] Method names at the right abstraction level (not implementation-leaking)
- [ ] Method names accurate at the **call site** — name describes the method's full behavior, including all branches and early returns (not just the happy path or primary check)
- [ ] No comments explaining WHAT code does (rename/extract instead). Comments only for complex domain WHY (tax law, regulatory constraints) or high-level algorithmic strategy on well-factored code

## Method Structure

- [ ] Each method operates at one abstraction level (stepdown rule)
- [ ] No boolean params that fork execution paths (ok for modifiers like `validate:`, filters like `include_inactive:`, guards like `force:`)
- [ ] Command-query separation (methods do OR answer, never both)
- [ ] No side effects hidden behind misleading names
- [ ] Methods ~10-15 lines; longer = extract
- [ ] Keyword arguments for 2+ parameters
- [ ] Transformations use functional methods (`map`/`select`/`reject`/`filter_map`/`transform_values`/`each_with_object`) — no imperative loops building arrays via `<<` or mutating accumulators

## Object Design

- [ ] Each class has one reason to change (SRP — identify the actor)
- [ ] Class name passes the naming diagnostic (no "and" needed to describe it)
- [ ] Object or data structure — not a hybrid (no ActiveRecord model with business logic mixed in)
- [ ] Dependencies injected, not hardcoded
- [ ] No Demeter violations (`a.b.c.d` → tell `a` what you need)
- [ ] Entity vs Use Case distinction clear (abacus test: would this rule exist without a computer?)

## Sorbet & Types

- [ ] File is `typed: strict` (new files) or matches existing typing level (modified files)
- [ ] `T.sig` on every method (enforced by `typed: strict`)
- [ ] `T.nilable` used explicitly for nullable values (not bare nil returns)
- [ ] `T::Struct` for data, classes with `extend T::Sig` for behavior
- [ ] Duck types expressed as `T::Interface`
- [ ] `T.unsafe` has an inline comment explaining WHY
- [ ] Every `T.must` is justified — value truly cannot be nil (not just "shouldn't be"). If nil is possible, handle it explicitly instead

## Error Handling

- [ ] Never returns nil from own methods (use empty collections, exceptions, or Special Case objects)
- [ ] Side-effect methods raise on failure (not silent return)
- [ ] Third-party exceptions wrapped in domain exceptions
- [ ] No `rescue Exception` — only `StandardError` or specific subclasses
- [ ] No exceptions for flow control

## Testing

- [ ] Build-Operate-Check structure visible (`let`/`subject`/`expect` separated)
- [ ] One concept per test (one `context` per scenario)
- [ ] Expected values hard-coded (no production methods in assertions)
- [ ] Verifying doubles used (`instance_double` not `double`)
- [ ] Message testing matrix followed:
  - Incoming query → assert return value
  - Incoming command → assert side effect
  - Outgoing command → assert message sent (mock)
  - Outgoing query → do NOT test
  - Private method → NEVER test directly
- [ ] Domain-specific helper methods for repetitive setup
- [ ] No assertions on what Sorbet already proves (non-nilable types, enforced return types)
- [ ] No guards/skips that can't fire (crash would happen before the guard)
- [ ] New tests added to existing spec files rather than creating standalone files when coverage overlaps

## Smells (flag any found)

| Smell | Fix |
|-------|-----|
| `case obj.class` / `is_a?` / `kind_of?` | Missing polymorphism — extract duck type or `T::Interface` |
| `if @type == :foo` | Create class hierarchy |
| Duplicate conditional branches | Extract shared abstraction |
| Raw boolean expression in `if` | Extract named predicate method |
| Methods must be called in specific order | Bucket brigade: each method returns a value consumed by the next |
| Magic numbers/strings | Named constants |
| `obj.foo.bar.baz` | Tell, don't ask — add interface to `obj` |
| Method returns nil | Special Case object, empty collection, or raise |
| `@@class_var` | Class instance variable |
| `Proc.new` for callbacks | Use `lambda` |
| `super` in subclass | Hook methods (`post_initialize`) |
| Testing private methods | Test via public interface |
| Testing outgoing queries | Remove test — receiver's job |
| Boolean parameter that forks execution | Split into two well-named methods |
| Hardcoded class name in method | Inject the dependency |
| 3+ positional args | Keyword arguments |
| `rescue Exception` | `rescue StandardError` |
| Exceptions for flow control | Use conditionals |
| Guard/assertion on non-nilable Sorbet type | Remove — Sorbet already proves it |
| `T.must` without proven impossibility of nil | Handle nil explicitly or prove why it's impossible |
| Dead guard (`skip`/`next` that can't fire) | Remove — crash happens before the guard |
| New spec file for tests that fit existing spec | Merge into existing spec |
| Boolean field as type discriminator for sibling fields | Sealed module / sum type with typed variants — each variant carries only its data |
| Domain concept as raw primitive (money as `Integer`, date range as two `Date` fields) | Extract value object (`T::Struct` or `Data`) encapsulating the concept |
| String/symbol/integer as type code (`status: 'active'`, `type: :admin`) | `T::Enum`, enum, or class hierarchy |

## Design Shapes (flag for parent agent review)

Flag these if observed. **Do not recommend specific patterns** — the parent agent has domain context you don't. Just report what you see.

| Shape | What to flag |
|-------|-------------|
| Constructor/struct param meaningless in some modes (nil/ignored when a boolean or type field has certain values) | Possible missing strategy or sum type — see `design-shapes.md` Shape 1 |
| Method returns nil, 3+ callers nil-guard the same return value | Possible missing Null Object — see Shape 2 |
| Same group of 2-3 primitives passed together through multiple methods | Possible missing value object — see Shape 3 |
| Same condition (`case`/`if` on type, status, category) checked in 3+ methods | Possible missing polymorphism — see Shape 4 |
| 8+ constructor params, half conditionally nil or defaulted | Possible missing builder — see Shape 8 |
| Method wraps another just to add logging/retry/auth/metrics | Possible decorator candidate — see Shape 9 |
| 3+ sequential steps with `return if error` / nested conditionals after each | Possible missing Result type / railway — see Shape 11 |
| 3+ conditions chained with `&&`/`||`, especially if reused elsewhere | Possible missing specification — see Shape 12 |

## Simplicity (flag any found)

| Smell | Fix |
|-------|-----|
| Method replaceable by a Ruby built-in (`each_with_object` → `transform_values`, custom loop → `filter_map`) | Use the built-in |
| Method that wraps a single built-in call | Inline it — the wrapper adds indirection without depth |
| Multi-line conditional that could be a guard clause + early return | Restructure to guard clause |
| Multi-line block that could be a one-liner without losing clarity | Collapse it |
| Local variable assigned and returned on the next line | Inline the expression |
| Intermediate variable with a name that just restates the right-hand side (`result = calculate_result`) | Inline it |
| Class with one public method that could be a lambda or method object | Downgrade to lambda unless it has meaningful state |
| Method deletable because its caller could do the work inline | Delete it |
| Method longer than its caller | The abstraction may be at the wrong level — the caller is the simple part |
| Extracted method that doesn't survive the deletion test (inlining it doesn't make the caller harder to read) | Inline it — the extraction adds indirection without absorbing complexity |

## Architecture (for larger changes)

- [ ] Dependencies point inward (business rules don't import from controllers, workers, or framework)
- [ ] Business logic in POROs (testable without Rails)
- [ ] Third-party APIs wrapped behind adapter interfaces
- [ ] New behavior added by extension (new files), not modification (editing existing files)
