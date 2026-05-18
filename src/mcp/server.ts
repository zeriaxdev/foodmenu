#!/usr/bin/env node
/*
 * Copyright (c) 2026 wilmaplus-foodmenu
 */

import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {FoodMenuClient} from "./client";
import {callTool, tools} from "./tools";

const DEFAULT_BASE_URL = "http://localhost:3001";

function getBaseUrl(): string {
    return process.env.FOODMENU_API_URL || DEFAULT_BASE_URL;
}

export async function startServer() {
    const client = new FoodMenuClient(getBaseUrl());

    const server = new McpServer({
        name: "wilmaplus-foodmenu",
        version: "1.1.0",
    });

    for (const tool of tools) {
        server.registerTool(
            tool.name,
            {
                title: tool.title,
                description: tool.description,
                inputSchema: tool.inputSchema,
            },
            async (args: Record<string, unknown>) => {
                try {
                    const result = await callTool(client, tool, args);
                    return {
                        content: [{type: "text" as const, text: JSON.stringify(result, null, 2)}],
                    };
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    return {
                        isError: true,
                        content: [{type: "text" as const, text: `Failed to call ${tool.name}: ${message}`}],
                    };
                }
            },
        );
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

if (require.main === module) {
    startServer().catch((err) => {
        console.error("MCP server failed to start:", err);
        process.exit(1);
    });
}
