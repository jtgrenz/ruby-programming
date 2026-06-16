# Pufferfish SFTP Transmission Support Roadmap

Created: 2026-05-28
Status: in-progress
Note: Sample roadmap from pair skill eval (v3 — after two rounds of plan review).

## Design Context

**Immediate deliverable:** SFTP transmission protocol support in Pufferfish, then wire Ohio IT501 to use it.

**Broader scope:** Penguin is being deprecated — all forms migrating to Pufferfish. Pony is part of Penguin and is also deprecated. SFTP-transmitted forms (OH IT501, OH IT941, OH SD100, plus PA and VA) will all migrate. IT501 is first because it's simple and forces solving a new protocol problem.

## YAGNI Balance

- **Build now:** SFTP protocol support (wrapping net-sftp directly), Ohio-specific subclass, IT501 wiring with validated Penguin acker bridge, ack polling for Ohio, rollout plan
- **Seams for later:** Base class + subclass for PA/VA. Submission type methods overridable per-subclass. Per-agency ack parsing. Penguin acker carve-out scales to other forms.
- **Explicitly not building:** PA/VA SFTP clients, parallel transmission, multi-agency ack polling

## Phases

### Phase 1: SFTP Transmission Protocol Support in Pufferfish

- **Status:** planned
- **PR:** —
- **Deliverable:** Pufferfish can transmit filings over SFTP. No form-specific or agency-specific code.
- **LOC budget:** ~200-250
- **Design observations:** Protocol vs. agency separation — transport-level SFTP concerns (connection, upload, error mapping) belong in a base client, agency-specific details belong in subclasses.
- **Extension points:** Subclasses provide credentials, remote path, and response parsing.

**Components (build vs. reuse vs. replace):**

- **SFTP base client** (new) — Inherits from BaseClient. Wraps net-sftp directly, not Pony. Owns its own connection lifecycle. Subclasses provide credentials, remote path, and response parsing.
- **SFTP submission response** (new) — `communicated_successfully: true` means file landed. `accepted?: false` because the agency hasn't responded yet. Downstream code should not treat upload as completed filing.
- **Error handling** (new) — Maps net-sftp / net-ssh exceptions to existing error hierarchy.
- **OperationResult ResponseObjectTypes** (existing, needs modification) — Add SFTP response type.

**Explicitly deferred:** No Ohio-specific code, no form wiring, no ack polling, no orchestrator changes.

### Phase 2: Wire Ohio IT501 Through Pufferfish SFTP Transmission

- **Status:** planned
- **PR:** —
- **Deliverable:** Ohio IT501 transmits end-to-end through Pufferfish via SFTP, with validated compatibility with the existing Penguin ack pipeline.
- **LOC budget:** ~300-450
- **Design observations:** This phase proves the protocol works with a real form through existing workflow machinery, while maintaining the Penguin acker as a safety net.

**Components (build vs. reuse vs. replace):**

- **Ohio ODT SFTP client** (new) — Subclass of Phase 1 SFTP client. Provides Ohio's host, credentials, and remote file path naming convention.
- **Config key namespace** (new / existing config, needs migration) — Existing credentials live under `pony.ohio_sftp.*` keys. Must be re-keyed under `pufferfish.ohio_sftp.*` or similar. No runtime dependency on Pony's config namespace.
- **IT501 transmission configuration** (existing, needs modification) — Register the Ohio SFTP client in `tax_agency_metadata.rb`.
- **SFTP activity type** (existing, needs modification) — New `CreateSftpTransmission` enum value. `SOAP_SYSTEM_ACTIVITIES` naming resolved here.
- **Operations::CreateTransmission** (existing, needs modification) — Handle SFTP response pattern (`communicated_successfully: true` + `accepted?: false`).
- **AutomaticWorkflowTransmitter** (existing, needs assessment) — Decision point for serial vs parallel routing.

**Penguin acker compatibility validation (acceptance criteria, not optional):**

The Penguin `Ackers::OhioSftp` matches ack files using a filename regex. During transition, it's the ONLY thing processing IT501 acks. If file naming diverges, acks silently stop matching. Phase 2 must include:
- A spec asserting Pufferfish-generated filenames match the Penguin `ACK_FILENAME_REGEX`
- A spec asserting Penguin acker can resolve Ohio ack files to Pufferfish-originated `AgentFilingTransmission` records

**Rollout plan:**

- **What the flag gates:** All-or-nothing for IT501. Switches whether IT501 filing groups use SFTP TransmissionConfiguration or continue through Penguin. Per-company gating adds complexity without value — risk is at the protocol level.
- **Validation before expanding:**
  1. Enable in staging. Transmit test filings. Verify files land on Ohio's staging SFTP server with correct naming.
  2. Verify Penguin acker picks up ack files for Pufferfish-originated transmissions in staging.
  3. Enable in production for one filing cycle. Monitor: upload success, Penguin acker matches acks, filing statuses progress.
  4. Run 2-3 consecutive filing cycles with successful acks before starting Phase 3.
- **Rollback:** Disable feature flag. Next cycle, IT501 reverts to Penguin. In-flight Pufferfish-originated filings still get acked by Penguin (validated by compatibility specs).
- **"Safe to cut over" criteria:** 3 consecutive filing cycles where Pufferfish-transmitted IT501 filings are successfully acked through the Penguin acker bridge.

**Explicitly deferred:** No ack polling in Pufferfish. Penguin acker handles acks for both Penguin- and Pufferfish-originated transmissions during transition.

### Phase 3: SFTP Ack Polling and Penguin IT501 Retirement

- **Status:** planned
- **PR:** —
- **Deliverable:** Pufferfish polls for and processes IT501 SFTP ack files. Penguin IT501 jobs can be fully retired.
- **LOC budget:** ~400-500
- **Design observations:** Ack polling is the hardest design problem — async file-based acks vs. synchronous `ack_filing` interface. Also requires dual-run deconfliction.

**Components (build vs. reuse vs. replace):**

- **Ack implementation** (new) — Implements `ack_filing` on Ohio ODT subclass. Connect, list files, find matching acks, download and parse. Reimplements Penguin acker domain logic (Ack1 + Ack2) for Pufferfish model.
- **Ack response objects** (new) — Where `accepted?` returns true/false based on actual agency response.
- **GetAcks system activity** (existing, needs assessment) — May work as-is or need SFTP variant.
- **Remote file cleanup** — Delete ack files after processing.

**Dual-run deconfliction (required before implementation):**

When Phase 3 ships, both systems could process IT501 ack files. Decision: **Penguin stops processing IT501 acks when Phase 3 is enabled.**
- Phase 3 gets its own feature flag (separate from Phase 2's transmission flag)
- When enabled, Penguin `Ackers::OhioSftp` skips IT501 transmissions
- Penguin acker continues handling other Ohio SFTP forms (IT941, SD101, etc.)
- Avoids both systems racing to download and delete the same ack files
- Rollback: disable Phase 3 flag, Penguin resumes IT501 ack processing

**Penguin IT501 retirement checklist (after Phase 3 is stable):**

1. Remove `RecurringIt501Job` from Sidekiq schedule
2. Remove IT501 from `OhioSftpStatusChecker::OHIO_FORM_NAMES`
3. Remove IT501 code paths from `OhioSftpTransmitter` and `OhioSftpFileUploader`
4. Clean up Phase 2 and Phase 3 feature flags

## Seams for Future SFTP Forms

- **Protocol vs. agency** — Base SFTP client handles net-sftp. New state = new subclass + config entry.
- **Submission types** — `submit_annual_rec_filing` / `submit_zero_filing` overridable per-subclass.
- **Ack format variance** — Per-agency ack parsing in subclasses.
- **Penguin acker carve-out** — The Phase 3 pattern (Penguin skips migrated forms) scales to each form migration until the acker can be fully retired.
- **Config namespace** — New forms use `pufferfish.*` keys from the start, not `pony.*`.

## Design Decisions Log

| Decision | Alternatives considered | Rationale | Revisit when |
|----------|------------------------|-----------|--------------|
| Wrap net-sftp directly | Wrap Pony::Sftp::Client | Pony is deprecated. New dependency would compound across every future SFTP form. | n/a |
| `accepted?: false` on upload | `accepted?: true` | Upload is delivery, not acceptance. Prevents treating upload as completed filing. | Phase 2 if CreateTransmission has hard failure paths on accepted?: false |
| Re-key credentials under pufferfish.* | Reuse pony.* keys | Runtime dependency on deprecated config namespace would break when Pony is cleaned up. | n/a |
| All-or-nothing feature flag (not per-company) | Per-company rollout | Risk is protocol-level, not company-level. Per-company adds complexity without value. | If a future form migration has company-specific risk |
| Penguin stops IT501 acks when Phase 3 enabled | Both systems process acks | Avoids race condition on ack file download/deletion. Clean ownership boundary. | n/a |
| 3 filing cycles before Phase 3 | Fewer/more cycles | Enough to catch intermittent issues without unnecessary delay. | If filing frequency is very low (adjust count) |
