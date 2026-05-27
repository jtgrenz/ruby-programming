# ruby-programming

Ruby design pattern recognition, quality enforcement, and structured development workflows for Claude Code.

## Skills

| Skill | Invocation | Description |
|-------|-----------|-------------|
| `ruby-programming` | Ambient (auto-loads for Ruby) | Design shapes, vocabulary, quality checklist, code review mode |
| `brainstorm` | `/ruby-programming:brainstorm` | Design brainstorming with pattern analysis + superpowers integration |
| `execute-plan` | `/ruby-programming:execute-plan` | Plan execution with Ruby-specific implementer prompts and verifier |

## Installation

```bash
# From local directory
/install-plugin /path/to/ruby-programming
```

## What It Does

### Ambient Knowledge (ruby-programming)
- 12 design shape triggers with threshold gates (Strategy, Null Object, Value Object, Specification, etc.)
- Design vocabulary with Connascence framework for measuring coupling
- 7 rejected framings that prevent bad refactoring heuristics
- Quality checklist with design smell flags for the verifier agent
- Code Review Mode: design pass before syntax pass

### Brainstorm (invokeable)
- Loads design references before exploring approaches
- Enhances superpowers:brainstorming with shape analysis and pattern vocabulary
- Names patterns with rationale instead of generic "make it extensible" advice

### Execute Plan (invokeable)
- Wraps superpowers:subagent-driven-development with Ruby-specific guidance
- Implementer subagents follow Shameless Green + pre-flight sweep
- Runs ruby-verifier alongside superpowers code quality reviewer (parallel, not replacement)
