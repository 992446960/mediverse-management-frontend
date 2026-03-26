<script setup lang="ts">
import { ref, provide, computed, onMounted, watch } from 'vue'
import ChatSidebar from '@/components/SessionSidebar/index.vue'
import SkillPanel from '@/components/SkillPanel/index.vue'
import { useChatStore } from '@/stores/chat'

defineOptions({ name: 'ChatLayout' })

const route = useRoute()
const showSkillPanel = computed(() => route.name === 'ChatSession')
const chatStore = useChatStore()

const skillInputContext = ref<{ inputText: string; fileList: any[] }>({
  inputText: '',
  fileList: [],
})
provide('skillInputContext', skillInputContext)

const skillPanelExpanded = ref(false)

function openSkillPanel() {
  if (!showSkillPanel.value) return
  skillPanelExpanded.value = true
}
provide('openSkillPanel', openSkillPanel)

/** 切换会话时收起技能面板，避免沿用上一会话的上下文 */
watch(
  () => route.params.id,
  () => {
    skillPanelExpanded.value = false
  }
)

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
    <div class="chat-layout__center flex-1 overflow-visible min-w-[400px] flex flex-col min-h-0">
      <router-view v-slot="{ Component, route: childRoute }">
        <keep-alive>
          <component
            :is="Component"
            :key="(childRoute.name as string | undefined) ?? childRoute.fullPath"
          />
        </keep-alive>
      </router-view>
    </div>

    <!-- Right: Skill Panel（默认收起；宽度过渡，内层固定 w-82 保证布局） -->
    <div
      v-if="showSkillPanel"
      :class="[
        'chat-layout__skill-rail shrink-0 overflow-hidden h-full min-h-0',
        skillPanelExpanded
          ? 'w-82 border-l border-gray-200 dark:border-gray-800'
          : 'w-0 border-l-0',
      ]"
    >
      <div class="w-82 h-full min-h-0">
        <SkillPanel id="chat-skill-panel" v-model:expanded="skillPanelExpanded" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-layout {
  max-height: var(--ant-layout-content-insert-height);
}

.chat-layout__center {
  background: var(--color-bg-container);
}

.chat-layout__skill-rail {
  transition: width 0.28s ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .chat-layout__skill-rail {
    transition-duration: 0.01ms;
  }
}
</style>
