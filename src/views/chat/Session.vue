<script setup lang="ts">
import ChatWindow from '@/components/ChatWindow/index.vue'

defineOptions({ name: 'ChatSession' })

const route = useRoute()

const sessionId = computed(() => route.params.id as string)

/** 会话加载由 ChatWindow 根据 props.sessionId 统一调用 selectSession，避免与父级重复触发 getMessages 被 requestDedup 拦截。 */
</script>

<template>
  <div class="h-full">
    <ChatWindow :session-id="sessionId" />
  </div>
</template>
