# $${repo_name_pretty}

Skills repository for $${repo_name_pretty}.

## Development install

If you edit these skills, link them instead of copying them so Codex and Claude Code pick up changes immediately:

```bash
scripts/install-dev.sh            # link every skill in this repo
scripts/install-dev.sh $${name_kebab}   # link one skill
```

The script symlinks each skill into `~/.agents/skills` (read by Codex) and adds a relative link in `~/.claude/skills` (read by Claude Code). Re-run it after adding a skill. Set `AGENTS_SKILLS_DIR` or `CLAUDE_SKILLS_DIR` to use other directories.

## Install with `vercel-labs/skills`

Everyone else installs a copy with the skills.sh installer:

```bash
# List available skills
npx skills add $${author_github_name}/$${repo_name_kebab} --list

# Install the included skill
npx skills add $${author_github_name}/$${repo_name_kebab} --skill $${name_kebab}
```

Optional flags:

- `-g` to install globally
- `-a claude-code` (or other agent names) to target specific agents

## Included Skills

- `$${name_kebab}` - $${skill_description}
