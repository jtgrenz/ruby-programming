# Sorbet Patterns Reference

When-to-use guidance for Sorbet features beyond basic sigs. Read this when writing or reviewing Ruby that involves type-level design decisions.

## Sum Types: sealed! + T::Struct

Use `sealed!` when a type has a **closed set of variants** and each variant carries **different data**.

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
```

- All variants must be in the **same file**.
- Use `T.absurd(x)` in the `else` branch of `case` to get compile-time exhaustiveness.
- Prefer `sealed!` over `T::Enum` when variants need per-variant fields or methods.

## T::Enum: Closed Value Sets

Use for a **fixed set of simple named values** — statuses, categories, modes.

```ruby
class Status < T::Enum
  enums do
    Pending = new('pending')
    Active  = new('active')
    Closed  = new('closed')
  end
end
```

- Enums are **dumb identifiers**. Don't attach metadata classes, JSON lookup tables, or complex behavior methods. If you need per-variant data, switch to `sealed!` + `T::Struct`.
- `serialize` / `deserialize` handle string conversion.
- `T.absurd(self)` in `case self` for exhaustiveness.

## T.type_alias: Naming Complex Types

Use to **name a union, intersection, or compound type** for reuse.

```ruby
PaymentRecord = T.type_alias { T.any(ElectronicPayment, WirePayment, CheckPayment) }
```

- Required for assigning `T.any(...)` or `T.all(...)` to constants (bare assignment silently creates a non-type value).
- Aliases are static-only — cannot use in `case`/`when` at runtime.
- For paired class-object aliases: `ClassOfX = T.type_alias { T.any(T.class_of(A), T.class_of(B)) }`.

## T.all: Intersection Types

Use when a value must satisfy **multiple unrelated interfaces simultaneously**.

```ruby
sig { params(job_class: T.all(T::Class[Sidekiq::Job], Sidekiq::Job::ClassMethods)).void }
```

- Most useful with **modules/interfaces**, not concrete classes.
- `T.all(Parent, Child)` collapses to `Child`.
- `T.all(ClassA, ClassB)` where neither inherits → `T.noreturn` (impossible).
- With generics: `T.all(T.type_parameter(:U), SomeInterface)` constrains a type parameter.

## T.class_of: Class Object Types

Use when accepting a **class object** (not an instance) as a parameter.

```ruby
sig { params(model: T.class_of(ApplicationRecord)).returns(Integer) }
def count(model) = model.count
```

- `T.class_of(Module)` means the module object itself, NOT "any class including this module."
- For generic factory methods, use `T::Class[T.type_parameter(:X)]` instead.

## T.self_type: Fluent Module Returns

Use in **module instance methods** that return `self` to preserve the includer's concrete type.

```ruby
module Chainable
  sig { returns(T.self_type) }
  def reset
    # ...
    self
  end
end
```

- Output-only (cannot use in params).
- Only works in modules and abstract methods, not concrete classes.
- Not runtime-checked.

## T.attached_class: Factory Class Methods

Use in **class methods** that return `new` — preserves the subclass type through inheritance.

```ruby
sig { returns(T.attached_class) }
def self.create(...)
  new(...)
end
```

- Must call `self.new`, not `Parent.new`.
- Output-only.
- For modules that get `extend`ed: use `has_attached_class!(:out)`.

**Don't confuse:** `T.self_type` = instance methods returning self. `T.attached_class` = class methods returning instances.

## T.bind: Narrowing self in Blocks

Use inside **blocks where Sorbet can't infer self** — Rails callbacks, `included do`, `instance_eval`.

```ruby
before_create :set_pending, if: -> {
  T.bind(self, Post)
  draft?
}
```

- No-op at runtime. Tells Sorbet what `self` is.
- Only works with `self`. For other variables, use `T.cast`.
- The "proper" way is `T.proc.bind(Type).void` on the method sig; `T.bind` inside the block is the escape hatch.

## requires_ancestor: Module Prerequisites

Use to **prevent a module from being included in incompatible classes**.

```ruby
module Retryable
  extend T::Helpers
  requires_ancestor { PaymentsSubmissionJob }
end
```

- Experimental — requires enable flag.
- Requirements are transitive.
- Use when a module calls methods from an expected base class.

## mixes_in_class_methods: Typed Concerns

Use when a module provides **both instance and class methods** to includers.

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

- Without this, Sorbet can't see class methods added via `self.included`.
- `ClassMethods` must be defined before the `mixes_in_class_methods` call.

## final!: No Subclassing

Use when **correctness depends on no overrides** — security-critical code, lock-acquiring methods.

```ruby
class Credentials
  extend T::Helpers
  final!

  sig(:final) { params(token: String).returns(T::Boolean) }
  def valid?(token) = ...
end
```

- All methods must be `sig(:final)`.
- Requires `T::Configuration.enable_final_checks_on_hooks` at boot.
- Mocking frameworks can't stub final methods.
- For "only these subclasses," use `sealed!` instead.

## T.proc: Typed Blocks

Use for **any method that takes a block with a specific contract**.

```ruby
sig { params(blk: T.proc.params(item: String).returns(Integer)).returns(T::Array[Integer]) }
def transform(items, &blk) = items.map(&blk)
```

- `T.proc.void` for void blocks.
- `T.nilable(T.proc...)` for optional blocks.
- Static-only — no runtime checking on proc signatures.
- Cannot express keyword args, optional params, or rest params.
- Name reusable proc types with `T.type_alias`.

## Generics: type_member and type_template

### type_member — instance-level generic

```ruby
class Box
  extend T::Generic
  Elem = type_member
  const :value, Elem
end
# Usage: Box[Integer]
```

### type_template — class-level abstract type

```ruby
class BaseRepo
  extend T::Generic
  abstract!
  RecordType = type_template
end

class UserRepo < BaseRepo
  RecordType = type_template { { fixed: User } }
end
```

### Bounds

```ruby
Elem = type_member { { upper: Numeric } }    # must be subtype of Numeric
Elem = type_member { { fixed: String } }      # exactly String
Elem = type_member(:out)                       # covariant (output only)
Elem = type_member(:in)                        # contravariant (input only)
```

- **type_member**: varies per instance. Generic containers.
- **type_template**: fixed per subclass. Framework extension points.
- Type-erased at runtime — `Box[Int]` and `Box[String]` are indistinguishable.
- Bare type parameters have no methods. Use `upper:` bound to access interface methods.

## Flow-Sensitive Typing

Sorbet narrows types automatically through control flow:
- `is_a?`, `nil?`, truthiness, `case`/`when`, `blank?`/`present?`
- **Method calls break narrowing** — store in a local variable first.
- `respond_to?` does NOT narrow.
- `T.absurd(x)` in `else` proves exhaustiveness.

## Type Assertions Quick Reference

| Assertion | Use when |
|---|---|
| `T.let(x, Type)` | Declaring variable type (strictest) |
| `T.cast(x, Type)` | You know more than Sorbet |
| `T.must(x)` | Asserting non-nil (prove it first) |
| `T.bind(self, Type)` | Narrowing self in blocks |
| `T.absurd(x)` | Proving exhaustiveness in case/else |
| `T.unsafe(x)` | Escape hatch (always comment WHY) |
