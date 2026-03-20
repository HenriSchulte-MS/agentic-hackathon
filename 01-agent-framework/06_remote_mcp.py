# Copyright (c) Microsoft. All rights reserved.

import asyncio
import os

from agent_framework import Agent, MCPStreamableHTTPTool
from agent_framework.azure import AzureOpenAIResponsesClient
from azure.identity import AzureCliCredential
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(override=True)

"""
Remote MCP Tools — Connect an agent to a remote MCP server

This sample demonstrates how to connect an agent to a remote MCP (Model Context Protocol) server.
MCP servers expose tools that agents can use to access external data and services.
In this example, the agent connects to Microsoft Learn's MCP server to answer documentation questions.

Environment variables:
        AZURE_AI_PROJECT_ENDPOINT        — Your Azure AI project endpoint
        PROJECT_ENDPOINT                 — Compatibility alias for project endpoint
  AZURE_OPENAI_RESPONSES_DEPLOYMENT_NAME — Model deployment name (e.g. gpt-4o)
        AZURE_CLI_PROCESS_TIMEOUT        — Optional Azure CLI token timeout in seconds (default: 60)
"""


def _resolve_project_endpoint() -> str:
    project_endpoint = os.getenv("AZURE_AI_PROJECT_ENDPOINT") or os.getenv("PROJECT_ENDPOINT")
    if project_endpoint:
        return project_endpoint

    raise ValueError(
        "Missing project endpoint configuration. Set AZURE_AI_PROJECT_ENDPOINT "
        "or PROJECT_ENDPOINT in .env."
    )


async def main() -> None:
    cli_timeout = int(os.getenv("AZURE_CLI_PROCESS_TIMEOUT", "60"))
    credential = AzureCliCredential(process_timeout=cli_timeout)
    client = AzureOpenAIResponsesClient(
        project_endpoint=_resolve_project_endpoint(),
        deployment_name=os.environ["AZURE_OPENAI_RESPONSES_DEPLOYMENT_NAME"],
        credential=credential,
    )

    # <create_agent_with_mcp>
    # Connect to a remote MCP server and use it as a tool
    async with (
        MCPStreamableHTTPTool(
            name="Microsoft Learn MCP",
            url="https://learn.microsoft.com/api/mcp",
        ) as mcp_server,
    ):
        agent = Agent(
            client=client,
            name="DocsAgent",
            instructions="You are a helpful assistant that answers questions using Microsoft documentation.",
            tools=[mcp_server],
        )

        # <run_agent>
        query = "How can I use Playwright for AI-enabled software testing?"
        print(f"User: {query}\n")
        print(f"{agent.name}: ", end="", flush=True)
        async for chunk in agent.run(query, stream=True):
            if chunk.text:
                print(chunk.text, end="", flush=True)
        print("\n")
        # </run_agent>
    # </create_agent_with_mcp>


if __name__ == "__main__":
    asyncio.run(main())