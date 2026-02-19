import json
import logging
from collections.abc import Callable
from types import ModuleType

logger = logging.getLogger(__name__)


_TOOL_MARKER = "_mcp_tool_marker"


def mcp_tool() -> Callable:
    """Decorator to mark a function as an MCP tool.

    Usage:
        @mcp_tool()
        async def my_tool(arg: str) -> str:
            '''Tool docstring.'''
            ...

    The function will be registered when register_tools_from_module is called.
    """

    def decorator(func: Callable) -> Callable:
        setattr(func, _TOOL_MARKER, True)
        return func

    return decorator


def register_tools_from_module(mcp, module: ModuleType) -> None:
    """Register all @mcp_tool decorated functions from a module.

    Args:
        mcp: The FastMCP server instance.
        module: The module to scan for tool functions.
    """
    for name in dir(module):
        obj = getattr(module, name)
        if callable(obj) and getattr(obj, _TOOL_MARKER, False):
            # Register the function as a tool
            mcp.tool()(obj)


def json_response(data: dict) -> str:
    """Return a JSON response."""
    return json.dumps(data, indent=2)


def json_success_response(**kwargs) -> str:
    """Return a JSON success response."""
    return json_response({"success": True, **kwargs})
