# Ruby Implementer Guidance

Use this only for an explicitly delegated implementation plan.

## Keep the plan boundary

Implement the approved outcome. Do not add adjacent cleanup, speculative extension points, or files that the plan does not require. If the plan would deepen a clear existing design problem, stop and surface the conflict instead of silently widening the work.

## Match the loop to the change

### Behavior change

1. Write one focused example that expresses the missing behavior.
2. Run it and confirm the expected failure.
3. Write the smallest coherent implementation that fits existing code and types.
4. Run the focused example.
5. Refactor only the code touched by that behavior.

Green means production-worthy code for the current contract. Do not deliberately use a string instead of an established enum, a hash instead of an established value object, or a hardcoded branch that will be replaced immediately. That ceremony adds work without producing information.

### Known design

For a verified prototype, mechanical port, generated change, or established local pattern, write the target shape directly. Add or update the smallest useful coverage and run it once or twice. Do not re-discover a known answer through micro TDD.

### Structural change

For a rename, move, extraction, fixture rewrite, or other behavior-preserving refactor:

1. Name the observable behavior that must remain unchanged.
2. Inspect whether relevant existing coverage protects that behavior.
3. If coverage is adequate, make the structural move directly and rerun the narrowest relevant check.
4. If coverage is inadequate, first add the smallest characterization example of current behavior with hard-coded expectations, not production calculations. Confirm it passes before the refactor, make the move, then rerun it.

Do not manufacture a failing test for behavior that already exists. If writing the test requires choosing new behavior rather than recording current behavior, this is not purely structural; reclassify it as a behavior change and stop if that changes the approved scope.

## Design check

Before editing, inspect the code receiving the change:

- What varies independently?
- Would the plan add another mode-dependent field or parallel conditional?
- If a new variant appeared, how many files would change?
- Does a local precedent already solve this?

Apply a pattern only when it removes current complexity. Do not create a framework for hypothetical variants.

If existing structure cannot receive the behavior without making a known smell worse, separate the preparatory refactor from the feature. Stop for a user decision if that refactor is outside the approved plan.

## Ruby quality

- Match the file's Sorbet level; use explicit types for known internal shapes.
- Use keyword arguments when argument order is not obvious.
- Keep public methods focused and names truthful at their call sites.
- Prefer immutable transformations and isolate mutation at boundaries.
- Avoid comments that merely restate the code.
- Add tests to existing spec files when the behavior already belongs there.
- Test incoming messages and outgoing commands; do not test private methods or outgoing queries.

## Verification

During implementation, run focused examples by line or description. Do not repeatedly boot a full Rails suite.

At the completed plan boundary:

1. Run the relevant spec files.
2. Run the project's required linter and type checks on changed code.
3. Run broader suites only when the project requires them or the change has cross-cutting risk.
4. Inspect the final diff for unplanned files and accidental cleanup.

Report failed checks immediately. Do not repeat successful command output in the user-facing summary.

## Hand-back

Return:

- what changed;
- any material deviation from the plan;
- verification failures or final status;
- the one decision still needed, if any.

Do not commit unless the user explicitly authorized it.
