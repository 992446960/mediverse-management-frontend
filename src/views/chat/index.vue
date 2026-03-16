<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import AvatarSelector from '@/components/AvatarSelector/index.vue'
import type { Avatar } from '@/types/avatar'

const router = useRouter()
const chatStore = useChatStore()
const { createNewSession } = chatStore

const handleSelectAvatar = async (avatar: Avatar) => {
  // Create a new session with the selected avatar
  const session = await createNewSession(avatar.name, avatar.id)
  router.push(`/chat/session/${session.id}`)
}
</script>

<template>
  <div class="chat-home h-full flex flex-col">
    <div class="p-6 border-b border-gray-100 dark:border-gray-800">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">开始新的对话</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-2">选择一位数字医生开始咨询</p>
    </div>

    <div class="flex-1 overflow-y-auto">
      <AvatarSelector @select="handleSelectAvatar" />
    </div>
  </div>
</template>
