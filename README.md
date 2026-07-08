# Openbase Community BoilerSync Templates

Reusable BoilerSync templates for Openbase projects, apps, packages, skills,
and developer tools.

## Usage

Initialize a project from one of these templates:

```bash
boilersync init openbase-community/templates#react-app
```

For unattended scaffolding, inspect required variables first and pass values
explicitly:

```bash
boilersync templates details openbase-community/templates#react-app --json
boilersync init openbase-community/templates#react-app --non-interactive --var name_snake=my_app
```

After a project is initialized, use `boilersync pull` to receive template
updates and `boilersync push` to promote intentional project changes back into
the source template.

## Templates

- `app-package`: Python app package scaffold.
- `cli`: Python CLI package, extending `pip-package`.
- `cli-with-db`: CLI scaffold with database support.
- `django-app`: Django app scaffold intended for use inside a parent package.
- `django-react-workspace`: Full Django API plus React web workspace.
- `electron-app`: Electron desktop app scaffold.
- `ios-tuist-app`: iOS app scaffold using Tuist.
- `langchain-agent`: LangChain agent package, extending `pip-package`.
- `mcp-server`: Standalone MCP server scaffold.
- `nextjs-react-app`: Static Next.js React marketing site scaffold.
- `pip-package`: Base Python package scaffold.
- `react-app`: Vite React app scaffold.
- `skill-with-cli`: Agent skill repo with an included CLI child project.
- `skills`: Agent skill collection scaffold.
- `vscode-extension`: VS Code extension scaffold.

## Template Authoring Notes

- Put runtime metadata in each template's `template.json`.
- Use `$${name_snake}`, `$${name_kebab}`, `$${name_pretty}`, and related
  BoilerSync variables in file contents.
- Use uppercase variable names in file and directory names, such as
  `NAME_SNAKE`.
- Use `.starter` for generated files that should become project-owned after
  initialization.
- Use `.boilersync` in filenames when formatters would otherwise corrupt
  template syntax.

Keep templates generic, brand-neutral, and free of generated local artifacts.
