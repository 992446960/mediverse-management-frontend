<template>
  <div v-if="ready" class="flex flex-1 overflow-hidden">
    <FilePreview
      :owner-type="ownerType"
      :owner-id="ownerId"
      :file-id="fileId"
      :file="fileFromState"
    />
  </div>
  <div v-else class="flex flex-1 items-center justify-center">
    <a-empty :description="notReadyReason" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import FilePreview from '@/components/FilePreview/index.vue'
import { useAuthStore } from '@/stores/auth'
import { readKnowledgePreviewContext } from '@/utils/knowledgePreviewStash'
import {
  getKnowledgePreviewOwnerTypeFromRoute,
  isKnowledgePreviewRoute,
} from '@/utils/knowledgePreviewRoute'
import type { OwnerType } from '@/types/knowledge'
import type { FileListItem } from '@/types/knowledge'
import type { RouteLocationNormalizedLoaded, RouteLocationNormalized } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()

interface PreviewContext {
  ownerType: OwnerType
  ownerId: string
  fileId: string
  file?: FileListItem
}

function getOwnerId(type: OwnerType): string {
  switch (type) {
    case 'dept':
      return authStore.currentDeptId ?? ''
    case 'org':
      return authStore.currentOrgId ?? ''
    case 'avatar':
      return ''
    default:
      return authStore.user?.id ?? ''
  }
}

function getHistoryFile(
  targetRoute: RouteLocationNormalizedLoaded | RouteLocationNormalized
): FileListItem | undefined {
  const fromHistory = (history.state as { file?: FileListItem })?.file
  const fromRoute = (targetRoute as { state?: { file?: FileListItem } }).state?.file
  return fromHistory ?? fromRoute
}

/**
 * 预览上下文只在进入/更新预览路由时刷新。
 * 离开到 /chat/session 等路由时，旧预览组件可能仍处于过渡/缓存生命周期；不能用全局 route.path 重新推断 owner。
 */
function buildPreviewContext(
  targetRoute: RouteLocationNormalizedLoaded | RouteLocationNormalized
): PreviewContext {
  const fileId = String(targetRoute.params.id ?? '')
  const stashed = readKnowledgePreviewContext(fileId)
  const ownerType =
    stashed?.ownerType ?? getKnowledgePreviewOwnerTypeFromRoute(targetRoute) ?? 'personal'
  const ownerId = stashed?.ownerId ?? getOwnerId(ownerType)
  return {
    ownerType,
    ownerId,
    fileId,
    file: getHistoryFile(targetRoute) ?? stashed?.file,
  }
}

const previewContext = shallowRef<PreviewContext>(buildPreviewContext(route))

onBeforeRouteUpdate((to) => {
  if (isKnowledgePreviewRoute(to)) {
    previewContext.value = buildPreviewContext(to)
  }
})

const ownerType = computed(() => previewContext.value.ownerType)
const ownerId = computed(() => previewContext.value.ownerId)
const fileId = computed(() => previewContext.value.fileId)
const fileFromState = computed(() => previewContext.value.file)

const ready = computed(() => {
  if (!fileId.value) return false
  if (!fileFromState.value) return false
  if (ownerType.value === 'dept' && !authStore.currentDeptId) return false
  if (ownerType.value === 'org' && !authStore.currentOrgId) return false
  if (ownerType.value === 'personal' && !authStore.user?.id) return false
  return true
})

const notReadyReason = computed(() => {
  if (!fileId.value) return t('knowledge.missingFileId')
  if (!fileFromState.value) return t('knowledge.enterPreviewFromList')
  if (ownerType.value === 'dept' && !authStore.currentDeptId) return t('knowledge.noDeptPermission')
  if (ownerType.value === 'org' && !authStore.currentOrgId) return t('knowledge.noOrgPermission')
  if (ownerType.value === 'personal' && !authStore.user?.id) return t('knowledge.pleaseLogin')
  return t('common.loading')
})
</script>
