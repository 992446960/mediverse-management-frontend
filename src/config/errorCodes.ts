import { getI18nMessage } from '@/utils/i18nMessage'

export const httpErrorMessageKeys: Record<number, string> = {
  400: 'error.http.400',
  401: 'error.http.401',
  403: 'error.http.403',
  404: 'error.http.404',
  405: 'error.http.405',
  408: 'error.http.408',
  409: 'error.http.409',
  413: 'error.http.413',
  422: 'error.http.422',
  429: 'error.http.429',
  500: 'error.http.500',
  502: 'error.http.502',
  503: 'error.http.503',
  504: 'error.http.504',
}

export function getHttpErrorMessage(status: number, fallback?: string): string {
  const key = httpErrorMessageKeys[status]
  if (key) {
    return getI18nMessage(
      key,
      fallback || getI18nMessage('error.http.fallback', 'Request failed ({status})', { status })
    )
  }

  return fallback || getI18nMessage('error.http.fallback', 'Request failed ({status})', { status })
}
