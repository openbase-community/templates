# $${repo_name_pretty}

Skill repository for $${repo_name_pretty}, backed by a nested CLI package.

Maintainer: $${author_name} <$${author_email}>

## Install with `vercel-labs/skills`

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

The skill should document when to use the CLI and which commands are safe for agents to run.
