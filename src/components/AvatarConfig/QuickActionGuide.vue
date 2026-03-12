<template>
  <div class="quick-action-guide">
    <div class="guide-card">
      <h3 class="guide-title">{{ t('avatar.wizard.quickGuide.title') }}</h3>
      <p class="guide-content">{{ t('avatar.wizard.quickGuide.content') }}</p>
      <a-button ghost class="test-btn" @click="handleTest">
        {{ t('avatar.wizard.quickGuide.testNow') }} →
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { OwnerType } from '@/constants/avatar'

const props = defineProps<{
  ownerType: OwnerType
}>()

const { t } = useI18n()
const router = useRouter()

const handleTest = () => {
  // 根据 ownerType 跳转到对应的对话测试页面
  // 假设路由规则为 /my/chat, /dept/chat, /org/chat
  const path = `/${props.ownerType === 'personal' ? 'my' : props.ownerType}/chat`
  router.push(path)
}
</script>

<style scoped>
@reference "../../styles/index.css";

.guide-card {
  @apply p-6 rounded-xl bg-linear-to-br from-[#0ea5e9] to-[#2dd4bf] text-white shadow-lg;
}

.guide-title {
  @apply text-lg font-bold mb-3 text-white;
}

.guide-content {
  @apply text-sm leading-relaxed mb-6 opacity-90;
}

.test-btn {
  @apply h-10 px-6 rounded-full border-white text-white hover:bg-white hover:text-[#0ea5e9] transition-all;
}
</style>
