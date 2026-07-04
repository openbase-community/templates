---
name: $${name_kebab}
description: >-
  Use this skill when users ask about $${skill_trigger_summary}.
version: 0.1.0
---

# $${name_pretty}

$${skill_description}

This skill is backed by a nested CLI project in `cli/`.

## When To Use

Use this skill when:

- the user is working on $${skill_trigger_summary}
- the task needs repo-specific guidance, commands, or conventions
- the workflow should call the bundled CLI instead of re-implementing logic in the agent prompt

## Workflow

1. Inspect the relevant files and current project state before making assumptions.
2. Prefer the nested CLI in `cli/` for repeatable operations.
3. Run CLI commands from the repository root or from `cli/`, matching the command documentation.
4. Keep edits focused on the user task and avoid broad unrelated changes.

## CLI

The CLI package lives in `cli/`.

```bash
cd cli
uv sync
uv run $${cli_command} --help
```

Add command-specific examples here as the CLI grows.

## Notes

- Keep the skill instructions and CLI behavior aligned.
- Add constraints, safety rules, and gotchas here.
