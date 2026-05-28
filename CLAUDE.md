# ruby-programming plugin

Claude Code plugin for Ruby design patterns, quality enforcement, and structured development workflows.

## Releasing a new version

Three files must be updated in the same commit:

1. **`package.json`** — `"version": "X.Y.Z"`
2. **`.claude-plugin/marketplace.json`** — `"version": "X.Y.Z"`
3. **Commit message** — prefix with `vX.Y.Z:`

Then:

1. Push to `main`
2. Create a GitHub release: `gh release create vX.Y.Z --repo jtgrenz/ruby-programming --title "vX.Y.Z" --notes "..."`
3. Verify: user runs `/plugin update ruby-programming` then `/reload-plugins`

All three version strings must match. The marketplace reads `marketplace.json` for version detection. `package.json` is the npm-convention source of truth. The commit message is for humans.

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
- `.claude-plugin/` — marketplace metadata
