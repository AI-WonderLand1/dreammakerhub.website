export interface APIClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export class WPAPIClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: APIClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.apiKey) {
      headers['X-AIW-Api-Key'] = this.apiKey;
    }
    return headers;
  }

  public async getStatus() {
    const res = await fetch(`${this.baseUrl}/wp-json/aiw/v1/status`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return res.json();
  }

  public async deployProject(projectData: any) {
    const res = await fetch(`${this.baseUrl}/wp-json/aiw/v1/projects`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(projectData),
    });
    if (!res.ok) throw new Error(`Deploy failed: ${res.statusText}`);
    return res.json();
  }

  public async installPackage(category: string, packageName: string) {
    const res = await fetch(`${this.baseUrl}/wp-json/aiw/v1/marketplace/install`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ category, name: packageName }),
    });
    if (!res.ok) throw new Error(`Installation failed: ${res.statusText}`);
    return res.json();
  }

  public async publishPackage(packageData: any) {
    const res = await fetch(`${this.baseUrl}/wp-json/aiw/v1/marketplace/publish`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(packageData),
    });
    if (!res.ok) throw new Error(`Publish failed: ${res.statusText}`);
    return res.json();
  }
}
