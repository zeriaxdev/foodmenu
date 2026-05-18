/*
 * Copyright (c) 2026 wilmaplus-foodmenu
 */

import http from "http";
import https from "https";
import {URL} from "url";

export interface FoodMenuResponse {
    status: boolean;
    [key: string]: unknown;
}

export class FoodMenuClient {
    private readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }

    get(path: string): Promise<FoodMenuResponse> {
        const target = new URL(this.baseUrl + path);
        const transport = target.protocol === "https:" ? https : http;
        return new Promise((resolve, reject) => {
            const req = transport.get(target, (res) => {
                const chunks: Buffer[] = [];
                res.on("data", (c) => chunks.push(c));
                res.on("end", () => {
                    const body = Buffer.concat(chunks).toString("utf8");
                    try {
                        resolve(JSON.parse(body) as FoodMenuResponse);
                    } catch (e) {
                        reject(new Error(`Invalid JSON from ${path}: ${(e as Error).message}`));
                    }
                });
            });
            req.on("error", reject);
            req.setTimeout(30000, () => req.destroy(new Error(`Request to ${path} timed out`)));
        });
    }
}
