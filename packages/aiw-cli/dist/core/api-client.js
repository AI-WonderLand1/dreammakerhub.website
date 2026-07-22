export class WPAPIClient {
    baseUrl;
    apiKey;
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.apiKey = config.apiKey;
    }
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if (this.apiKey) {
            headers['X-AIW-Api-Key'] = this.apiKey;
        }
        return headers;
    }
    async getStatus() {
        const res = await fetch(`${this.baseUrl}/wp-json/aiw/v1/status`, {
            headers: this.getHeaders(),
        });
        if (!res.ok)
            throw new Error(`API Error: ${res.statusText}`);
        return res.json();
    }
    async deployProject(projectData) {
        const res = await fetch(`${this.baseUrl}/wp-json/aiw/v1/projects`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(projectData),
        });
        if (!res.ok)
            throw new Error(`Deploy failed: ${res.statusText}`);
        return res.json();
    }
    async installPackage(category, packageName) {
        const res = await fetch(`${this.baseUrl}/wp-json/aiw/v1/marketplace/install`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ category, name: packageName }),
        });
        if (!res.ok)
            throw new Error(`Installation failed: ${res.statusText}`);
        return res.json();
    }
    async publishPackage(packageData) {
        const res = await fetch(`${this.baseUrl}/wp-json/aiw/v1/marketplace/publish`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(packageData),
        });
        if (!res.ok)
            throw new Error(`Publish failed: ${res.statusText}`);
        return res.json();
    }
}
