# $${repo_name_pretty}

Skill repository for $${repo_name_pretty}, backed by a nested CLI package.

Maintainer: $${author_name} <$${author_email}>

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

## CLI

The nested CLI project lives in `cli/`.

```bash
cd cli
uv sync
uv run $${cli_command} --help
```

The skill should document when to use the CLI and which commands are safe for agents to run. If the CLI ships a skill installer, give it a `--dev` mode that runs `scripts/install-dev.sh` from this repo rather than copying files.
