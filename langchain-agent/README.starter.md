# $${name_pretty}

$${description}

## Installation

```bash
pip install -e .
```

## Usage

This package provides LangGraph agents that can be discovered and used by the agent framework.

### Available Agents

- `example` - Example agent demonstrating the basic structure

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Lint
ruff check .
ruff format .
```

## Adding New Agents

1. Create a new directory under `$${name_snake}/` (e.g., `my_new_agent/`)
2. Add the required files:
   - `__init__.py` - Module init
   - `agent.py` - Main agent creation logic
   - `tools.py` - Agent tools
   - `prompts.py` - System prompts
3. Register the agent in `$${name_snake}/__init__.py`:
   ```python
   def get_graphs():
       return {
           "example": "$${name_snake}.example_agent.agent:agent",
           "my_new_agent": "$${name_snake}.my_new_agent.agent:agent",
       }
   ```
