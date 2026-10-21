# Calibrating Rigor

Choose the interaction boundary before choosing a test loop. The same code change deserves different ceremony when the user is still choosing its shape than when they have delegated delivery.

## Interactive shaping

Use when the user wants to inspect a direction, asks for one bounded edit, or has not requested end-to-end delivery.

- Make the requested edit.
- Inspect the diff for accidental scope.
- Show it and stop.
- Check whether existing coverage protects any behavior the edit claims to preserve.
- If coverage is inadequate, surface the gap and ask before adding a focused characterization test.
- Treat the handoff as a proposal, not a completion claim; do not invoke a general TDD or completion workflow merely to show it.
- Do not run broad tests, lint, or reviewer agents before explicit finalization.

A single focused check is appropriate only when requested or when its result could materially change the user's current decision.

## Requested validation

When the user asks for a named spec, linter, type check, or other focused proof, run exactly that scope and show the result. A validation request does not delegate neighboring implementation or open the full completion gate.

## Completion of a shaped diff

Use when the user explicitly asks to finalize, commit, or make the current approved diff commit-ready.

- Run relevant tests and the project's required lint and type checks on the changed scope.
- Inspect the complete diff.
- Run `ruby-verifier` only for a substantial or cross-cutting Ruby change.
- Add one compliance review when a written plan governs the work.

If finalization finds changed behavior that current coverage does not protect, add the smallest useful behavior coverage and prove it now. Existing relevant coverage only needs to be rerun. Do not restart approved work merely to manufacture a historical Red step.

## Autonomous delivery

Use when the user delegates remaining implementation for an unimplemented or partially implemented outcome end to end: implement the agreed scope, fix it completely, execute the plan, or take the scope through commit-ready verification. Finishing an already-shaped diff is completion, not autonomous delivery.

Classify the work:

- **Behavior discovery:** Use an existing focused example when it already expresses the missing contract; otherwise write one. Confirm the expected failure, then write the smallest coherent implementation. Refactor only after the contract is green.
- **Known design:** Write the validated target shape directly. Do not re-derive it through temporary strings, hashes, or conditionals.
- **Structural or mechanical change:** Use relevant existing coverage when it protects the observable contract. Otherwise, add a focused characterization test of current behavior and confirm it passes before the refactor. Do not manufacture a failing test for behavior that already exists.

Input combinations do not earn separate examples unless they protect a distinct production decision, boundary, or failure. Put coverage at the owning layer; do not duplicate matrices across layers or pull adjacent backlog gaps into scope.

Run focused checks while implementing and relevant project checks once at completion. Run broader suites only when project policy or cross-cutting risk requires them. Run `ruby-verifier` once for a substantial or cross-cutting stable diff; add one compliance review when a written plan governs the work. Reuse each pass until its input changes materially.

## Decision test

Ask: "Is the user choosing a direction, requesting one proof, finalizing an approved diff, or delegating the outcome?"

Direction → shaping. One proof → requested validation. Approved diff → completion. Delegated outcome → autonomous delivery. When ambiguous, shape first.
