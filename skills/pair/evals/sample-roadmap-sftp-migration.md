# Pufferfish SFTP Transmission Support Roadmap

Created: 2026-05-28
Status: in-progress
Document type: roadmap
Note: Sample roadmap from pair skill eval (v5 — local section summaries plus collapsed resume detail).

> **TL;DR:** Build and prove Pufferfish SFTP with Ohio IT501 while Penguin remains
> the ack safety net; only retire that bridge after three successful filing cycles.

## At a Glance

> **TL;DR — At a Glance:** Three gated PRs add transport, prove one form with legacy
> ack ownership, then transfer that ownership and retire the old path.

| Item | Outcome / decision | Status or gate |
|------|--------------------|----------------|
| Design Context | IT501 proves Pufferfish SFTP before the remaining SFTP forms migrate. | Penguin and Pony are deprecated |
| YAGNI Balance | Build Ohio transmission and ack bridge now; defer other agencies and parallelism. | Deliberate scope boundary |
| Migration Safety | Penguin owns acks until Pufferfish proves delivery and then takes exclusive ownership. | Flag rollback; three-cycle cutover gate |
| Phases | Three PRs establish transport, bridge IT501 acks, then retire Penguin IT501. | Ordered by safety gate |
| Phase 1 | Reusable Pufferfish SFTP transport, without agency wiring. | Planned |
| Phase 1 / PR | Add transport and response semantics. | No form-specific code |
| Phase 1 / Components | Base client, response, errors, and response enum. | Subclasses own agency details |
| Phase 1 / Deferred | Ohio wiring and acks wait for Phase 2. | Prevents premature coupling |
| Phase 2 | Send IT501 through Pufferfish while Penguin still acks it. | Planned |
| Phase 2 / PR | Ohio client, config migration, transmission wiring, and flag. | Ack compatibility specs required |
| Phase 2 / Components | Ohio client plus existing workflow changes. | No Pony config dependency |
| Phase 2 / Ack validation | Pufferfish names and records work with Penguin acker. | Required acceptance criteria |
| Phase 2 / Rollout | Staging, then three successful production cycles. | Flag rollback available |
| Phase 2 / Deferred | Pufferfish ack polling waits for Phase 3. | Penguin owns acks |
| Phase 3 | Pufferfish owns IT501 ack polling; Penguin IT501 path retires. | Planned after Phase 2 gate |
| Phase 3 / PR | Add polling, parse acks, and isolate ownership. | Separate ack flag |
| Phase 3 / Components | Ack implementation, response, activity assessment, cleanup. | Agency result drives acceptance |
| Phase 3 / Deconfliction | Penguin skips IT501 when Pufferfish ack flag is on. | Prevents download/delete race |
| Phase 3 / Retirement | Remove jobs, status checks, legacy paths, and flags. | Only after stability |
| Future seams | Subclassing, per-agency parsing, and acker carve-out scale migration. | New config uses pufferfish.* |
| Decisions log | Preserve explicit choices and revisit triggers. | Update when assumptions change |

## Design Context

> **TL;DR — Design Context:** IT501 is the first real SFTP proof inside the broader
> move from deprecated Penguin and Pony paths into Pufferfish.

**Immediate deliverable:** SFTP transmission protocol support in Pufferfish, then wire Ohio IT501 to use it.

**Broader scope:** Penguin is being deprecated — all forms migrating to Pufferfish. Pony is part of Penguin and is also deprecated. SFTP-transmitted forms (OH IT501, OH IT941, OH SD100, plus PA and VA) will all migrate. IT501 is first because it's simple and forces solving a new protocol problem.

## YAGNI Balance

> **TL;DR — YAGNI Balance:** Build only the shared transport, Ohio proof, ack bridge,
> and safe rollout now; defer other agencies and parallel transmission.

- **Build now:** SFTP protocol support (wrapping net-sftp directly), Ohio-specific subclass, IT501 wiring with validated Penguin acker bridge, ack polling for Ohio, rollout plan
- **Seams for later:** Base class + subclass for PA/VA. Submission type methods overridable per-subclass. Per-agency ack parsing. Penguin acker carve-out scales to other forms.
- **Explicitly not building:** PA/VA SFTP clients, parallel transmission, multi-agency ack polling

## Migration Safety

> **TL;DR — Migration Safety:** Pufferfish takes transmission ownership first while
> Penguin remains the sole ack owner. Pufferfish takes ack ownership only after three
> successful cycles prove the bridge, with separate flags preserving rollback.

- **Validation:** Prove Pufferfish filename compatibility and Penguin resolution of Pufferfish-originated transmissions in specs and staging.
- **Rollout:** Enable IT501 transmission in staging, then production; monitor delivery and ack progression for three consecutive cycles before Phase 3.
- **Ownership:** Pufferfish owns flagged sends in Phase 2; Penguin alone owns IT501 acks until the Phase 3 flag transfers that responsibility exclusively.
- **Rollback:** Disable the relevant phase flag. Penguin resumes sends or acks, while its validated bridge continues handling in-flight Pufferfish transmissions.
- **Safe to cut over when:** Three consecutive filing cycles complete with Pufferfish sends successfully acknowledged through the Penguin bridge.

## Phases

> **TL;DR — Phases:** Establish transport first, prove sending while Penguin owns
> acks second, then transfer ack ownership only after the three-cycle gate.

### Phase 1: SFTP Transmission Protocol Support in Pufferfish

> **TL;DR — Phase 1:** Add a reusable Pufferfish SFTP transport, with no Ohio or
> form behavior, so Phase 2 can prove it against a real filing.

- **Status:** planned
- **PR:** —

> **TL;DR — PR:** The future Phase 1 PR is transport-only: it establishes delivery
> semantics without claiming agency acceptance or changing any form routing.

- **Deliverable:** Pufferfish can transmit filings over SFTP. No form-specific or agency-specific code.
- **LOC budget:** ~200-250
- **Design observations:** Protocol vs. agency separation — transport-level SFTP concerns (connection, upload, error mapping) belong in a base client, agency-specific details belong in subclasses.
- **Extension points:** Subclasses provide credentials, remote path, and response parsing.

#### Components

<details>
<summary><strong>TL;DR — Phase 1 / Components:</strong> Add four protocol-level surfaces while leaving agency behavior to later subclasses.</summary>

- **SFTP base client** (new) — Inherits from BaseClient. Wraps net-sftp directly, not Pony. Owns its own connection lifecycle. Subclasses provide credentials, remote path, and response parsing.
- **SFTP submission response** (new) — `communicated_successfully: true` means file landed. `accepted?: false` because the agency hasn't responded yet. Downstream code should not treat upload as completed filing.
- **Error handling** (new) — Maps net-sftp / net-ssh exceptions to existing error hierarchy.
- **OperationResult ResponseObjectTypes** (existing, needs modification) — Add SFTP response type.

</details>

#### Deferred

> **TL;DR — Phase 1 / Deferred:** No Ohio-specific code, form wiring, ack polling,
> or orchestrator changes belong in the transport PR.

### Phase 2: Wire Ohio IT501 Through Pufferfish SFTP Transmission

> **TL;DR — Phase 2:** Route IT501 through Pufferfish SFTP behind one flag, while
> Penguin remains the only ack processor until naming and record compatibility hold.

- **Status:** planned
- **PR:** —

> **TL;DR — PR:** The future Phase 2 PR wires Ohio, migrates config ownership, and
> proves the Penguin ack bridge before any production expansion.

- **Deliverable:** Ohio IT501 transmits end-to-end through Pufferfish via SFTP, with validated compatibility with the existing Penguin ack pipeline.
- **LOC budget:** ~300-450
- **Design observations:** This phase proves the protocol works with a real form through existing workflow machinery, while maintaining the Penguin acker as a safety net.

#### Components

<details>
<summary><strong>TL;DR — Phase 2 / Components:</strong> Add the Ohio sender and minimal workflow wiring; keep configuration independent from Pony and leave ack ownership in Penguin.</summary>

- **Ohio ODT SFTP client** (new) — Subclass of Phase 1 SFTP client. Provides Ohio's host, credentials, and remote file path naming convention.
- **Config key namespace** (new / existing config, needs migration) — Existing credentials live under `pony.ohio_sftp.*` keys. Must be re-keyed under `pufferfish.ohio_sftp.*` or similar. No runtime dependency on Pony's config namespace.
- **IT501 transmission configuration** (existing, needs modification) — Register the Ohio SFTP client in `tax_agency_metadata.rb`.
- **SFTP activity type** (existing, needs modification) — New `CreateSftpTransmission` enum value. `SOAP_SYSTEM_ACTIVITIES` naming resolved here.
- **Operations::CreateTransmission** (existing, needs modification) — Handle SFTP response pattern (`communicated_successfully: true` + `accepted?: false`).
- **AutomaticWorkflowTransmitter** (existing, needs assessment) — Decision point for serial vs parallel routing.

</details>

#### Ack Compatibility Validation

> **TL;DR — Phase 2 / Ack validation:** Prove filenames and transmission records
> remain resolvable by the sole Penguin ack owner before production rollout.

The Penguin `Ackers::OhioSftp` matches ack files using a filename regex. During transition, it's the ONLY thing processing IT501 acks. If file naming diverges, acks silently stop matching. Phase 2 must include:
- A spec asserting Pufferfish-generated filenames match the Penguin `ACK_FILENAME_REGEX`
- A spec asserting Penguin acker can resolve Ohio ack files to Pufferfish-originated `AgentFilingTransmission` records

#### Rollout

> **TL;DR — Phase 2 / Rollout:** Gate all IT501 traffic, prove staging first, then
> require exactly three clean production cycles before Phase 3.

- **What the flag gates:** All-or-nothing for IT501. Switches whether IT501 filing groups use SFTP TransmissionConfiguration or continue through Penguin. Per-company gating adds complexity without value — risk is at the protocol level.
- **Validation before expanding:**
  1. Enable in staging. Transmit test filings. Verify files land on Ohio's staging SFTP server with correct naming.
  2. Verify Penguin acker picks up ack files for Pufferfish-originated transmissions in staging.
  3. Enable in production for the first of three required filing cycles. Monitor: upload success, Penguin acker matches acks, filing statuses progress.
  4. Continue until 3 consecutive production cycles have successful acks before starting Phase 3.
- **Rollback:** Disable feature flag. Next cycle, IT501 reverts to Penguin. In-flight Pufferfish-originated filings still get acked by Penguin (validated by compatibility specs).
- **"Safe to cut over" criteria:** 3 consecutive filing cycles where Pufferfish-transmitted IT501 filings are successfully acked through the Penguin acker bridge.

#### Deferred

> **TL;DR — Phase 2 / Deferred:** Pufferfish does not poll acks yet; Penguin remains
> the sole ack owner for both legacy- and Pufferfish-originated transmissions.

### Phase 3: SFTP Ack Polling and Penguin IT501 Retirement

> **TL;DR — Phase 3:** Move IT501 ack ownership to Pufferfish only after Phase 2's
> three-cycle gate, then retire the corresponding Penguin paths without dual reads.

- **Status:** planned
- **PR:** —

> **TL;DR — PR:** The future Phase 3 PR adds ack polling behind a separate flag and
> makes Penguin skip IT501, preventing concurrent download and deletion.

- **Deliverable:** Pufferfish polls for and processes IT501 SFTP ack files. Penguin IT501 jobs can be fully retired.
- **LOC budget:** ~400-500
- **Design observations:** Ack polling is the hardest design problem — async file-based acks vs. synchronous `ack_filing` interface. Also requires dual-run deconfliction.

#### Components

<details>
<summary><strong>TL;DR — Phase 3 / Components:</strong> Add Pufferfish ack processing and the minimum activity/cleanup support needed to own the complete IT501 lifecycle.</summary>

- **Ack implementation** (new) — Implements `ack_filing` on Ohio ODT subclass. Connect, list files, find matching acks, download and parse. Reimplements Penguin acker domain logic (Ack1 + Ack2) for Pufferfish model.
- **Ack response objects** (new) — Where `accepted?` returns true/false based on actual agency response.
- **GetAcks system activity** (existing, needs assessment) — May work as-is or need SFTP variant.
- **Remote file cleanup** — Delete ack files after processing.

</details>

#### Dual-run Deconfliction

> **TL;DR — Phase 3 / Deconfliction:** A separate ack flag gives exactly one system
> ownership; Penguin skips IT501 whenever Pufferfish polling is active.

When Phase 3 ships, both systems could process IT501 ack files. Decision: **Penguin stops processing IT501 acks when Phase 3 is enabled.**
- Phase 3 gets its own feature flag (separate from Phase 2's transmission flag)
- When enabled, Penguin `Ackers::OhioSftp` skips IT501 transmissions
- Penguin acker continues handling other Ohio SFTP forms (IT941, SD101, etc.)
- Avoids both systems racing to download and delete the same ack files
- Rollback: disable Phase 3 flag, Penguin resumes IT501 ack processing

#### Retirement

<details>
<summary><strong>TL;DR — Phase 3 / Retirement:</strong> Remove the four legacy scheduling, status, transmission, and flag surfaces only after Pufferfish ack ownership is stable.</summary>

1. Remove `RecurringIt501Job` from Sidekiq schedule
2. Remove IT501 from `OhioSftpStatusChecker::OHIO_FORM_NAMES`
3. Remove IT501 code paths from `OhioSftpTransmitter` and `OhioSftpFileUploader`
4. Clean up Phase 2 and Phase 3 feature flags

</details>

## Seams for Future SFTP Forms

> **TL;DR — Future seams:** Reuse only the protocol/agency split, overridable
> submission methods, per-agency ack parsing, and form-by-form Penguin carve-out.

- **Protocol vs. agency** — Base SFTP client handles net-sftp. New state = new subclass + config entry.
- **Submission types** — `submit_annual_rec_filing` / `submit_zero_filing` overridable per-subclass.
- **Ack format variance** — Per-agency ack parsing in subclasses.
- **Penguin acker carve-out** — The Phase 3 pattern (Penguin skips migrated forms) scales to each form migration until the acker can be fully retired.
- **Config namespace** — New forms use `pufferfish.*` keys from the start, not `pony.*`.

## Design Decisions Log

> **TL;DR — Design Decisions:** The roadmap favors Pufferfish-owned configuration,
> single ack ownership, and a three-cycle evidence gate over transitional shortcuts.

| Decision | Alternatives considered | Rationale | Revisit when |
|----------|------------------------|-----------|--------------|
| Wrap net-sftp directly | Wrap Pony::Sftp::Client | Pony is deprecated. New dependency would compound across every future SFTP form. | n/a |
| `accepted?: false` on upload | `accepted?: true` | Upload is delivery, not acceptance. Prevents treating upload as completed filing. | Phase 2 if CreateTransmission has hard failure paths on accepted?: false |
| Re-key credentials under pufferfish.* | Reuse pony.* keys | Runtime dependency on deprecated config namespace would break when Pony is cleaned up. | n/a |
| All-or-nothing feature flag (not per-company) | Per-company rollout | Risk is protocol-level, not company-level. Per-company adds complexity without value. | If a future form migration has company-specific risk |
| Penguin stops IT501 acks when Phase 3 enabled | Both systems process acks | Avoids race condition on ack file download/deletion. Clean ownership boundary. | n/a |
| 3 filing cycles before Phase 3 | Fewer/more cycles | Enough to catch intermittent issues without unnecessary delay. | If filing frequency is very low (adjust count) |
