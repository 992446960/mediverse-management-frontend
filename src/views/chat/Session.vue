<script setup lang="ts">
import ChatWindow from '@/components/ChatWindow/index.vue'

defineOptions({ name: 'ChatSession' })

const route = useRoute()

/**
 * 双层保障：① `route.name === 'ChatSession'` 才解析；② 会话段使用专用名
 * `params.sessionId`（路由为 `session/:sessionId`），与全站其它 `params.id`（如预览页文件 id）解耦。
 */
const sessionId = computed(() => {
  if (route.name !== 'ChatSession') return ''
  const raw = route.params.sessionId
  return typeof raw === 'string' ? raw : ''
})

/** 会话加载由 ChatWindow 根据 props.sessionId 统一调用 selectSession，避免与父级重复触发 getMessages 被 requestDedup 拦截。 */
</script>

<template>
  <div class="h-full">
    <ChatWindow :session-id="sessionId" />
  </div>
</template>
