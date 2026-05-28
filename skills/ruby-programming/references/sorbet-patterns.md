# Sorbet Type-Level Design Triggers

Read this during the **Design** step (Stage 1) and the **Design Pass** in the **Refactor** step (Stage 4) of the Quality Loop — alongside `design-shapes.md`. Design shapes tell you what structural pattern to apply; these triggers tell you which **Sorbet type tool** expresses it.

---

## Trigger 1: Closed set of variants with per-variant data

**What you see:** A type hierarchy where each subtype carries different fields. Often a `type` or `kind` field determines which sibling fields are populated, or you're modeling a result/response that has distinct success/failure shapes.

**Type tool:** `sealed!` + `T::Struct` variants + `T.absurd` for exhaustiveness.

**Threshold — use when ALL true:**
- The set of variants is **closed** (you own them all, new ones are rare/never)
- Each variant carries **different data** (not just different values of the same fields)
- Callers branch on the variant type (match/case)

```ruby
module Result
  extend T::Helpers
  sealed!
  abstract!
end

class Success < T::Struct
  include Result
  const :value, String
end

class Failure < T::Struct
  include Result
  const :error, StandardError
end

# Exhaustiveness — Sorbet errors if you miss a variant
case result
when Success then result.value
when Failure then result.error.message
else T.absurd(result)
end
```

**Don't use `sealed!` when:** Variants have the same fields (use `T::Enum` instead). The hierarchy is open to extension by other teams/files.

---

## Trigger 2: Closed set of simple named values

**What you see:** A status, category, or mode represented as strings or symbols. Callers compare with `==` or switch on the value.

**Type tool:** `T::Enum`.

**Threshold — use when ALL true:**
- The set is **closed** and **small** (you own all values)
- Variants are **identifiers**, not data carriers (no per-variant fields needed)
- You need round-trip serialization (DB, API, wire format)

```ruby
class Status < T::Enum
  enums do
    Pending = new('pending')
    Active  = new('active')
    Closed  = new('closed')
  end
end
```

**Antipattern: metadata-laden enums.** Don't attach inner `Metadata` classes, JSON lookup tables, or complex behavior methods to `T::Enum`. If each variant needs its own data, that's Trigger 1 — use `sealed!` + `T::Struct`. Enums are dumb identifiers.

**Don't use `T::Enum` when:** Variants carry per-variant data (use `sealed!`). The set is open to extension (use a registry or lookup table).

---

## Trigger 3: Complex type expression used in 2+ places

**What you see:** A `T.any(...)`, `T.all(...)`, or hash-shape type repeated across sigs.

**Type tool:** `T.type_alias`.

```ruby
# Before: repeated in every sig
sig { params(record: T.any(ElectronicPayment, WirePayment, CheckPayment)).void }

# After: named once
PaymentRecord = T.type_alias { T.any(ElectronicPayment, WirePayment, CheckPayment) }
sig { params(record: PaymentRecord).void }
```

**Pair pattern:** When code needs both instance types and class-object types for the same hierarchy, define paired aliases:
```ruby
Any      = T.type_alias { T.any(MinMax, OneOf) }
ClassOfAny = T.type_alias { T.any(T.class_of(MinMax), T.class_of(OneOf)) }
```

---

## Trigger 4: Method accepts a class object as argument

**What you see:** A method takes a class (not an instance) and calls class methods on it — factory patterns, registry lookups, batch operations.

**Type tool:** `T.class_of(BaseClass)`.

```ruby
sig { params(model: T.class_of(ApplicationRecord)).returns(Integer) }
def count(model) = model.count
```

**When the class also has mixed-in class methods**, use `T.all` to add the mixin:
```ruby
sig { params(job: T.all(T::Class[Sidekiq::Job], Sidekiq::Job::ClassMethods)).void }
```

**Gotcha:** `T.class_of(SomeModule)` means the module object itself, NOT "any class including this module."

---

## Trigger 5: Module method returns self for chaining

**What you see:** A module method that returns `self` so callers can chain. Without proper typing, the return type would be the module, not the concrete includer.

**Type tool:** `T.self_type` (instance methods in modules/abstract classes).

```ruby
module Chainable
  sig { returns(T.self_type) }
  def reset
    # ...
    self
  end
end
```

**Don't confuse with `T.attached_class`:** `T.self_type` is for instance methods returning `self`. `T.attached_class` is for class methods returning instances (Trigger 6).

---

## Trigger 6: Class method returns new (factory pattern)

**What you see:** A `self.create`, `self.build`, `self.from_params`, or similar class method that calls `new`. Must work correctly when inherited by subclasses.

**Type tool:** `T.attached_class`.

```ruby
sig { returns(T.attached_class) }
def self.generate
  new(code: SecureRandom.hex)
end
```

**Critical:** Must call `self.new`, never `Parent.new`. Otherwise subclass factory methods silently return the parent type.

---

## Trigger 7: Block where self is untyped (Rails callbacks, DSLs)

**What you see:** A lambda/block inside `validates`, `before_create`, `included do`, or `instance_eval` where Sorbet can't infer what `self` is. Methods on self show as errors.

**Type tool:** `T.bind(self, ConcreteType)`.

```ruby
validates(:amount, if: -> {
  T.bind(self, Payment)
  paid_by_direct_deposit?
})
```

No-op at runtime. Required in `ActiveSupport::Concern` blocks and callback lambdas. For method sigs that take DSL blocks, `T.proc.bind(Type).void` is the "proper" form.

---

## Trigger 8: Module that depends on methods from a specific base class

**What you see:** A module calls methods it doesn't define — they come from an expected base class. Including the module in the wrong class would crash at runtime.

**Type tool:** `requires_ancestor { BaseClass }`.

```ruby
module Retryable
  extend T::Helpers
  requires_ancestor { PaymentsSubmissionJob }
end
```

Sorbet enforces the requirement at typecheck time. Experimental — requires enable flag.

---

## Trigger 9: Module provides both instance and class methods

**What you see:** The standard Ruby concern pattern — `include MyModule` adds instance methods AND class methods via `self.included + extend ClassMethods`.

**Type tool:** `mixes_in_class_methods(ClassMethods)`.

```ruby
module Searchable
  extend T::Helpers

  module ClassMethods
    sig { params(q: String).returns(T::Array[T.untyped]) }
    def search(q) = ...
  end

  mixes_in_class_methods(ClassMethods)
end
```

Without this, Sorbet can't see the class-level methods. The `ClassMethods` module must be defined before the `mixes_in_class_methods` call.

---

## Trigger 10: Container or wrapper that should be generic

**What you see:** A class wraps a value and the value's type should flow through to callers. Or an abstract base defines a type that concrete subclasses pin.

**Type tools:**
- `type_member` — instance-level generic. Each instance picks its type. Generic containers.
- `type_template` — class-level abstract type. Fixed per subclass. Framework extension points.

```ruby
# type_member: generic container
class EffectiveDated < T::Struct
  extend T::Generic
  Elem = type_member
  const :effective_from, Date
  const :element, Elem
end
# Usage: EffectiveDated[TaxRate]

# type_template: abstract base
class BaseRepo
  extend T::Generic
  abstract!
  RecordType = type_template
end
class UserRepo < BaseRepo
  RecordType = type_template { { fixed: User } }
end
```

**Bounds:** `{ upper: SomeInterface }` means "must satisfy this interface." `{ fixed: ConcreteType }` pins in concrete subclasses. Without a bound, the type parameter has no methods — you can only pass it through.

**Variance:** `:out` (covariant, output-only), `:in` (contravariant, input-only), invariant (default, both positions).

---

## Trigger 11: Typed block or callback parameter

**What you see:** A method takes a block/proc with a specific signature — the types of its arguments and return value matter to the caller.

**Type tool:** `T.proc.params(...).returns(...)`.

```ruby
sig { params(blk: T.proc.params(item: String).returns(Integer)).returns(T::Array[Integer]) }
def transform(items, &blk) = items.map(&blk)
```

- `T.proc.void` for void blocks.
- `T.nilable(T.proc...)` for optional blocks.
- Name reusable proc types with `T.type_alias`.
- Static-only — no runtime checking on proc signatures.

---

## Quick decision table

| You see... | Reach for... |
|---|---|
| Closed variants with different data | `sealed!` + `T::Struct` |
| Closed set of named values (no per-variant data) | `T::Enum` |
| Repeated compound type expression | `T.type_alias` |
| Class object as argument | `T.class_of` |
| Instance method returns self in module | `T.self_type` |
| Class factory method returns new | `T.attached_class` |
| Untyped self in callback/block | `T.bind` |
| Module needs methods from a base class | `requires_ancestor` |
| Module adds class methods to includers | `mixes_in_class_methods` |
| Wrapper/container should preserve inner type | `type_member` / `type_template` |
| Method takes a typed block | `T.proc` |
| Correctness depends on no subclassing | `final!` |

## Antipatterns

| Don't... | Instead... |
|---|---|
| Attach metadata/JSON lookups to `T::Enum` | Use `sealed!` + `T::Struct` when variants need data |
| Use `T.must` without proving nil is impossible | Handle nil explicitly, or document why it can't be nil |
| Use `T.unsafe` without a WHY comment | Always explain the Sorbet limitation you're working around |
| Write `T.class_of(Module)` expecting "any includer" | Use `T.all(T::Class[Base], Mixin::ClassMethods)` |
| Call `Parent.new` in a `T.attached_class` method | Always call `self.new` so subclasses return their type |
| Use `sealed!` when variants have the same fields | Use `T::Enum` for simple identifiers |
