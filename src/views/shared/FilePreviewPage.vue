<template>
  <div v-if="ready" class="flex flex-1 overflow-hidden">
    <FilePreview :owner-type="ownerType" :owner-id="ownerId" :file-id="fileId" />
  </div>
  <div v-else class="flex flex-1 items-center justify-center">
    <a-empty :description="notReadyReason" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import FilePreview from '@/components/FilePreview/index.vue'
import { useAuthStore } from '@/stores/auth'
import type { OwnerType } from '@/types/knowledge'

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

const ready = computed(() => {
  if (!fileId.value) return false
  if (ownerType.value === 'dept' && !authStore.currentDeptId) return false
  if (ownerType.value === 'org' && !authStore.currentOrgId) return false
  if (ownerType.value === 'personal' && !authStore.user?.id) return false
  return true
})

const notReadyReason = computed(() => {
  if (!fileId.value) return '缺少文件 ID'
  if (ownerType.value === 'dept' && !authStore.currentDeptId) return '无科室权限'
  if (ownerType.value === 'org' && !authStore.currentOrgId) return '无机构权限'
  if (ownerType.value === 'personal' && !authStore.user?.id) return '请先登录'
  return '加载中...'
})
</script>
