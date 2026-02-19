"""$${name_pretty} MCP tools."""

from typing import Any

from $${name_snake}.mcp_utils import mcp_tool


@mcp_tool()
async def hello_world(name: str) -> dict[str, Any]:
    """Say hello to someone.

    Args:
        name: The name to greet

    Returns:
        A greeting message
    """
    return {"message": f"Hello, {name}!"}
