import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types/auth'
import type { OwnerType } from '@/constants/avatar'
import type { DashboardBranchStat } from '@/types/dashboard'
import { getAvatarStats } from '@/api/avatarStats'

function buildAvatarStatRequests(
  user: User | null
): Array<{ ownerType: OwnerType; ownerId: string }> {
  if (!user) return []
  const out: Array<{ ownerType: OwnerType; ownerId: string }> = []
  if (user.has_expert_avatar && user.id) {
    out.push({ ownerType: 'personal', ownerId: user.id })
  }
  if (user.has_dept_avatar && user.dept_id) {
    out.push({ ownerType: 'dept', ownerId: user.dept_id })
  }
  if (user.has_org_avatar && user.org_id) {
    out.push({ ownerType: 'org', ownerId: user.org_id })
  }
  return out
}

export function useDashboardAvatarStats() {
  const authStore = useAuthStore()
  const { t } = useI18n()

  const loading = ref(false)
  const branches = ref<DashboardBranchStat[]>([])

  const hasAnyAvatar = computed(() => {
    const u = authStore.user
    if (!u) return false
    return (
      (u.has_expert_avatar && !!u.id) ||
      (u.has_dept_avatar && !!u.dept_id) ||
      (u.has_org_avatar && !!u.org_id)
    )
  })

  const aggregatedSessions = computed(() => {
    let total = 0
    let today = 0
    for (const b of branches.value) {
      total += b.data.totalSessions
      today += b.data.todaySessions
    }
    return { total, today }
  })

  const aggregatedKnowledge = computed(() => {
    let indexed = 0
    let total = 0
    for (const b of branches.value) {
      indexed += b.data.knowledgeProgress.indexedFiles
      total += b.data.knowledgeProgress.totalFiles
    }
    const percentage = total > 0 ? Math.round((indexed / total) * 100) : 0
    return { indexed, total, percentage }
  })

  const singleBranch = computed(() => (branches.value.length === 1 ? branches.value[0] : null))

  async function load() {
    const user = authStore.user
    if (!user) {
      branches.value = []
      return
    }
    const reqs = buildAvatarStatRequests(user)
    if (reqs.length === 0) {
      branches.value = []
      return
    }
    loading.value = true
    try {
      const settled = await Promise.allSettled(
        reqs.map((r) => getAvatarStats(r.ownerType, r.ownerId, { skipErrorToast: true }))
      )
      const next: DashboardBranchStat[] = []
      for (let i = 0; i < settled.length; i++) {
        const s = settled[i]!
        if (s.status === 'fulfilled') {
          const r = reqs[i]!
          next.push({
            ownerType: r.ownerType,
            ownerId: r.ownerId,
            data: s.value,
          })
        }
      }
      branches.value = next
      if (next.length === 0 && reqs.length > 0) {
        message.error(t('dashboard.loadFailed'))
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    branches,
    hasAnyAvatar,
    aggregatedSessions,
    aggregatedKnowledge,
    singleBranch,
    load,
  }
}
