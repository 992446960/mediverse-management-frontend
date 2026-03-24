import { unref } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { i18n } from '@/i18n'

dayjs.extend(relativeTime)

/**
 * 与当前 i18n 语言一致的相对时间（如「3 分钟前」/「3 minutes ago」）
 */
export function formatRelativeFromNow(iso: string | undefined | null): string {
  if (iso == null || iso === '') return ''
  const d = dayjs(iso)
  if (!d.isValid()) return ''
  const locale = unref(i18n.global.locale)
  const dayjsLocale = locale === 'zh-CN' ? 'zh-cn' : 'en'
  return d.locale(dayjsLocale).fromNow()
}
