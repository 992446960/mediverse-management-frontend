<template>
  <div class="avatar-upload-panel">
    <div class="avatar-upload-panel__preview">
      <a-avatar :src="imageUrl || undefined" :size="72" class="avatar-upload-panel__avatar">
        <template #icon>
          <UserOutlined />
        </template>
      </a-avatar>
    </div>

    <div class="avatar-upload-panel__body">
      <div class="avatar-upload-panel__title">{{ title }}</div>
      <div v-if="hint" class="avatar-upload-panel__hint">{{ hint }}</div>
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
  }>(),
  {
    imageUrl: '',
    hint: '',
    loading: false,
    disabled: false,
  }
)

const emit = defineEmits<{
  upload: []
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
