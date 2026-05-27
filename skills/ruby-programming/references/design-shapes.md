# Design Shape Triggers

Read this during the **Design** step (Stage 1) and the **Design Pass** in the **Refactor** step (Stage 4) of the Quality Loop. Also read during code review before commenting on syntax.

A **shape** is a structural signature in code that suggests a design pattern wants to emerge. Shapes are what you observe; patterns are what you apply. Not every shape demands a pattern — check the threshold gate before acting.

When you spot a shape, **name the pattern and recommend it with rationale** — don't just ask "have you considered X?" Be an active design partner: "This looks like Strategy to me — the gap param being meaningless in parallel mode is the tell. Here's what it would look like..."

---

## Shape 1: Mode-dependent fields

**What you see:** A constructor, config, or struct has fields/params that only make sense when another field has a certain value. Often accompanied by a boolean (`is_serial`, `async`, `type`) that determines which fields matter.

**Pattern:** Strategy (when the modes represent different algorithms) or Sum Type / Sealed Module (when the modes represent different data shapes).

**Threshold gate — apply when ALL true:**
- 2+ fields are meaningless or always-nil in at least one mode
- The modes represent genuinely different behaviors, not just parameter tweaks
- New modes are plausible and likely (even if not planned)

**The question to ask:** "If I set this field to its zero value, does the code still behave correctly? If yes, the field is optional noise — and optional noise across modes means you have two things pretending to be one."

**Ruby example:**
```ruby
# Shape: gap_seconds is meaningless when serial is false
TransmissionConfig.new(serial: true, gap_seconds: 0)
TransmissionConfig.new(serial: false, gap_seconds: nil) # what does this even mean?

# Pattern: Strategy
SerialTransmissionStrategy.new(gap_seconds: 0)
ParallelTransmissionStrategy.new # no gap concept at all
```

**Ruby idiom:** Lightweight strategies can be plain lambdas or blocks rather than full classes. Use a class when the strategy has state or multiple methods; use a lambda when it's a single operation.

**Don't apply when:** The "mode" is a simple feature toggle that doesn't change the algorithm or data shape (e.g., `verbose: true` adds logging but doesn't fork behavior).

---

## Shape 2: Nil as signal

**What you see:** A method returns nil to mean "not applicable" or "not found," and callers guard with `if result.nil?`, `result&.method`, or `result || default`. The nil forces every caller to handle a case that the returning method knew about but didn't express.

**Pattern:** Null Object / Special Case — an object that provides default behavior, eliminating nil checks in callers.

**Threshold gate — apply when ALL true:**
- 3+ callers nil-check the same return value
- The nil case has consistent "default" behavior across callers
- The nil represents a domain concept ("no filing," "guest user," "empty schedule"), not a genuine absence

**The question to ask:** "What does nil *mean* here? If it means 'do nothing' or 'use defaults,' that's a Null Object. If it means 'error — this shouldn't happen,' that's an exception."

**Ruby example:**
```ruby
# Shape: nil return, callers guard
def primary_tax
  taxes.find { |t| t.primary? }  # returns nil if no primary tax
end

# Every caller:
if filing.primary_tax
  filing.primary_tax.rate
else
  BigDecimal("0")
end

# Pattern: NullTax
class NullTax
  def rate = BigDecimal("0")
  def primary? = false
  def present? = false
end

def primary_tax
  taxes.find { |t| t.primary? } || NullTax.new
end
```

**Don't apply when:** Nil genuinely means "we don't have this data and the caller must decide what to do" — different callers handle the absence differently.

---

## Shape 3: Primitive obsession

**What you see:** The same group of primitives (2-3 fields) travel together through multiple methods. Often: amount + currency, start_date + end_date, street + city + state + zip. Methods that operate on these primitives are scattered across the codebase.

**Pattern:** Value Object — an immutable object representing the domain concept these primitives encode.

**Threshold gate — apply when ALL true:**
- 2+ methods take or operate on the same group of primitives
- The primitives have invariants (start_date < end_date) or derived behavior (date_range.includes?(date))
- The concept has a name in the domain language

**The question to ask:** "Would a domain expert name this group of fields as one thing? If yes, it's a Value Object waiting to be born."

**Ruby example:**
```ruby
# Shape: date pair passed together, validated in multiple places
def covers_period?(start_date, end_date, check_date)
  check_date >= start_date && check_date <= end_date
end

# Pattern: DateRange value object
class DateRange < T::Struct
  const :start_date, Date
  const :end_date, Date

  sig { params(date: Date).returns(T::Boolean) }
  def covers?(date)
    date >= start_date && date <= end_date
  end
end
```

**Don't apply when:** The primitives just happen to appear together in one place but don't share invariants or behavior.

---

## Shape 4: Parallel conditionals

**What you see:** The same condition (type, status, category) is checked in 3+ different methods across a class or module. Each method switches on the same discriminator to produce different behavior.

**Pattern:** Replace conditional with polymorphism — each branch becomes a class that handles all behaviors for that case.

**Threshold gate — apply when ALL true:**
- Same condition checked in 3+ methods
- New cases are expected (adding a new type/status should be "add a class," not "edit 5 methods")
- The branching logic isn't trivial (each branch has real behavior, not just returning a constant)

**The question to ask:** "If a new variant appears, how many files do I touch?" If the answer is "every file that has this case statement," that's the Open-Closed Principle telling you to use polymorphism.

**Ruby example:**
```ruby
# Shape: filing_type checked in 3 methods
def template_path
  case filing_type
  when :original then "templates/original.pdf"
  when :amendment then "templates/amendment.pdf"
  end
end

def required_fields
  case filing_type
  when :original then [:ein, :wages]
  when :amendment then [:ein, :wages, :original_values]
  end
end

# Pattern: polymorphism
class OriginalFiling < BaseFiling
  def template_path = "templates/original.pdf"
  def required_fields = [:ein, :wages]
end

class AmendmentFiling < BaseFiling
  def template_path = "templates/amendment.pdf"
  def required_fields = [:ein, :wages, :original_values]
end
```

**Don't apply when:** The cases are stable (won't grow), the logic per branch is trivial (single return value), or this is the only switch point.

---

## Shape 5: Structural duplication with varying steps

**What you see:** Two or more methods share the same overall structure (setup → process → cleanup) but differ in specific steps. The skeleton is identical; the details vary.

**Pattern:** Template Method — define the algorithm skeleton in a base class, let subclasses override specific steps.

**Threshold gate — apply when ALL true:**
- 2+ implementations share 60%+ structural similarity
- The varying steps are well-defined (not scattered throughout)
- The shared structure is unlikely to diverge

**The question to ask:** "If I extracted the common structure, would the varying steps have clear names? If yes, Template Method. If the steps blur together, the similarity might be accidental."

**Ruby idiom:** Template Method in Ruby often appears as hook methods — methods that return defaults in the base class and get overridden in subclasses. Rails uses this extensively (`before_save`, custom `validate` methods). The existing skill already flags `super` in subclasses as a smell — hook methods (`post_initialize`) are the Template Method fix.

**Don't apply when:** Only two examples exist and they're likely to diverge. Wait for the third example — premature Template Method creates coupling.

---

## Shape 6: Side-effect cascade

**What you see:** A method does its primary job, then triggers 3+ unrelated side effects in sequence (send email, log audit, update cache, notify webhook). The method knows too many things about what happens after its core work.

**Pattern:** Observer / Event — decouple the primary action from its consequences.

**Threshold gate — apply when ALL true:**
- 3+ unrelated side effects after the core action
- Side effects change independently (adding a new notification shouldn't require editing the core method)
- The side effects are not essential to the core action's correctness

**The question to ask:** "If I deleted all the side effects, would the core action still be correct? If yes, the side effects are observers, not collaborators."

**Don't apply when:** The "side effects" are actually part of the core transaction (e.g., writing to the primary table AND the audit table in the same transaction).

---

## Shape 7: Query logic scattered through domain

**What you see:** ActiveRecord scopes and where-chains appear inside service objects, domain models, or workers — not in a dedicated query class. The same query pattern appears in 2+ places with slight variations.

**Pattern:** Repository / Query Object — centralize data access behind a domain-meaningful interface.

**Threshold gate — apply when ALL true:**
- Same query logic duplicated in 2+ places
- The query has domain meaning beyond "fetch rows" (e.g., "active filings for quarter")
- The domain object shouldn't know about SQL/ActiveRecord

**The question to ask:** "Could I describe this query in domain language? 'Active filings for Q1' vs 'Filing.where(status: active, period: q1_range)' — if the domain description is clearer, extract a query object."

**Don't apply when:** The query is simple, used in one place, and lives naturally in a scope.

---

## Shape 8: Complex construction with conditional parts

**What you see:** A constructor or factory method takes 8+ parameters, and callers frequently pass nil or default values for half of them. Different callers build the same object with different subsets of fields populated. Often seen in builders for XML payloads, API requests, or document generation configs.

**Pattern:** Builder — separate the construction of a complex object from its representation so the same construction process can create different representations.

**Threshold gate — apply when ALL true:**
- 8+ constructor params, with half conditionally nil/defaulted
- Multiple callers construct the object differently (not just one call site)
- The construction has validation rules or ordering constraints (field A requires field B)

**The question to ask:** "Is the caller doing construction logic (deciding which fields to set) that should live closer to the object? If callers are making the same nil-filling decisions independently, that's construction knowledge leaking."

**Ruby example:**
```ruby
# Shape: callers juggling conditional params
AmendmentPayload.new(
  ein: ein, wages: wages, original_values: orig,
  corrected_values: corr, explanation: nil,
  override_reason: nil, attachment_path: nil,
  filing_period: period
)

# Pattern: Builder
AmendmentPayload.build do |b|
  b.company(ein: ein)
  b.wages(original: orig, corrected: corr)
  b.filing_period(period)
end
```

**Don't apply when:** The constructor has many params but they're all required and always provided — that's just a data struct, not a construction problem.

---

## Shape 9: Layered cross-cutting behavior

**What you see:** Multiple services or methods wrap the same core operation to add logging, retry, formatting, authorization, or metrics. Each wrapper has its own concern but they're mixed into the core class or chained via inheritance.

**Pattern:** Decorator — attach additional responsibilities to an object dynamically, without modifying its class.

**Threshold gate — apply when ALL true:**
- 2+ distinct concerns wrapping the same operation (retry + logging, auth + formatting)
- The concerns are independently optional or composable (not all callers need all wrapping)
- The core operation is clean without the wrapping

**The question to ask:** "If I stripped all the cross-cutting concerns, would the core method be simple and focused? If yes, the concerns are decorators, not part of the core responsibility."

**Ruby example:**
```ruby
# Shape: concerns mixed into core operation
def transmit(filing)
  log("Starting transmission for #{filing.id}")
  retries = 0
  begin
    result = agency_client.submit(filing.payload)
    Metrics.increment("transmissions.success")
    result
  rescue NetworkError => e
    retries += 1
    retry if retries < 3
    Metrics.increment("transmissions.failure")
    raise
  end
end

# Pattern: Decorator via SimpleDelegator or Module#prepend
class RetryingTransmitter < SimpleDelegator
  def transmit(filing)
    Retrier.call(max: 3) { super }
  end
end

class LoggingTransmitter < SimpleDelegator
  def transmit(filing)
    log("Starting transmission for #{filing.id}")
    super
  end
end

transmitter = LoggingTransmitter.new(
  RetryingTransmitter.new(
    AgencyTransmitter.new(client)
  )
)
```

**Ruby idiom:** `SimpleDelegator`, `Delegator`, `Module#prepend`, and `Forwardable` are Ruby's native decorator tools. Prefer `SimpleDelegator` for wrapping instances; `prepend` for modifying a class's method dispatch chain.

**Don't apply when:** The "concerns" are actually essential to the operation's correctness (e.g., authorization isn't optional wrapping — it's a hard requirement).

---

## Shape 10: Operations as data

**What you see:** An action needs to be queued, retried, undone, audited, or composed into batches. The operation is currently an inline method call with no way to inspect, replay, or reverse it after the fact.

**Pattern:** Command — encapsulate an operation as an object, enabling queuing, logging, undo, and composition.

**Threshold gate — apply when ALL true:**
- The operation needs at least one of: undo, retry, audit trail, batching, or deferred execution
- The operation has meaningful state (inputs, timestamp, actor) worth preserving
- Multiple operations need to be treated uniformly (batch processing, transaction log)

**The question to ask:** "Do I need to remember that this happened, undo it, or replay it later? If yes, the operation is data, not just a method call."

**Ruby example:**
```ruby
# Shape: inline operations with no audit/undo capability
def process_amendment(filing, corrected_values)
  filing.update!(values: corrected_values)
  recalculate_totals(filing)
  notify_agency(filing)
end

# Pattern: Command
class AmendFiling
  attr_reader :filing, :original_values, :corrected_values

  def initialize(filing:, corrected_values:)
    @filing = filing
    @original_values = filing.values.dup
    @corrected_values = corrected_values
  end

  def execute
    filing.update!(values: corrected_values)
    recalculate_totals(filing)
    notify_agency(filing)
  end

  def undo
    filing.update!(values: original_values)
    recalculate_totals(filing)
  end
end
```

**Ruby idiom:** Sidekiq workers are essentially serialized commands. If you find yourself building command-like objects, consider whether a well-designed Sidekiq worker already provides the queuing, retry, and audit trail you need.

**Don't apply when:** The operation is simple, synchronous, and never needs replay or undo. Not every method call needs to be a command.

---

## Shape 11: Multi-step pipeline with error bail-outs

**What you see:** A method performs steps in sequence, with `return if error` or nested conditionals after each step.

**Pattern:** Railway / Result — each step returns a Result, failures short-circuit through remaining steps.

**Important: early returns are often the right answer.** A 3-step pipeline with clear, named error types and a readable top-to-bottom flow does NOT need this pattern. Early returns are explicit, boring, and everyone can read them.

**Threshold gate — apply when ALL true:**
- 5+ sequential steps where early returns become a wall of noise
- You're composing pipelines (output of one feeds into another)
- You need to transform or recover from failures at specific points

**The question to ask:** "Would a junior engineer struggle to find the happy path through these early returns?" If the answer is "no, it reads fine," leave it alone.

**This is fine — leave it alone:**
```ruby
def process_filing(filing)
  response = transmit(filing)
  return OperationResult.connection_error(response.error) unless response.ok?

  parsed = parse_response(response.body)
  return OperationResult.communication_failure("Parse error") unless parsed

  ack = validate_acknowledgment(parsed)
  return OperationResult.agency_rejection(ack.reason) unless ack.accepted?

  OperationResult.acknowledged(ack.confirmation_number)
end
```

**When Railway earns its keep — composable multi-stage pipelines:**
```ruby
def process_filing(filing)
  transmit(filing)
    .and_then { |response| parse_response(response.body) }
    .and_then { |parsed| validate_acknowledgment(parsed) }
    .and_then { |ack| Result.success(OperationResult.acknowledged(ack.confirmation_number)) }
end

# Composing pipelines — this is where Railway shines
def transmit_batch(filings)
  filings.map { |f| process_filing(f) }
    .and_then { |results| aggregate_results(results) }
    .and_then { |summary| submit_batch_report(summary) }
end
```

`#and_then` only runs the block on success — failures pass through untouched. The `Result` class is ~15 lines of plain Ruby:

```ruby
class Result
  attr_reader :value, :error

  def self.success(value) = new(value: value)
  def self.failure(error) = new(error: error)

  def success? = @error.nil?
  def failure? = !success?

  def and_then
    return self if failure?
    yield @value
  end
end
```

**Don't apply when:** The pipeline is short (3 or fewer steps), the early returns are clear and named, failures are genuinely exceptional (should raise, not return), or your team isn't familiar with the pattern — readability trumps elegance.

---

## Shape 12: Complex boolean logic for business rules

**What you see:** A method has a long chain of `&&` and `||` conditions to determine whether something applies — "should this company file?", "does this amendment trigger fire?", "is this employee eligible?" The conditions are hardcoded inline, making them impossible to test individually, reuse across contexts, or explain to a product person.

**Pattern:** Specification — encapsulate each business rule as an object with a `#satisfied_by?` method. Compose rules with `#and`, `#or`, `#not` to build complex conditions from simple, testable, nameable parts.

**Threshold gate — apply when ALL true:**
- 3+ conditions combined with `&&`/`||` in a single expression
- The same conditions (or subsets) appear in multiple places
- Individual rules have domain names ("quarterly filer," "California employer," "has payroll this period")
- Product/compliance people discuss these rules by name — they're not implementation details

**The question to ask:** "Could I explain each condition independently to a compliance analyst? If yes, each condition is a specification. If the conditions only make sense together, leave them inline."

**Ruby example:**
```ruby
# Shape: complex inline boolean logic
def amendment_required?(company, filing)
  company.has_employees? &&
    filing.period_closed? &&
    filing.state_code == "CA" &&
    (filing.wages_changed? || filing.withholding_changed?) &&
    (filing.total_difference.abs > BigDecimal("0.05")) &&
    !filing.already_amended?
end

# Pattern: Specification — each rule is testable, nameable, composable
class HasEmployees
  def satisfied_by?(company, _filing) = company.has_employees?
end

class PeriodClosed
  def satisfied_by?(_company, filing) = filing.period_closed?
end

class InState
  def initialize(state_code) = @state_code = state_code
  def satisfied_by?(_company, filing) = filing.state_code == @state_code
end

class ValuesChanged
  def satisfied_by?(_company, filing)
    filing.wages_changed? || filing.withholding_changed?
  end
end

class ExceedsThreshold
  def initialize(threshold) = @threshold = threshold
  def satisfied_by?(_company, filing)
    filing.total_difference.abs > @threshold
  end
end

class NotAlreadyAmended
  def satisfied_by?(_company, filing) = !filing.already_amended?
end

# Compose them
CALIFORNIA_AMENDMENT_REQUIRED = CompositeSpecification.all(
  HasEmployees.new,
  PeriodClosed.new,
  InState.new("CA"),
  ValuesChanged.new,
  ExceedsThreshold.new(BigDecimal("0.05")),
  NotAlreadyAmended.new
)

def amendment_required?(company, filing)
  CALIFORNIA_AMENDMENT_REQUIRED.satisfied_by?(company, filing)
end
```

The `CompositeSpecification` that ties it together is simple:

```ruby
class CompositeSpecification
  def self.all(*specs)
    new(specs, :all?)
  end

  def self.any(*specs)
    new(specs, :any?)
  end

  def initialize(specs, combinator)
    @specs = specs
    @combinator = combinator
  end

  def satisfied_by?(*args)
    @specs.send(@combinator) { |spec| spec.satisfied_by?(*args) }
  end
end
```

**Why this is powerful:**
- Each rule gets its own test: `expect(HasEmployees.new).to be_satisfied_by(company, filing)`
- New rules are added by creating a class, not editing a conditional
- Rules compose: `CompositeSpecification.all(base_rules, InState.new("NY"))` creates a NY variant without duplicating logic
- Compliance can read the composition: "California amendment required = has employees AND period closed AND in state CA AND values changed AND exceeds threshold AND not already amended"

**Don't apply when:** The condition is simple (2 or fewer checks), only used in one place, or the individual rules don't have meaningful domain names. Not every `if` needs to be a specification.

---

## The Deletion Test (universal)

For any proposed extraction, module, or abstraction — not just these shapes:

> "Imagine deleting this module. Does complexity vanish (it was earning its keep) or reappear across every caller (it was a pass-through adding indirection without depth)?"

Modules that earn their keep **absorb complexity** — callers become simpler because the module handles the hard parts. Pass-through modules just move complexity without reducing it.

Apply this test before every extraction. If deleting the proposed abstraction would leave callers no more complex than before, don't extract.
