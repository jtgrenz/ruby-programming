# ruby-programming

Ruby design pattern recognition, quality enforcement, and structured development workflows for Claude Code.

Teaches Claude to recognize structural patterns (design shapes) in Ruby code, check threshold gates before recommending changes, and use precise vocabulary (connascence, SOLID) instead of vague "make it extensible" advice.

## Installation

### From GitHub (recommended)

```bash
# Add as a marketplace source (one-time)
claude plugin marketplace add jtgrenz/ruby-programming

# Install the plugin
claude plugin install ruby-programming

# Enable it
claude plugin enable ruby-programming
```

### From a local clone

```bash
# Clone the repo
git clone https://github.com/jtgrenz/ruby-programming.git ~/ruby-programming

# Load for a single session
claude --plugin-dir ~/ruby-programming

# Or add as a local marketplace for all sessions
claude plugin marketplace add ~/ruby-programming
claude plugin install ruby-programming
claude plugin enable ruby-programming
```

### Verify installation

Start a new Claude Code session. You should see these skills available:
- `ruby-programming:ruby-programming` (ambient — auto-loads for Ruby work)
- `ruby-programming:brainstorm`
- `ruby-programming:execute-plan`
- `ruby-programming:ruby-review`
- `ruby-programming:pair`

## Skills

| Skill | Type | Trigger |
|-------|------|---------|
| `ruby-programming` | Ambient | Auto-loads when working with Ruby code |
| `brainstorm` | Invokeable | `/ruby-programming:brainstorm` |
| `execute-plan` | Invokeable | `/ruby-programming:execute-plan` |
| `ruby-review` | Invokeable | `/ruby-programming:ruby-review` |
| `pair` | Invokeable | `/ruby-programming:pair` |

## What it does

### Design Shape Recognition

The skill teaches Claude to recognize 14 structural patterns ("shapes") in code that suggest a design pattern wants to emerge. Each shape has a **threshold gate** — conditions that must ALL be true before recommending the pattern. This prevents over-engineering.

### Design Vocabulary

Precise terms replace vague advice:
- "Axes of change" instead of "this might need to be flexible"
- "Connascence of Meaning" instead of "this boolean is confusing"
- "Open/Closed Principle" instead of "this should be extensible"
- "Actions, Calculations, Data" instead of "keep the business logic separate"
- Threshold gates, seams, forward questions, deletion tests

All terms are explained with parenthetical definitions on first use — the skill assumes your team hasn't seen these concepts before.

### Quality Checklist

A structured audit covering naming, method structure, object design, Sorbet types, error handling, testing patterns, and design smells. Used by the ruby-verifier agent during execute-plan, and by ruby-review for PR feedback.

### The Quality Loop

The 8-step development cycle that all skills follow:

1. **Design** — shape triggers, sorbet type triggers, seam identification, preparatory refactoring check
2. **Red** — one failing test
3. **Green** — shameless green (simplest code that passes)
4. **Refactor** — mechanical pass then design pass
5. **Simplify** — expression-level compression, name-at-call-site audit, extraction justification. Loops until clean.
6. **Next test** — repeat 2-5
7. **Pre-flight sweep** — binary mechanical checks (T.must comments, no T.untyped, keyword args, methods under 15 lines, etc.)
8. **Verify** — fresh-eyes ruby-verifier agent. Gate before the user sees anything.

### Preparatory Refactoring

When existing code doesn't have the seams to receive new behavior cleanly, the Design step (Step 1) identifies this and triggers a refactoring-first approach: restructure in a separate commit (zero behavior change, all tests green), then start TDD against the clean structure. Signals include scattered related methods in a bloated host class, repeated conditionals on the same discriminator, and painful test setup from coupling. Based on Feathers (Working Effectively with Legacy Code), Fowler (Refactoring), and Beck ("make the change easy, then make the easy change").

## How the skills compose

- **`ruby-programming`** (ambient) auto-loads design shapes and vocabulary into every Ruby session
- **`brainstorm`** wraps `superpowers:brainstorming` with design shape analysis, threshold gates, and preparatory refactoring assessment
- **`execute-plan`** wraps `superpowers:subagent-driven-development` with Shameless Green, the full quality loop, and the ruby verifier
- **`ruby-review`** does a design pass (shapes, connascence, SOLID, missed prep-refactoring), dispatches the ruby verifier, and complements the built-in `/code-review` for the structural scan (bugs, CLAUDE.md compliance, git history)
- **`pair`** is for sustained collaborative work across multiple PRs. Socratic context-building (short-term AND long-term scope), phased roadmap, then iterative implementation where the user reviews every commit. Uses the ruby verifier and TDD cycle but never auto-executes.

All skills work standalone if superpowers isn't installed — they have fallback paths.

## Sources

The skill's principles draw from:

- Practical Object-Oriented Design in Ruby (Metz)
- 99 Bottles of OOP (Metz & Owen)
- Polished Ruby Programming (Evans)
- Eloquent Ruby (Olsen)
- Clean Code / Clean Architecture / The Clean Coder (Martin)
- The Pragmatic Programmer (Hunt & Thomas)
- The Complete Guide to Rails Performance (Berkopec)
- A Philosophy of Software Design (Ousterhout)
- Working Effectively with Legacy Code (Feathers)
- Refactoring (Fowler)
- Tidy First? (Beck)
- Design Patterns in Ruby (Olsen)
- Grokking Simplicity (Normand)
