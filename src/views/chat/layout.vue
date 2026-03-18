<script setup lang="ts">
import ChatSidebar from '@/components/ChatSidebar/index.vue'
</script>

<template>
  <div class="chat-layout flex h-screen w-full rounded-md">
    <!-- Sidebar -->
    <div class="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800">
      <ChatSidebar />
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-visible bg-white dark:bg-gray-900 min-w-2xl flex flex-col min-h-0">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.chat-layout {
  max-height: calc(100vh - 64px - 24px - 24px);
}
</style>
