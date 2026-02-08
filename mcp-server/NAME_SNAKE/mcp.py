"""$${name_pretty} MCP Server."""

import logging
import os

from mcp.server.fastmcp import FastMCP

from $${name_snake} import tools
from $${name_snake}.mcp_utils import register_tools_from_module

MCP_TRANSPORT = os.environ.get("MCP_TRANSPORT", "stdio")

# Configure logging (never use print for STDIO-based servers)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MCP server
mcp = FastMCP("$${name_kebab}")

# Register tools from modules
register_tools_from_module(mcp, tools)


def run_mcp_server():
    mcp.run(transport=MCP_TRANSPORT)
