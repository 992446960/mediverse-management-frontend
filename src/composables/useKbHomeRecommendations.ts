import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { getFileList, getKnowledgeCards } from '@/api/knowledge'
import type { OwnerType } from '@/types/knowledge'
import type { FileListItem, KnowledgeCard } from '@/types/knowledge'

export type KbHomeScope = 'personal' | 'dept' | 'org'

export interface KbHomeVisibleScope {
  scope: KbHomeScope
  ownerType: OwnerType
  ownerId: string
}

export function useKbHomeRecommendations() {
  const authStore = useAuthStore()
  const { user } = storeToRefs(authStore)

  const visibleScopes = computed<KbHomeVisibleScope[]>(() => {
    const u = user.value
    if (!u) return []
    const list: KbHomeVisibleScope[] = []
    if (u.has_expert_avatar && u.id) {
      list.push({ scope: 'personal', ownerType: 'personal', ownerId: u.id })
    }
    if (u.has_dept_avatar && u.dept_id) {
      list.push({ scope: 'dept', ownerType: 'dept', ownerId: u.dept_id })
    }
    if (u.has_org_avatar && u.org_id) {
      list.push({ scope: 'org', ownerType: 'org', ownerId: u.org_id })
    }
    return list
  })

  const hasAnyWorkbench = computed(() => visibleScopes.value.length > 0)

  const filesByScope = ref<Partial<Record<KbHomeScope, FileListItem[]>>>({})
  const cardsByScope = ref<Partial<Record<KbHomeScope, KnowledgeCard[]>>>({})
  const filesErrorScope = ref<Partial<Record<KbHomeScope, boolean>>>({})
  const cardsErrorScope = ref<Partial<Record<KbHomeScope, boolean>>>({})
  const loading = ref(false)

  async function load() {
    if (!hasAnyWorkbench.value) {
      filesByScope.value = {}
      cardsByScope.value = {}
      filesErrorScope.value = {}
      cardsErrorScope.value = {}
      return
    }

    const scopes = visibleScopes.value
    loading.value = true
    filesErrorScope.value = {}
    cardsErrorScope.value = {}

    try {
      await Promise.all(
        scopes.map(async ({ ownerType, ownerId, scope }) => {
          try {
            const res = await getFileList(ownerType, ownerId, { page: 1, page_size: 3 })
            filesByScope.value[scope] = res.items
          } catch {
            filesErrorScope.value[scope] = true
            filesByScope.value[scope] = []
          }
          try {
            const res = await getKnowledgeCards(ownerType, ownerId, { page: 1, page_size: 3 })
            cardsByScope.value[scope] = res.items
          } catch {
            cardsErrorScope.value[scope] = true
            cardsByScope.value[scope] = []
          }
        })
      )
    } finally {
      loading.value = false
    }
  }

  watch(
    () => [
      user.value?.id,
      user.value?.has_expert_avatar,
      user.value?.has_dept_avatar,
      user.value?.has_org_avatar,
      user.value?.dept_id,
      user.value?.org_id,
    ],
    () => {
      void load()
    },
    { immediate: true }
  )

  return {
    visibleScopes,
    hasAnyWorkbench,
    filesByScope,
    cardsByScope,
    filesErrorScope,
    cardsErrorScope,
    loading,
    load,
  }
}
