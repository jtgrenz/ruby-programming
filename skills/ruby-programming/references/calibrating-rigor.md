# Calibrating TDD Rigor to Design Certainty

TDD rigor is not free and should not be uniform. The per-change Red→Green→Refactor→Simplify→Pre-flight build loop exists to *pull a design out of uncertainty*. When the design is already known, that per-change loop is ceremony — it burns tokens and wall-clock (cache reads, repeated spec boots) without buying quality. What does **not** vary by track: we always review the finished code against our best practices. Calibrate the *build loop* to design certainty; never calibrate away the review.

Decide the track per phase, before building.

## The two tracks

**Discovery** — the design is emerging at the keyboard. No validated reference implementation exists; you are finding the shape one failing test at a time.
- Inner loop: strict per-change Red → Green → Refactor → Simplify → Pre-flight, with Shameless Green — defer abstraction until examples accumulate, then refactor toward it.
- Gates: full ruby-verifier + compliance-reviewer after every phase, loop until both clean.
- This is where TDD earns its keep — the tests are doing design work, not transcription.

**Transcription** — the design is already validated. You are re-deriving a verified prototype, porting a known structure into the real codebase, or making a trivial/mechanical change. The answer is known before you start.
- Inner loop: write the target shape directly (no Shameless Green — the abstraction is already known), with a comprehensive spec; run it once or twice, fix failures. No per-change micro-loop.
- Gates: same as Discovery — ruby-verifier + compliance-reviewer after every phase, loop until clean. The prototype validated the design, not the port; ported code still has to clear our best-practices and compliance bar (the prototype was never compliance-reviewed). Transcription saves on the build loop, not the review.
- Per-change micro-TDD here is ceremony: the tests copy a known answer instead of discovering one. A full spec run catches transcription errors at the first green bar with equivalent safety — you pay one spec boot instead of N.

## How to classify

You are on the **Transcription** track when any of these hold:
- A verified reference prototype or spec already exists (e.g., "re-derive the verified prototype").
- The phase is a mechanical port, rename, extract, or move with no new design decisions.
- The change is small and the design is obvious.

You are on the **Discovery** track when the design is genuinely open: new abstraction, unclear seam, "we'll know the shape when we see it."

When unsure, default to Discovery — but say so, and drop to Transcription the moment the design stops being in question.

## Why this matters (the token mechanics)

The dominant cost in a long agentic run is cache reads — the model re-reads its accumulated context every turn. Every micro-step in the per-change loop is another turn (another full-context re-read) and often another Rails-booting spec run. Multiplying micro-TDD across a phase multiplies both.

Observed in a real overnight run that re-derived an already-verified prototype across five phases: ~173M tokens total, ~94% of them cache reads, with ~92 Rails-booting spec invocations. The ~92 spec boots were the waste — per-change micro-TDD re-deriving a known answer, one Rails boot at a time. The verifier+compliance gates ran clean each time, and that is fine: the review is cheap next to the build loop, and we keep it every phase regardless of track — that is how we know the port stayed compliant. Calibrate away the build ceremony, not the review.

## Autonomous (unattended) runs

The pair skill assumes a human reviews each phase. When a run is unattended (e.g., overnight), the gates are the *only* safety net — so run them after every phase regardless of track; no human is reading each diff, which is more reason to review per phase, not less. On an unattended run their value is as much honest disclosure (what wasn't wired, what wasn't run) as defect-catching; scope each review to surface those.
