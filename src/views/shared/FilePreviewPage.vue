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
import { readKnowledgePreviewFile } from '@/utils/knowledgePreviewStash'
import type { OwnerType } from '@/types/knowledge'
import type { FileListItem } from '@/types/knowledge'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()

const ownerType = computed<OwnerType>(() => {
  const path = route.path
  if (path.startsWith('/dept/')) return 'dept'
  if (path.startsWith('/org/')) return 'org'
  return 'personal'
})

const ownerId = computed(() => {
  switch (ownerType.value) {
    case 'dept':
      return authStore.currentDeptId ?? ''
    case 'org':
      return authStore.currentOrgId ?? ''
    default:
      return authStore.user?.id ?? ''
  }
})

const fileId = computed(() => route.params.id as string)

/**
 * 列表传入的文件行：优先 history.state（若将来路由保留），否则 sessionStorage（Vue Router 5 下 push state 未出现在 history.state）
 */
const fileFromState = computed<FileListItem | undefined>(() => {
  const fromHistory = (history.state as { file?: FileListItem })?.file
  const fromRoute = (route as { state?: { file?: FileListItem } }).state?.file
  if (fromHistory) return fromHistory
  if (fromRoute) return fromRoute
  return readKnowledgePreviewFile(fileId.value)
})

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
