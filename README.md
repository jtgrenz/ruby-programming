# ruby-programming

Ruby design guidance and proportional development workflows for Claude Code and Codex.

The package separates collaborative shaping from autonomous delivery: pairing makes one bounded edit and stops for review; explicit plan execution owns TDD and completion checks.

## Installation

### Codex

```bash
codex plugin marketplace add jtgrenz/ruby-programming
codex plugin add ruby-programming@ruby-programming
```

Start a new thread after installing or updating so Codex loads the current skills.

### Claude Code from GitHub

```bash
# Add as a marketplace source (one-time)
claude plugin marketplace add jtgrenz/ruby-programming

# Install the plugin
claude plugin install ruby-programming

# Enable it
claude plugin enable ruby-programming
```

### Claude Code from a local clone

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

Start a new Claude Code session or Codex thread. You should see:
- `ruby-programming:ruby-programming` (ambient — auto-loads for Ruby work)
- `ruby-programming:brainstorm`
- `ruby-programming:execute-plan`
- `ruby-programming:ruby-review`
- `ruby-programming:pair`

## Skills

| Skill | Type | Invoke |
|-------|------|--------|
| `ruby-programming` | Ambient | Loads for Ruby work and selects shaping, delivery, or review |
| `brainstorm` | Invokeable | Claude: `/ruby-programming:brainstorm`; Codex: `$ruby-programming:brainstorm` |
| `execute-plan` | Invokeable | Claude: `/ruby-programming:execute-plan`; Codex: `$ruby-programming:execute-plan` |
| `ruby-review` | Invokeable | Claude: `/ruby-programming:ruby-review`; Codex: `$ruby-programming:ruby-review` |
| `pair` | Invokeable | Claude: `/ruby-programming:pair`; Codex: `$ruby-programming:pair` |

## What it does

### Design Shape Recognition

The skill teaches coding agents to recognize 14 structural patterns ("shapes") in code that suggest a design pattern wants to emerge. Each shape has a **threshold gate** — conditions that must ALL be true before recommending the pattern. This prevents over-engineering.

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

### Proportional workflow

- **Pairing/shaping:** make the requested edit, inspect the diff, and stop for direction.
- **Behavior delivery:** use a focused failing example and the smallest coherent implementation.
- **Mechanical work:** establish coverage for the behavior being preserved, then make the known change directly; do not force a failing test for existing behavior.
- **Verification:** review every written plan once, then run focused checks while working and one Ruby verifier pass on the stable implementation before commit.

### Preparatory Refactoring

When existing code doesn't have the seams to receive new behavior cleanly, the design check identifies this and triggers a refactoring-first approach: restructure in a separate commit (zero behavior change, all tests green), then build the new behavior against the clean structure. Signals include scattered related methods in a bloated host class, repeated conditionals on the same discriminator, and painful test setup from coupling. Based on Feathers (Working Effectively with Legacy Code), Fowler (Refactoring), and Beck ("make the change easy, then make the easy change").

## How the skills compose

- **`ruby-programming`** (ambient) chooses collaborative shaping, autonomous delivery, or read-only review before applying Ruby guidance
- **`brainstorm`** wraps `superpowers:brainstorming` with design shape analysis, threshold gates, and preparatory refactoring assessment
- **`execute-plan`** reviews an unreviewed plan before execution, then completes it with proportional TDD and one final Ruby and plan-compliance review
- **`ruby-review`** does a Ruby design pass (shapes, connascence, SOLID, and missed preparatory refactoring) alongside the host's general code review
- **`pair`** presents bounded shaping diffs early, reviews explicit plans once, and runs Ruby verification only after direction stabilizes and before commit

All skills work standalone if superpowers isn't installed — they have fallback paths.

## Pair Plans extension (VS Code / Cursor)

When explicitly asked for a phased roadmap or durable handoff, `pair` writes working docs into an uncommitted `.pair-plans/` folder. The companion **Pair Plans** extension gives those files a dedicated sidebar view.

It lives in [`extensions/pair-plans/`](extensions/pair-plans/). Grab the `.vsix` from the [Releases page](https://github.com/jtgrenz/ruby-programming/releases) and install it (`cursor --install-extension` / `code --install-extension`), or see the [extension README](extensions/pair-plans/README.md) for the full rundown.

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
