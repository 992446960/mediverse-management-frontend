<template>
  <div class="identity-summary">
    <a-avatar :src="avatarUrl || undefined" :size="56" class="identity-summary__avatar">
      <template #icon>
        <UserOutlined />
      </template>
    </a-avatar>

    <div class="identity-summary__content">
      <div class="identity-summary__header">
        <div class="identity-summary__name">{{ name }}</div>
        <a-tag v-if="statusText" :color="statusColor" class="identity-summary__status">
          {{ statusText }}
        </a-tag>
      </div>
      <div v-if="scope" class="identity-summary__scope" :title="scope">{{ scope }}</div>
      <a-space v-if="tags.length > 0" :size="[4, 4]" wrap class="identity-summary__tags">
        <a-tag v-for="tag in tags" :key="tag">{{ tag }}</a-tag>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserOutlined } from '@ant-design/icons-vue'

withDefaults(
  defineProps<{
    avatarUrl?: string
    name: string
    scope?: string
    statusText?: string
    statusColor?: string
    tags?: string[]
  }>(),
  {
    avatarUrl: '',
    scope: '',
    statusText: '',
    statusColor: 'success',
    tags: () => [],
  }
)
</script>

<style scoped lang="scss">
.identity-summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 0;
}

.identity-summary__avatar {
  flex-shrink: 0;
  color: var(--color-primary);
  background: var(--color-primary-50);
  border: 1px solid var(--color-border-secondary);
}

.identity-summary__content {
  flex: 1;
  min-width: 0;
}

.identity-summary__header {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--spacing-sm);
}

.identity-summary__name {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-base);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-summary__status {
  flex-shrink: 0;
  margin-inline-end: 0;
}

.identity-summary__scope {
  margin-top: var(--spacing-xs);
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-summary__tags {
  margin-top: var(--spacing-sm);
}
</style>
