# $${name_pretty} MCP Server

$${description}

## Requirements

- Python $${python_version}+
- API credentials (if applicable)

## Development

```bash
uv run mcp dev $${name_snake}.py
```

## Installation

Add to your MCP client config:

```json
{
  "mcpServers": {
    "$${name_kebab}": {
      "command": "uv",
      "args": [
        "--directory",
        "/path/to/$${name_kebab}",
        "run",
        "python",
        "-m",
        "$${name_snake}"
      ],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```
