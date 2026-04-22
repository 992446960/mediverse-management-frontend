<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useChatStore } from '@/stores/chat'
import AvatarSelector from '@/components/AvatarSelector/index.vue'
import type { ChatAvatar } from '@/api/avatars'

defineOptions({ name: 'ChatHome' })

const { t } = useI18n()
const router = useRouter()
const chatStore = useChatStore()
const { createNewSession } = chatStore

const handleSelectAvatar = async (avatar: ChatAvatar) => {
  const session = await createNewSession(avatar.id, avatar.name)
  if (!session) return
  router.push(`/chat/session/${session.id}`)
}
</script>

<template>
  <div class="chat-home h-full flex flex-col">
    <div class="p-6 border-b border-gray-100 dark:border-gray-800">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">
        {{ t('chat.startNewConversation') }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-2">{{ t('chat.selectAvatarHint') }}</p>
    </div>

    <div class="flex-1 min-h-0 flex flex-col overflow-visible">
      <AvatarSelector @select="handleSelectAvatar" />
    </div>
  </div>
</template>
