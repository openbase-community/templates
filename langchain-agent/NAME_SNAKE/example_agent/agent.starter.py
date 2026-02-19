"""Example Agent - Simple LangChain agent.

This module creates a simple agent using LangChain's create_agent.
"""

from __future__ import annotations

from datetime import datetime

from agent.checkpointers import get_checkpointer
from agent.middleware import AgentInboxHumanInTheLoopMiddleware
from agent.tools import think_tool
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model

from $${name_snake}.example_agent.prompts import SYSTEM_PROMPT
from $${name_snake}.example_agent.tools import interrupt_on, load_tools

checkpointer = get_checkpointer()


def create_example_agent():
    """Create a simple agent with tools.

    Returns:
        The configured agent
    """
    # Load tools
    tools = load_tools()
    all_tools = tools + [think_tool]

    # Get current date for prompt
    current_date = datetime.now().strftime("%Y-%m-%d")

    # Model
    model = init_chat_model(
        model="anthropic:claude-sonnet-4-5-20250929", temperature=0.0
    )

    # Create the agent with HITL middleware
    return create_agent(
        model,
        tools=all_tools,
        system_prompt=SYSTEM_PROMPT.format(date=current_date),
        middleware=[
            AgentInboxHumanInTheLoopMiddleware(
                interrupt_on=interrupt_on,
                description_prefix="Tool execution pending approval",
            ),
        ],
        checkpointer=checkpointer,
    )


# Create agent instance for LangGraph deployment
agent = create_example_agent()
