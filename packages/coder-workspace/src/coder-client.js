const CODER_API_VERSION = '/api/v2';

export class CoderClient {
  constructor(coderUrl, sessionToken) {
    this.coderUrl = coderUrl.replace(/\/+$/, '');
    this.sessionToken = sessionToken;
  }

  async request(method, path, body) {
    const url = `${this.coderUrl}${CODER_API_VERSION}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'Coder-Session-Token': this.sessionToken,
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!res.ok) {
      const msg = typeof data === 'object' && data !== null
        ? (data.message || data.error || JSON.stringify(data))
        : String(data);
      throw new CoderError(res.status, msg, method, path);
    }

    return data;
  }

  async listWorkspaces(userId) {
    const data = await this.request('GET', `/workspaces?q=owner:${userId}`);
    return (data.workspaces || []).map(normalizeWorkspace);
  }

  async getWorkspace(workspaceId) {
    const data = await this.request('GET', `/workspaces/${workspaceId}`);
    return normalizeWorkspace(data);
  }

  async createWorkspace(userId, templateId, options = {}) {
    const {
      name = `ws-${Date.now().toString(36)}`,
      cpu = '2',
      memory = '4',
      disk = '20',
      ttlMs,
      autostartSchedule,
    } = options;

    const body = {
      template_id: templateId,
      name,
      rich_parameter_values: [
        { name: 'cpu', value: String(cpu) },
        { name: 'memory', value: String(memory) },
        { name: 'home_disk_size', value: String(disk) },
      ],
    };

    if (ttlMs) body.ttl_ms = ttlMs;
    if (autostartSchedule) body.autostart_schedule = autostartSchedule;

    const data = await this.request('POST', `/users/${userId}/workspaces`, body);
    return normalizeWorkspace(data);
  }

  async startWorkspace(workspaceId) {
    return this.build(workspaceId, 'start');
  }

  async stopWorkspace(workspaceId) {
    return this.build(workspaceId, 'stop');
  }

  async deleteWorkspace(workspaceId) {
    return this.build(workspaceId, 'delete');
  }

  async build(workspaceId, transition) {
    const data = await this.request('POST', `/workspaces/${workspaceId}/builds`, {
      transition,
    });
    return {
      buildId: data.id,
      status: data.status,
      transition: data.transition,
    };
  }

  async getBuildLogs(buildId) {
    const url = `${this.coderUrl}${CODER_API_VERSION}/workspacebuilds/${buildId}/logs`;
    const res = await fetch(url, {
      headers: { 'Coder-Session-Token': this.sessionToken },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new CoderError(res.status, 'Failed to fetch build logs', 'GET', `/workspacebuilds/${buildId}/logs`);
    }

    const text = await res.text();
    return text;
  }

  async waitForWorkspace(workspaceId, options = {}) {
    const { timeoutMs = 60000, intervalMs = 2000 } = options;
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const ws = await this.getWorkspace(workspaceId);
      const buildStatus = ws.latestBuild?.status;

      if (buildStatus === 'running') return ws;
      if (buildStatus === 'stopped') return ws;
      if (buildStatus === 'failed') {
        throw new CoderError(500, `Workspace build failed: ${ws.latestBuild?.error || 'unknown'}`, 'WAIT', workspaceId);
      }
      if (buildStatus === 'deleted') {
        throw new CoderError(404, 'Workspace was deleted', 'WAIT', workspaceId);
      }

      await sleep(intervalMs);
    }

    throw new CoderError(408, `Workspace did not reach ready state within ${timeoutMs}ms`, 'WAIT', workspaceId);
  }

  async uploadFile(workspaceId, filePath, content) {
    if (typeof filePath !== 'string' || filePath.length === 0) {
      throw new CoderError(400, 'Invalid file path', 'PUT', 'upload');
    }
    if (filePath.includes('..') || filePath.startsWith('/') || filePath.startsWith('\\')) {
      throw new CoderError(400, 'Path traversal is not allowed', 'PUT', 'upload');
    }
    if (/[<>:"|?*]/.test(filePath)) {
      throw new CoderError(400, 'File path contains invalid characters', 'PUT', 'upload');
    }
    if (typeof workspaceId !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(workspaceId)) {
      throw new CoderError(400, 'Invalid workspace ID', 'PUT', 'upload');
    }

    const safePath = encodeURIComponent(filePath);
    const url = `${this.coderUrl}${CODER_API_VERSION}/workspaces/${workspaceId}/files/${safePath}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Coder-Session-Token': this.sessionToken,
      },
      body: typeof content === 'string' ? new TextEncoder().encode(content) : content,
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new CoderError(res.status, `File upload failed: ${text}`, 'PUT', `/workspaces/${workspaceId}/files/${safePath}`);
    }

    return { success: true };
  }

  async listTemplates() {
    const data = await this.request('GET', '/templates');
    return (data.templates || []).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description || '',
      icon: t.icon || '',
      tags: t.tags || [],
      activeVersionId: t.active_version_id,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
  }

  async getTemplate(templateId) {
    const data = await this.request('GET', `/templates/${templateId}`);
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      icon: data.icon || '',
      tags: data.tags || [],
      activeVersionId: data.active_version_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // ── AI Bridge ──────────────────────────────────────────────

  async listAIBridgeClients() {
    return this.request('GET', '/aibridge/clients');
  }

  async listAIBridgeInterceptions(options = {}) {
    const params = buildQueryParams(options);
    return this.request('GET', `/aibridge/interceptions${params}`);
  }

  async listAIBridgeModels() {
    return this.request('GET', '/aibridge/models');
  }

  async listAIBridgeSessions(options = {}) {
    const params = buildQueryParams(options);
    return this.request('GET', `/aibridge/sessions${params}`);
  }

  async getAIBridgeSessionThreads(sessionId, options = {}) {
    const params = buildQueryParams(options);
    return this.request('GET', `/aibridge/sessions/${sessionId}${params}`);
  }

  // ── AI Providers ───────────────────────────────────────────

  async listAIProviders() {
    return this.request('GET', '/ai/providers');
  }

  async createAIProvider(provider) {
    return this.request('POST', '/ai/providers', provider);
  }

  async getAIProvider(idOrName) {
    return this.request('GET', `/ai/providers/${encodeURIComponent(idOrName)}`);
  }

  async updateAIProvider(idOrName, updates) {
    return this.request('PATCH', `/ai/providers/${encodeURIComponent(idOrName)}`, updates);
  }

  async deleteAIProvider(idOrName) {
    await this.request('DELETE', `/ai/providers/${encodeURIComponent(idOrName)}`);
    return { success: true };
  }

  // ── Agents ─────────────────────────────────────────────────

  async getAgent(agentId) {
    const encodedAgentId = encodeURIComponent(agentId);
    return this.request('GET', `/workspaceagents/${encodedAgentId}`);
  }

  async getAgentConnection(agentId) {
    const encodedAgentId = encodeURIComponent(agentId);
    return this.request('GET', `/workspaceagents/${encodedAgentId}/connection`);
  }

  async getAgentLogs(agentId, options = {}) {
    const encodedAgentId = encodeURIComponent(agentId);
    const params = buildQueryParams(options);
    const url = `${this.coderUrl}${CODER_API_VERSION}/workspaceagents/${encodedAgentId}/logs${params}`;
    const res = await fetch(url, {
      headers: { 'Coder-Session-Token': this.sessionToken },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new CoderError(res.status, text || 'Failed to fetch agent logs', 'GET', `/workspaceagents/${encodedAgentId}/logs`);
    }

    return res.json();
  }

  async getAgentListeningPorts(agentId) {
    const encodedAgentId = encodeURIComponent(agentId);
    return this.request('GET', `/workspaceagents/${encodedAgentId}/listening-ports`);
  }

  async getAgentContainers(agentId, label) {
    const encodedAgentId = encodeURIComponent(agentId);
    const params = label ? `?label=${encodeURIComponent(label)}` : '';
    return this.request('GET', `/workspaceagents/${encodedAgentId}/containers${params}`);
  }

  async getAgentGitSSHKey() {
    return this.request('GET', '/workspaceagents/me/gitsshkey');
  }

  async patchAgentAppStatus(appStatus) {
    return this.request('PATCH', '/workspaceagents/me/app-status', appStatus);
  }
}

function normalizeWorkspace(ws) {
  const build = ws.latest_build || {};
  return {
    id: ws.id,
    name: ws.name,
    ownerId: ws.owner_id,
    ownerName: ws.owner_name,
    templateId: ws.template_id,
    templateName: ws.template_name,
    latestBuild: {
      id: build.id,
      buildNumber: build.build_number,
      transition: build.transition,
      status: build.job?.status || 'unknown',
      reason: build.reason,
      createdAt: build.created_at,
      deadline: build.deadline,
    },
    autostartSchedule: ws.autostart_schedule,
    ttlMs: ws.ttl_ms,
    dormantAt: ws.dormant_at,
    lastUsedAt: ws.last_used_at,
    favorite: ws.favorite,
    health: ws.health,
    outdated: ws.outdated,
    accessUrl: ws.access_url,
    createdAt: ws.created_at,
    updatedAt: ws.updated_at,
  };
}

function buildQueryParams(options) {
  const parts = [];
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class CoderError extends Error {
  constructor(statusCode, message, method, path) {
    super(message);
    this.name = 'CoderError';
    this.statusCode = statusCode;
    this.method = method;
    this.path = path;
  }
}
