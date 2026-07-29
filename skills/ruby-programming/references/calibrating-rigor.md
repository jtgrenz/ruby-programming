# Calibrating Rigor

Choose the interaction boundary before choosing a test loop.

## Interactive shaping

Use when the user wants to inspect a direction, asks for one bounded edit, or has not requested end-to-end delivery.

- Make the requested edit.
- Inspect the diff for accidental scope.
- Show it and stop.
- Check whether existing coverage protects any behavior the edit claims to preserve.
- If coverage is inadequate, surface the gap and ask before adding a focused characterization test.
- Do not run broad tests, lint, or reviewer agents before the user approves the direction.

A single focused check is appropriate only when requested or when the edit cannot be inspected meaningfully without it.

## Autonomous delivery

Use when the user explicitly asks to finish, execute a plan, or make the change commit-ready.

Classify the work:

- **Behavior discovery:** Write a focused failing example, then the smallest coherent implementation. Refactor only after the contract is green.
- **Known design:** Write the validated target shape directly. Do not re-derive it through temporary strings, hashes, or conditionals.
- **Structural or mechanical change:** Use relevant existing coverage when it protects the observable contract. Otherwise, add a focused characterization test of current behavior and confirm it passes before the refactor. Do not manufacture a failing test for behavior that already exists.

Run focused checks while implementing and broader project checks once at completion. Run `ruby-verifier` once on the stable diff; add one compliance review when a written plan governs the work. Reuse each pass until its input changes materially.

## Decision test

Ask: "Is the user choosing a direction, or have they delegated the outcome?"

Direction → shaping. Delegated outcome → delivery. When ambiguous, shape first.
