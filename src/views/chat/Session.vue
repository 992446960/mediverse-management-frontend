<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import ChatWindow from '@/components/ChatWindow/index.vue'
import { useChatStore } from '@/stores/chat'

const route = useRoute()
const chatStore = useChatStore()
const { selectSession } = chatStore

const sessionId = computed(() => route.params.id as string)

onMounted(() => {
  if (sessionId.value) {
    selectSession(sessionId.value)
  }
})

watch(sessionId, (newId) => {
  if (newId) {
    selectSession(newId)
  }
})
</script>

<template>
  <div class="h-full">
    <ChatWindow :session-id="sessionId" />
  </div>
</template>
