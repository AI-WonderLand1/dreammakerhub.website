/**
 * Alice Proxy - TypeScript wrapper for Python Wonderland Agent
 * Acts as "Remote Brain" interface for Next.js frontend
 */

import { env } from "@/lib/env";

const API_BASE = env.AGENT_API_URL;
const API_KEY = env.ALICE_API_KEY || "";

export interface MemoryEntry {
  key: string;
  value: any;
  importance: number;
  created_at?: string;
}

export interface RepoAnalysis {
  root: string;
  frontend_path: string | null;
  backend_path: string | null;
  languages: Record<string, number>;
  file_tree: Record<string, any>;
}

export interface AgentResponse {
  ok: boolean;
  answer?: string;
  summary?: string;
  error?: string;
}

export class AliceProxy {
  private apiBase: string;
  private apiKey: string;

  constructor(apiBase: string = API_BASE, apiKey: string = API_KEY) {
    this.apiBase = apiBase;
    this.apiKey = apiKey;
  }

  private async fetch(endpoint: string, body: object): Promise<any> {
    const response = await fetch(`${this.apiBase}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Alice API error: ${response.status}`);
    }

    return response.json();
  }

  // Spirit Guide - Wisdom/Intuition persona
  async consult(question: string, userId: string = "seeker"): Promise<string> {
    try {
      const data = await this.fetch("/api/spirit-guide/consult", {
        question,
        user_id: userId,
      });
      return data.answer || data.error || "No response";
    } catch (error) {
      console.error("Spirit Guide error:", error);
      return "Spirit Guide is offline. Start: cd agent && ./run.sh";
    }
  }

  // Orchestrator - Execution/Planning persona
  async execute(goal: string, userId: string = "worker"): Promise<string> {
    try {
      const data = await this.fetch("/api/orchestrator/execute", {
        goal,
        user_id: userId,
      });
      return data.answer || data.error || "No response";
    } catch (error) {
      console.error("Orchestrator error:", error);
      return "Orchestrator is offline. Start: cd agent && ./run.sh";
    }
  }

  // Repo Analysis
  async analyzeRepo(repoPath: string): Promise<RepoAnalysis | null> {
    try {
      const data = await this.fetch("/api/orchestrator/analyze", {
        repo_path: repoPath,
      });
      return data.summary || null;
    } catch (error) {
      console.error("Repo analysis error:", error);
      return null;
    }
  }

  // Memory operations
  async storeMemory(key: string, value: any, importance: number = 0.5): Promise<boolean> {
    try {
      await this.fetch("/api/memory/store", {
        key,
        value,
        importance,
      });
      return true;
    } catch {
      return false;
    }
  }

  async recallMemory(query?: string, limit: number = 10): Promise<MemoryEntry[]> {
    try {
      const data = await this.fetch("/api/memory/recall", {
        query,
        limit,
      });
      return data.memories || [];
    } catch {
      return [];
    }
  }

  // Health check
  async isOnline(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBase}/health`);
      const data = await response.json();
      return data.status === "healthy";
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const alice = new AliceProxy();
