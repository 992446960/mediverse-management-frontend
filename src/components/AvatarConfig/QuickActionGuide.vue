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
  const path = `/${props.ownerType === 'personal' ? 'my' : props.ownerType}/chat`
  router.push(path)
}
</script>

<style scoped>
@reference "../../styles/index.css";

.quick-action-guide {
  width: 100%;
}

.guide-card {
  position: relative;
  overflow: hidden;
  padding: 24px;
  border-radius: 12px;
  background: #00a0e9;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.guide-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: white;
  line-height: 1.4;
}

.guide-content {
  margin: 0 0 20px;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.guide-link {
  text-decoration: underline;
  cursor: pointer;
  text-underline-offset: 2px;
  color: white;
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
  background: white !important;
  border: none !important;
  color: #00a0e9 !important;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.test-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: white !important;
  color: #00a0e9 !important;
}

.test-btn-icon {
  font-size: 16px;
  color: #00a0e9;
}
</style>
