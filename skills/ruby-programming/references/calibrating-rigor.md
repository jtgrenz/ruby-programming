# Calibrating TDD Rigor to Design Certainty

Calibrate the *build loop* to how certain the design is — but never the review. The code is checked against our best practices (ruby-verifier + compliance) every phase, regardless of track.

**Discovery** — the design is emerging; no validated reference. Find the shape one failing test at a time: strict per-change Red→Green→Refactor→Simplify→Pre-flight, with Shameless Green (defer abstraction until examples accumulate).

**Transcription** — the answer is known before you start: re-deriving a verified prototype, a mechanical port, or a trivial change. Write the target shape directly (no Shameless Green), batch the build, one comprehensive spec, run it once or twice. A full spec run catches transcription errors with the same safety — one spec boot instead of N.

**Classify as Transcription** when a verified prototype or spec exists, the phase is a mechanical port/rename/move, or the change is small and obvious; **Discovery** when the design is genuinely open. When unsure, default to Discovery and drop to Transcription the moment the design stops being in question.

**Why it matters:** the dominant cost of a long run is cache reads — every micro-step is another full-context re-read, often another Rails boot. One overnight run re-deriving a verified prototype across five phases burned ~173M tokens (~94% cache reads, ~92 spec boots), almost all of it per-change micro-TDD re-deriving a known answer. The gates ran clean every pass — that review is cheap next to the build loop and is how you know the port stayed compliant. Calibrate away the build ceremony, not the review.

**Unattended runs** (overnight) lean on the gates as the only safety net, so per-phase review matters more, not less — and its value there is as much honest disclosure (what wasn't wired, what wasn't run) as defect-catching.
