export type LLMProvider = 'openai' | 'anthropic' | 'mistral' | 'groq'

export interface LLMConfig {
  provider: LLMProvider
  apiKey: string
  model: string
  baseUrl?: string
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

const PROVIDER_URLS: Record<LLMProvider, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  mistral: 'https://api.mistral.ai/v1',
  groq: 'https://api.groq.com/openai/v1',
}

export class LLMClient {
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  async chat(messages: LLMMessage[], maxTokens = 512): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl ?? PROVIDER_URLS[this.config.provider]
    const url = `${baseUrl}/chat/completions`

    const body = {
      model: this.config.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: maxTokens,
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.provider === 'anthropic') {
      headers['x-api-key'] = this.config.apiKey
      headers['anthropic-version'] = '2023-06-01'
    } else {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`LLM API error ${res.status}: ${err}`)
    }

    const data = await res.json()

    if (this.config.provider === 'anthropic') {
      return {
        content: data.content?.[0]?.text ?? '',
        usage: {
          promptTokens: data.usage?.input_tokens ?? 0,
          completionTokens: data.usage?.output_tokens ?? 0,
          totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
        },
      }
    }

    return {
      content: data.choices?.[0]?.message?.content ?? '',
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
    }
  }

  async chatStream(
    messages: LLMMessage[],
    onToken: (token: string) => void,
    maxTokens = 512
  ): Promise<void> {
    const baseUrl = this.config.baseUrl ?? PROVIDER_URLS[this.config.provider]
    const url = `${baseUrl}/chat/completions`

    const body = {
      model: this.config.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: maxTokens,
      stream: true,
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.provider === 'anthropic') {
      headers['x-api-key'] = this.config.apiKey
      headers['anthropic-version'] = '2023-06-01'
    } else {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`LLM stream error ${res.status}: ${err}`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') return

        try {
          const parsed = JSON.parse(data)
          const token = parsed.choices?.[0]?.delta?.content
          if (token) onToken(token)
        } catch {
          // skip malformed chunks
        }
      }
    }
  }
}
