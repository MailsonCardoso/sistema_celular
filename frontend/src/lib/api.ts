import axios from 'axios'

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

export const csrfClient = axios.create({
  baseURL: apiBaseUrl.replace(/\/api$/, ''),
  withCredentials: true,
})

function readXSRFToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

api.interceptors.request.use((config) => {
  const token = readXSRFToken()
  if (token) {
    config.headers.set('X-XSRF-TOKEN', token)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      return 'Muitas tentativas de login. Aguarde 1 minuto e tente novamente.'
    }
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    if (data?.errors) {
      return Object.values(data.errors).flat()[0] ?? data.message ?? 'Erro inesperado.'
    }
    if (data?.message) return data.message
  }
  return 'Erro de conexão com o servidor.'
}
