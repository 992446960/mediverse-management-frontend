<template>
  <div class="avatar-upload-panel" :class="`avatar-upload-panel--${variant}`">
    <div v-if="variant === 'wizard' && showTitle" class="avatar-upload-panel__title">
      {{ title }}
    </div>

    <div class="avatar-upload-panel__preview">
      <a-avatar :src="imageUrl || undefined" :size="avatarSize" class="avatar-upload-panel__avatar">
        <template #icon>
          <UserOutlined />
        </template>
      </a-avatar>
    </div>

    <div class="avatar-upload-panel__body">
      <div v-if="variant === 'inline' && showTitle" class="avatar-upload-panel__title">
        {{ title }}
      </div>
      <a-button
        type="primary"
        ghost
        size="small"
        :loading="loading"
        :disabled="disabled"
        @click="emit('upload')"
      >
        <template #icon>
          <PlusOutlined />
        </template>
        {{ actionText }}
      </a-button>
      <a-button
        v-if="clearable && imageUrl"
        type="link"
        danger
        size="small"
        class="avatar-upload-panel__clear"
        :disabled="disabled || loading"
        @click="emit('clear')"
      >
        {{ clearText }}
      </a-button>
      <div v-if="hint" class="avatar-upload-panel__hint">{{ hint }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusOutlined, UserOutlined } from '@ant-design/icons-vue'

withDefaults(
  defineProps<{
    imageUrl?: string
    title: string
    actionText: string
    hint?: string
    loading?: boolean
    disabled?: boolean
    variant?: 'inline' | 'wizard'
    avatarSize?: number
    clearable?: boolean
    clearText?: string
    showTitle?: boolean
  }>(),
  {
    imageUrl: '',
    hint: '',
    loading: false,
    disabled: false,
    variant: 'inline',
    avatarSize: 72,
    clearable: false,
    clearText: '移除头像',
    showTitle: true,
  }
)

const emit = defineEmits<{
  upload: []
  clear: []
}>()
</script>

<style scoped lang="scss">
.avatar-upload-panel {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.avatar-upload-panel__preview {
  flex-shrink: 0;
}

.avatar-upload-panel__avatar {
  color: var(--color-primary);
  background: var(--color-primary-50);
  border: 1px solid var(--color-border-secondary);
}

.avatar-upload-panel__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  gap: var(--spacing-xs);
}

.avatar-upload-panel--inline .avatar-upload-panel__title {
  display: block;
}

.avatar-upload-panel--wizard {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: 0;
  border: 0;
  background: transparent;
}

.avatar-upload-panel--wizard .avatar-upload-panel__preview {
  align-self: center;
}

.avatar-upload-panel--wizard .avatar-upload-panel__body {
  align-items: center;
  width: 100%;
  text-align: center;
}

.avatar-upload-panel--wizard .avatar-upload-panel__hint {
  max-width: 150px;
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}

.avatar-upload-panel--wizard :deep(.ant-btn) {
  border-style: dashed;
}

.avatar-upload-panel--wizard .avatar-upload-panel__clear {
  height: auto;
  padding: 0;
  border-style: solid;
  line-height: 1.4;
}

.avatar-upload-panel__title {
  max-width: 100%;
  overflow: hidden;
  color: var(--color-text-base);
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar-upload-panel__hint {
  max-width: 100%;
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 480px) {
  .avatar-upload-panel {
    align-items: flex-start;
  }
}
</style>
