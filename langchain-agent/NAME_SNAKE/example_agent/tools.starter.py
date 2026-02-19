"""Tools for the Example Agent."""

from __future__ import annotations

from langchain_core.tools import tool


def interrupt_on(tool_call: dict) -> bool:
    """Determine if a tool call should be interrupted for human approval.

    Args:
        tool_call: The tool call dictionary with 'name' and 'args'

    Returns:
        True if the tool should be interrupted for approval
    """
    # Add tool names here that require human approval
    interrupt_tools = []
    return tool_call.get("name") in interrupt_tools


@tool
def example_tool(query: str) -> str:
    """An example tool that echoes back the query.

    Args:
        query: The input query string

    Returns:
        The echoed query with a prefix
    """
    return f"You said: {query}"


def load_tools():
    """Load all tools for this agent.

    Returns:
        List of tools
    """
    return [example_tool]
