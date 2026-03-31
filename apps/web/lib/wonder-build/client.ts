export class AuthError extends Error {}
export class PaywallError extends Error {}
export class ServerError extends Error {}

type GenerateInput = {
  prompt: string
}

type GenerateSuccess = {
  success: true
  root: unknown
}

export const wonderBuildClient = {
  async generate(input: GenerateInput): Promise<GenerateSuccess> {
    const response = await fetch('/api/wonder-build/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthError('Unauthorized')
      }

      if (response.status === 402 || response.status === 403) {
        throw new PaywallError('Upgrade required')
      }

      throw new ServerError('Wonder Build request failed')
    }

    return (await response.json()) as GenerateSuccess
  },
}
