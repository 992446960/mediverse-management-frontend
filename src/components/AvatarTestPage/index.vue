<script setup lang="ts">
import ChatWindow from '@/components/ChatWindow/index.vue'

defineProps<{
  avatarId: string
}>()
</script>

<template>
  <div class="avatar-test-page h-full flex flex-col">
    <div class="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h2 class="text-lg font-medium">分身对话测试</h2>
      <p class="text-xs text-gray-500">当前测试分身 ID: {{ avatarId }}</p>
    </div>

    <div class="flex-1 overflow-hidden">
      <ChatWindow is-test-mode :avatar-id="avatarId" />
    </div>
  </div>
</template>
