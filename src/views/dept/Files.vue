<template>
  <div class="flex flex-1 overflow-hidden">
    <KnowledgeFiles
      v-if="authStore.currentDeptId"
      owner-type="dept"
      :owner-id="authStore.currentDeptId"
      :title="t('menu.files')"
    />
    <div v-else class="flex flex-1 items-center justify-center">
      <a-empty :description="t('common.noPermission')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import KnowledgeFiles from '@/views/shared/KnowledgeFiles.vue'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()
</script>
