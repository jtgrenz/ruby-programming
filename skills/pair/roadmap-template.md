# Roadmap and Pair Plan Template

Use this template for a phased roadmap or a detailed per-phase pair plan. Preserve the human scan path in both forms, then include only the agent-resume detail that earns its place.

---

```markdown
# [Feature Name] Roadmap | [Phase Name] Pair Plan

Created: YYYY-MM-DD
Status: in-progress | complete
Document type: roadmap | pair plan

> **TL;DR:** [One or two sentences: what ships now, the highest-risk constraint,
> and the next decision or gate.]

## At a Glance

> **TL;DR — At a Glance:** [One sentence naming the delivery sequence and next gate.]
>
> Keep this as a compact index of **every phase, task, PR, and named subsection**
> below, including collapsed resume sections. Update it whenever the document changes.

| Item | Outcome / decision | Status or gate |
|------|--------------------|----------------|
| Design context | [Immediate deliverable and broader direction] | [Known / open] |
| YAGNI balance | [Build now vs. defer] | [Decision] |
| Migration safety | [Validation, ownership, rollback, and cutover] | [Gate; omit for greenfield work] |
| Phases / tasks | [How the work units reach the deliverable] | [Overall status] |
| Phase 1 | [Phase outcome] | planned |
| Phase 1 / PR | [PR outcome] | not created |
| Phase 1 / Task 1 | [Task outcome] | planned |
| Agent resume detail | [What a future agent can resume] | [Current handoff state] |
| [Each remaining named subsection] | [One short outcome or decision] | [Status, owner, or gate] |

## Design Context

> **TL;DR — Design Context:** [One sentence connecting the immediate deliverable to the broader direction.]

**Immediate deliverable:** [What we're shipping now — the Phase 1 output]

**Broader scope:** [The 3-month context from the WHY round. What's coming next, what systems this connects to, what variants are planned. If unknown, say so: "Future direction uncertain — optimizing for flexibility."]

## YAGNI Balance

> **TL;DR — YAGNI Balance:** [One sentence naming what is built now and the most important deferral.]

- **Build now:** [Concrete features/behaviors shipping in this work]
- **Seams for later:** [Interfaces, stubs, or extension points placed for known future work. Each with a one-line rationale: "ParallelStrategy stub — proves the seam for Phase 3's parallel mode"]
- **Explicitly not building:** [Features discussed but deferred. Why, and what would change that decision]

## Migration Safety

> **TL;DR — Migration Safety:** [For a production replacement, state how the old
> and new paths coexist, who owns each side effect, and the evidence required to cut over. Omit this section for greenfield work.]

- **Validation:** [How old and new outcomes are compared]
- **Rollout:** [Cohort, flag, owner, and monitoring sequence]
- **Ownership:** [Which system owns writes, acknowledgements, or other side effects at each phase]
- **Rollback:** [Exact reversible action and treatment of in-flight work]
- **Safe to cut over when:** [Observable evidence threshold]

## Phases

> **TL;DR — Phases:** [One sentence describing the ordered delivery path and its governing gate.]

### Phase 1: [PR Title]

> **TL;DR — Phase 1:** [What becomes true after this phase; name its key risk or
> dependency in the same one or two sentences.]

- **Status:** planned | in-progress | complete
- **PR:** [title and link, once created]

> **TL;DR — PR:** [What this PR changes and the review/rollout gate. If the phase
> is one PR, repeat the phase outcome here with the PR-specific risk.]

- **Deliverable:** [What this phase ships]
- **LOC budget:** <600 (excluding generated fixtures)
- **Design observations:** [High-level shape observations that informed the phasing — e.g., "looks like Shape 1, protocol vs. agency concerns suggest separate phases." Implementation details (specific classes, interfaces) belong in the per-phase plan, not here.]
- **Extension points:** [Stubs or seams placed for future phases]

#### Task 1: [Task name]

> **TL;DR — Task 1:** [The smallest independently reviewable outcome and its
> acceptance or safety gate.]

- **Does:** [Concrete behavior or artifact]
- **Depends on:** [Earlier task / external prerequisite]
- **Done when:** [Observable acceptance criterion]

[Add only the task sections that help a human follow the phase. Each task needs a
TL;DR and a row in At a Glance.]

### Phase 2: [PR Title]
[Same structure as Phase 1]

[Add more phases as needed]

## Design Decisions Log

> **TL;DR — Design Decisions:** [The choice most likely to matter when this plan resumes.]
>
> Include this section only for non-obvious tradeoffs or assumptions that may change.

| Decision | Alternatives considered | Rationale | Revisit when |
|----------|------------------------|-----------|--------------|
| [What we decided] | [What we didn't do] | [Why this choice] | [Conditions that would change this] |

## Phase Completion Notes

> **TL;DR — Phase Completion Notes:** [What changed during implementation and its effect on the next phase.]

### Phase 1 — [date completed]
- **What changed from the plan:** [Anything that diverged from the original design]
- **Impact on future phases:** [Adjustments needed to Phase 2+]
- **New information:** [Things learned during implementation that affect the roadmap]

<details>
<summary><strong>TL;DR — Agent resume detail:</strong> [What a future agent must inspect or decide before continuing.]</summary>

- **Live state:** [Current worktree, branch, or artifact state]
- **Inspect first:** [Exact paths and entry points]
- **Next bounded move:** [One concrete continuation]
- **Open assumptions:** [Anything that must be revalidated]

</details>
```

---

## Readability Rules

- Start every roadmap with the highlighted document TL;DR and At a Glance table.
- Give every named section, phase, task, and PR its own highlighted local TL;DR,
  even when a phase maps one-to-one to one PR. A descriptive `<summary>` is the
  local TL;DR for collapsed content.
- Include every named subsection below At a Glance with a short outcome, decision,
  or gate; readers should not need to hunt through prose to find it.
- Keep any prose section to at most two short paragraphs. Prefer bullets, tables,
  checklists, and decision logs for the detail.
- Put agent-resume detail (exact paths, commands, assumptions, handoff state) in a
  clearly labeled `<details>` block when it would interrupt the human scan path.

For a roadmap, phases and PRs are the primary work units. For a per-phase pair plan,
tasks are the primary work units; replace the Phases section with Tasks, but keep the
same document TL;DR, At a Glance index, and per-task TL;DR contract.

## Scaling Guidance

**Small features (1-3 phases, well-understood domain):**
- After the mandatory document TL;DR and At a Glance, Design Context and Phases are the only required body sections
- YAGNI Balance can be a single sentence
- Migration Safety is still required when replacing a live production path
- Skip Design Decisions Log unless a tradeoff was genuinely debated
- Skip Phase Completion Notes unless something changed

**Large features (4+ phases, uncertain future, multiple stakeholders):**
- All sections earn their place
- Design Decisions Log prevents re-litigating resolved decisions across sessions
- Phase Completion Notes maintain continuity as the roadmap evolves
- YAGNI Balance section is critical — it's the contract between "ship now" and "extend later"
