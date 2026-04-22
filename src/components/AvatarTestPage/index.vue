<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ChatWindow from '@/components/ChatWindow/index.vue'

const { t } = useI18n()

defineProps<{
  avatarId: string
  avatarName: string
}>()
</script>

<template>
  <div class="avatar-test-page h-full flex flex-col app-container layout-content-m-h">
    <div class="avatar-test-page__header p-4">
      <h2 class="avatar-test-page__title text-lg font-medium">
        {{ t('avatar.testChatTitle', { name: avatarName }) }}
      </h2>
      <p class="avatar-test-page__hint text-xs">
        {{ t('avatar.testAvatarIdHint', { id: avatarId }) }}
      </p>
    </div>

    <div class="flex-1 overflow-hidden">
      <ChatWindow is-test-mode :avatar-id="avatarId" />
    </div>
  </div>
</template>

<style scoped>
.avatar-test-page__header {
  border-bottom: 1px solid var(--color-border-secondary);
  background-color: var(--color-bg-container);
}

.avatar-test-page__title {
  color: var(--color-text-base);
}

.avatar-test-page__hint {
  color: var(--color-text-secondary);
}
</style>
