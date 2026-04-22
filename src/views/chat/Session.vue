<script setup lang="ts">
import ChatWindow from '@/components/ChatWindow/index.vue'

defineOptions({ name: 'ChatSession' })

const route = useRoute()

/**
 * 必须用当前「叶子」路由名隔离：ChatLayout 在 keep-alive 中保留时，
 * useRoute() 会随全局导航变化；/dept/files/preview/:id 等与 /chat/session/:id
 * 均使用 params.id，否则会误把文件 id 当作会话 id 触发 getMessages。
 */
const sessionId = computed(() => {
  if (route.name !== 'ChatSession') return ''
  const raw = route.params.id
  return typeof raw === 'string' ? raw : ''
})

/** 会话加载由 ChatWindow 根据 props.sessionId 统一调用 selectSession，避免与父级重复触发 getMessages 被 requestDedup 拦截。 */
</script>

<template>
  <div class="h-full">
    <ChatWindow :session-id="sessionId" />
  </div>
</template>
