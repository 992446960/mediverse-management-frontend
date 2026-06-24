<template>
  <div class="quick-action-guide">
    <div class="guide-card">
      <h3 class="guide-title">{{ t('avatar.wizard.quickGuide.title') }}</h3>
      <p class="guide-content">
        {{ t('avatar.wizard.quickGuide.contentBefore') }}
        <span
          class="guide-link"
          tabindex="0"
          role="button"
          @click="handleTest"
          @keydown.enter.prevent="handleTest"
          @keydown.space.prevent="handleTest"
        >
          {{ t('avatar.wizard.quickGuide.contentLink') }}
        </span>
        {{ t('avatar.wizard.quickGuide.contentAfter') }}
      </p>
      <div class="test-btn-wrap">
        <a-button class="test-btn" @click="handleTest">
          <span class="test-btn-text">{{ t('avatar.wizard.quickGuide.testNow') }}</span>
          <PlayCircleFilled class="test-btn-icon" />
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PlayCircleFilled } from '@ant-design/icons-vue'
import type { OwnerType } from '@/constants/avatar'

const props = defineProps<{
  ownerType: OwnerType
}>()

const { t } = useI18n()
const router = useRouter()

const handleTest = () => {
  const path = `/${props.ownerType === 'personal' ? 'my' : props.ownerType}/avatar/test`
  router.push(path)
}
</script>

<style scoped lang="scss">
@reference "../../styles/index.css";

.quick-action-guide {
  width: 100%;
  --quick-action-guide-card-bg: var(--color-avatar-quick-guide-bg);
  --quick-action-guide-text: var(--color-avatar-quick-guide-text);
  --quick-action-guide-content: var(--color-avatar-quick-guide-content);
  --quick-action-guide-button-bg: var(--color-avatar-quick-guide-button-bg);
  --quick-action-guide-button-text: var(--color-avatar-quick-guide-button-text);
}

.guide-card {
  position: relative;
  overflow: hidden;
  padding: 24px;
  border-radius: 12px;
  background: var(--quick-action-guide-card-bg);
  color: var(--quick-action-guide-text);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.guide-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--quick-action-guide-text);
  line-height: 1.4;
}

.guide-content {
  margin: 0 0 20px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--quick-action-guide-content);
}

.guide-link {
  text-decoration: underline;
  cursor: pointer;
  text-underline-offset: 2px;
  color: var(--quick-action-guide-text);
  font-weight: 500;
}

.guide-link:hover {
  opacity: 0.8;
}

.test-btn-wrap {
  display: flex;
  justify-content: center;
}

.test-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  background: var(--quick-action-guide-button-bg) !important;
  border: none !important;
  color: var(--quick-action-guide-button-text) !important;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.test-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: var(--quick-action-guide-button-bg) !important;
  color: var(--quick-action-guide-button-text) !important;
}

.test-btn-icon {
  font-size: 16px;
  color: var(--quick-action-guide-button-text);
}
</style>
