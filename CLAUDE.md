# ruby-programming plugin

Claude Code and Codex plugin for Ruby design guidance and proportional development workflows.

## Releasing a new version

Four files must be updated in the same commit:

1. **`package.json`** — `"version": "X.Y.Z"`
2. **`.claude-plugin/marketplace.json`** — `"version": "X.Y.Z"`
3. **`.codex-plugin/plugin.json`** — `"version": "X.Y.Z"`
4. **Commit message** — prefix with `vX.Y.Z:`

Then:

1. Push to `main`
2. Create a GitHub release: `gh release create vX.Y.Z --repo jtgrenz/ruby-programming --title "vX.Y.Z" --notes "..."`
3. Verify Claude Code: run `/plugin update ruby-programming` then `/reload-plugins`
4. Verify Codex: run `codex plugin marketplace upgrade ruby-programming`, then `codex plugin add ruby-programming@ruby-programming`, then start a new thread

All three file versions must match. The Claude marketplace reads `marketplace.json`; Codex reads `plugin.json`; `package.json` is the npm-convention source of truth. The commit message is for humans.

## Versioning

- **Patch** (0.5.1 → 0.5.2): checklist tweaks, wording fixes, reference file updates
- **Minor** (0.5.x → 0.6.0): new skills, new quality loop steps, new reference files
- **Major**: breaking changes to skill structure or agent prompts

## Repo structure

- `skills/ruby-programming/` — main skill (SKILL.md, agents/, references/)
- `skills/execute-plan/` — implementer subagent prompt addendum
- `skills/pair/` — pair programming skill
- `skills/ruby-review/` — code review skill
- `skills/brainstorm/` — design brainstorming skill
- `.claude-plugin/` — Claude Code marketplace metadata
- `.codex-plugin/` — Codex plugin metadata

## Where evals live

Evals live at `skills/<name>/evals/evals.json`. `brainstorm` and `execute-plan` have no directory of their own — their cases sit in `skills/ruby-programming/evals/evals.json` (ids 5-6 cover brainstorm, ids 7-10 cover execute-plan) because they exercise the shared design references rather than anything skill-local. `ruby-review` has its own file for the two cases unique to it, and its `notes` field records where its shape coverage lives.
