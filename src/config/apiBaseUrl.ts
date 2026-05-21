const DEFAULT_API_BASE_URL = '/api/v1'

function normalizeBaseUrl(value: string | undefined): string {
  return value?.trim().replace(/\/$/, '') || ''
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const runtimeBaseUrl = normalizeBaseUrl(window.__APP_CONFIG__?.API_BASE_URL)
    if (runtimeBaseUrl) return runtimeBaseUrl
  }

  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) || DEFAULT_API_BASE_URL
}

export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}/${path.replace(/^\//, '')}`
}
