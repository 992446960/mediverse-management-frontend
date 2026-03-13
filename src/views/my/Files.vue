<template>
  <div v-if="authStore.user?.has_avatar" class="flex flex-1 overflow-hidden">
    <KnowledgeFiles owner-type="personal" :owner-id="authStore.user.id" :title="t('menu.files')" />
  </div>
  <div v-else class="flex flex-1 items-center justify-center bg-white dark:bg-slate-900">
    <a-result
      status="info"
      :title="t('knowledge.noAvatarTitle')"
      :sub-title="t('knowledge.noAvatarSubTitle')"
    >
      <template #extra>
        <a-button type="primary" @click="goToCreateAvatar">
          {{ t('knowledge.goToCreateAvatar') }}
        </a-button>
      </template>
    </a-result>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import KnowledgeFiles from '@/views/shared/KnowledgeFiles.vue'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

function goToCreateAvatar() {
  router.push('/my/avatar')
}
</script>
