export interface WiringConfig {
  [key: string]: any
}

export class WiringRuntime {
  private config: WiringConfig

  constructor(config: WiringConfig = {}) {
    this.config = config
  }

  async execute(_instruction: string, _context?: any): Promise<any> {
    return null
  }

  getConfig(): WiringConfig {
    return this.config
  }

  setConfig(config: WiringConfig): void {
    this.config = config
  }
}

export function injectWiringRuntime(html: string): string {
  const bootstrap = `<script id="wonder-wiring-runtime">window.__WONDER_WIRING__=true;</script>`
  if (html.includes('</body>')) {
    return html.replace('</body>', `${bootstrap}</body>`)
  }
  return `${html}${bootstrap}`
}

export default WiringRuntime
