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

## Skills

| Skill | Type | Trigger |
|-------|------|---------|
| `ruby-programming` | Ambient | Auto-loads when working with Ruby code |
| `brainstorm` | Invokeable | `/ruby-programming:brainstorm` |
| `execute-plan` | Invokeable | `/ruby-programming:execute-plan` |
| `ruby-review` | Invokeable | `/ruby-programming:ruby-review` |

## What it does

### Design Shape Recognition

The skill teaches Claude to recognize 12 structural patterns ("shapes") in code that suggest a design pattern wants to emerge. Each shape has a **threshold gate** — conditions that must ALL be true before recommending the pattern. This prevents over-engineering.

### Design Vocabulary

Precise terms replace vague advice:
- "Axes of change" instead of "this might need to be flexible"
- "Connascence of Meaning" instead of "this boolean is confusing"
- "Open/Closed Principle" instead of "this should be extensible"
- Threshold gates, seams, forward questions, deletion tests

All terms are explained with parenthetical definitions on first use — the skill assumes your team hasn't seen these concepts before.

### Quality Checklist

A structured audit covering naming, method structure, object design, Sorbet types, error handling, testing patterns, and design smells. Used by the ruby-verifier agent during execute-plan, and by ruby-review for PR feedback.

### Shameless Green + Pre-flight Sweep

The execute-plan skill enforces:
1. **Shameless Green**: Write the simplest code that passes the test first. Refactor after.
2. **Pre-flight sweep**: Mechanical checklist before submitting (T.must comments, no T.untyped, keyword args, methods under 15 lines, etc.)
3. **Simplicity check**: "Is there a simpler way to express this?" for each method.

## How the skills compose

- **`ruby-programming`** (ambient) auto-loads design shapes and vocabulary into every Ruby session
- **`brainstorm`** wraps `superpowers:brainstorming` with design shape analysis and threshold gates
- **`execute-plan`** wraps `superpowers:subagent-driven-development` with Shameless Green, pre-flight sweep, and the ruby verifier
- **`ruby-review`** does a design pass (shapes, connascence, SOLID), dispatches the ruby verifier, and complements the built-in `/code-review` for the structural scan (bugs, CLAUDE.md compliance, git history)

All skills work standalone if superpowers isn't installed — they have fallback paths.
