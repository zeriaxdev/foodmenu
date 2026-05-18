/*
 * Copyright (c) 2026 wilmaplus-foodmenu
 */

import {z, ZodRawShape} from "zod";
import {FoodMenuClient} from "./client";

export interface ToolDefinition<S extends ZodRawShape = ZodRawShape> {
    name: string;
    title: string;
    description: string;
    inputSchema: S;
    buildPath: (args: z.infer<z.ZodObject<S>>) => string;
}

const empty = {} as const;

function staticTool(name: string, title: string, description: string, path: string): ToolDefinition {
    return {
        name,
        title,
        description,
        inputSchema: empty,
        buildPath: () => path,
    };
}

export const tools: ToolDefinition<any>[] = [
    staticTool("get_asikkala_menu", "Asikkala school menu", "Fetch the Asikkala school food menu.", "/asikkala/menu"),
    staticTool("get_syk_menu", "SYK menu", "Fetch the SYK (syk.fi) school food menu.", "/syk/menu"),
    staticTool("get_tyk_menu", "TYK menu", "Fetch the TYK (tyk.fi) school food menu.", "/tyk/menu"),
    staticTool("get_mayk_menu", "MAYK menu", "Fetch the MAYK (mayk.fi) school food menu.", "/mayk/menu"),
    staticTool("get_phyk_menu", "PHYK menu", "Fetch the PHYK (phyk.fi) school food menu.", "/phyk/menu"),
    staticTool("get_steiner_menu", "Tampere Steinerkoulu menu", "Fetch the Tampere Steinerkoulu (Timjami) food menu.", "/steiner/menu"),
    staticTool("get_pyhtaa_menu", "Pyhtää menu", "Fetch the Pyhtää school food menu.", "/pyhtaa/menu"),
    staticTool("get_krtpl_menu", "Kanresta Tampere-Pirkkala menu", "Fetch the Kanresta Tampere-Pirkkala airport restaurant menu.", "/krtpl/menu"),
    staticTool("get_poytyaps_menu", "Pöytyä Peruskoulu menu", "Fetch the Pöytyä Peruskoulu food menu.", "/poytyaps/menu"),
    staticTool("get_kauhajoki_menu", "Kauhajoki menu", "Fetch the Kauhajoki school food menu (ical source).", "/kauhajoki/menu"),
    staticTool("get_kastelli_menu", "Kastelli menu", "Fetch the Kastelli (ISS) restaurant food menu.", "/kastelli/menu"),
    staticTool("get_ael_menu", "AEL menu", "Fetch the AEL (ISS) restaurant food menu.", "/ael/menu"),
    staticTool("get_mantsala_menu", "Mäntsälä menu", "Fetch the Mäntsälän koulut food menu.", "/mantsala/menu"),
    staticTool("list_iss_menus", "List ISS menus", "List all ISS restaurant menus (schools and daycare).", "/iss/menus"),
    staticTool("get_loviisa_paivakoti_menu", "Loviisa päiväkoti menu", "Fetch the Loviisa daycare (päiväkoti) food menu.", "/loviisa/paivakoti/menu"),

    {
        name: "get_looki_menu",
        title: "Looki menu",
        description: "Fetch a Looki (looki.fi) menu by endpoint slug.",
        inputSchema: {
            endpoint: z.string().min(1).describe("Looki endpoint slug (path segment under looki.fi)."),
        },
        buildPath: ({endpoint}) => `/looki/${encodeURIComponent(endpoint)}/menu`,
    },
    {
        name: "get_iss_menu",
        title: "ISS menu by URL",
        description: "Fetch a specific ISS restaurant menu by source URL (use list_iss_menus to discover URLs).",
        inputSchema: {
            url: z.string().url().describe("ISS menu source URL (https://... or iss://...)."),
        },
        buildPath: ({url}) => `/iss/menu/${encodeURIComponent(url)}`,
    },
    {
        name: "list_aroma_restaurants",
        title: "List Aromi restaurants",
        description: "List restaurants available on an Aromi V2 (Aromi SaaS) instance.",
        inputSchema: {
            url: z.string().min(1).describe("Aromi instance hostname or URL."),
        },
        buildPath: ({url}) => `/aroma/${encodeURIComponent(url)}/restaurants`,
    },
    {
        name: "get_aroma_restaurant_menu",
        title: "Aromi restaurant menu",
        description: "Fetch a single Aromi V2 restaurant menu by id.",
        inputSchema: {
            url: z.string().min(1).describe("Aromi instance hostname or URL."),
            id: z.string().min(1).describe("Aromi restaurant id."),
        },
        buildPath: ({url, id}) => `/aroma/${encodeURIComponent(url)}/restaurants/${encodeURIComponent(id)}`,
    },
];

export async function callTool(client: FoodMenuClient, tool: ToolDefinition, args: Record<string, unknown>) {
    const parsed = z.object(tool.inputSchema).parse(args ?? {});
    const path = tool.buildPath(parsed);
    return client.get(path);
}
