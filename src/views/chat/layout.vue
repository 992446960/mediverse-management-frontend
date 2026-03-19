<script setup lang="ts">
import { ref, provide } from 'vue'
import ChatSidebar from '@/components/SessionSidebar/index.vue'
import SkillPanel from '@/components/SkillPanel/index.vue'
import { useChatStore } from '@/stores/chat'

const route = useRoute()
const showSkillPanel = computed(() => route.name === 'ChatSession')
const chatStore = useChatStore()

const skillInputContext = ref<{ inputText: string; fileList: any[] }>({
  inputText: '',
  fileList: [],
})
provide('skillInputContext', skillInputContext)

onMounted(() => {
  chatStore.loadSessions()
})
</script>

<template>
  <div class="chat-layout flex h-screen w-full rounded-md overflow-hidden">
    <!-- Left: Session Sidebar -->
    <div class="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800">
      <ChatSidebar />
    </div>

    <!-- Center: Main Content (ChatWindow via router-view) -->
    <div class="flex-1 overflow-visible bg-white dark:bg-gray-900 min-w-0 flex flex-col min-h-0">
      <router-view />
    </div>

    <!-- Right: Skill Panel（仅对话页展示） -->
    <div v-if="showSkillPanel" class="w-72 shrink-0">
      <SkillPanel />
    </div>
  </div>
</template>

<style scoped>
.chat-layout {
  max-height: calc(100vh - 64px - 24px - 24px);
}
</style>
