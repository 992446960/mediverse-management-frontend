import { i18n } from '@/i18n'

export function getI18nMessage(
  key: string,
  fallback: string,
  named?: Record<string, unknown>
): string {
  const message = named ? i18n.global.t(key, named) : i18n.global.t(key)
  return message === key ? fallback : message
}
