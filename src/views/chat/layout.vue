<script setup lang="ts">
import ChatSidebar from '@/components/ChatSidebar/index.vue'
</script>

<template>
  <div class="chat-layout flex h-screen w-full overflow-hidden">
    <!-- Sidebar -->
    <div class="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
      <ChatSidebar />
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-hidden bg-white dark:bg-gray-900">
      <router-view />
    </div>
  </div>
</template>
