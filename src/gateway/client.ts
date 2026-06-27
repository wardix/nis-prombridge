import { config } from '../config'

class GatewayClient {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl
    this.token = token
  }

  private get headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    }
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value)
      }
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `Gateway GET Error: ${response.status} ${response.statusText}`,
        errorText
      )
      throw new Error(
        `Gateway GET request failed: ${response.status} ${response.statusText}`
      )
    }

    return response.json() as Promise<T>
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `Gateway POST Error: ${response.status} ${response.statusText}`,
        errorText
      )
      throw new Error(
        `Gateway POST request failed: ${response.status} ${response.statusText}`
      )
    }

    return response.json() as Promise<T>
  }
}

export const gatewayClient = new GatewayClient(
  config.GATEWAY_URL,
  config.GATEWAY_TOKEN
)
