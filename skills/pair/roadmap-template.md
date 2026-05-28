# Roadmap Template

Use this template to create the phased roadmap document. Scale it to the work — include only the sections that earn their place.

---

```markdown
# [Feature Name] Roadmap

Created: YYYY-MM-DD
Status: in-progress | complete

## Design Context

**Immediate deliverable:** [What we're shipping now — the Phase 1 output]

**Broader scope:** [The 3-month context from the WHY round. What's coming next, what systems this connects to, what variants are planned. If unknown, say so: "Future direction uncertain — optimizing for flexibility."]

## YAGNI Balance

What we build now vs. what we leave seams for.

- **Build now:** [Concrete features/behaviors shipping in this work]
- **Seams for later:** [Interfaces, stubs, or extension points placed for known future work. Each with a one-line rationale: "ParallelStrategy stub — proves the seam for Phase 3's parallel mode"]
- **Explicitly not building:** [Features discussed but deferred. Why, and what would change that decision]

## Phases

### Phase 1: [PR Title]
- **Status:** planned | in-progress | complete
- **PR:** [link, once created]
- **Deliverable:** [What this phase ships]
- **LOC budget:** <600 (excluding generated fixtures)
- **Design observations:** [High-level shape observations that informed the phasing — e.g., "looks like Shape 1, protocol vs. agency concerns suggest separate phases." Implementation details (specific classes, interfaces) belong in the per-phase plan, not here.]
- **Extension points:** [Stubs or seams placed for future phases]

### Phase 2: [PR Title]
[Same structure as Phase 1]

[Add more phases as needed]

## Design Decisions Log

> Include this section when the feature involves non-obvious tradeoffs, when multiple
> approaches were considered, or when decisions depend on assumptions that may change.
> Skip for straightforward work where the "why" is self-evident.

| Decision | Alternatives considered | Rationale | Revisit when |
|----------|------------------------|-----------|--------------|
| [What we decided] | [What we didn't do] | [Why this choice] | [Conditions that would change this] |

## Phase Completion Notes

> Updated after each phase completes. Captures what changed during implementation
> and how it affects future phases.

### Phase 1 — [date completed]
- **What changed from the plan:** [Anything that diverged from the original design]
- **Impact on future phases:** [Adjustments needed to Phase 2+]
- **New information:** [Things learned during implementation that affect the roadmap]
```

---

## Scaling Guidance

**Small features (1-3 phases, well-understood domain):**
- Design Context and Phases sections are sufficient
- YAGNI Balance can be a single sentence
- Skip Design Decisions Log unless a tradeoff was genuinely debated
- Skip Phase Completion Notes unless something changed

**Large features (4+ phases, uncertain future, multiple stakeholders):**
- All sections earn their place
- Design Decisions Log prevents re-litigating resolved decisions across sessions
- Phase Completion Notes maintain continuity as the roadmap evolves
- YAGNI Balance section is critical — it's the contract between "ship now" and "extend later"
