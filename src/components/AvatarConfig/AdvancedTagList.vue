<template>
  <div class="advanced-tag-list" :class="`advanced-tag-list--${tone}`">
    <span v-for="item in items" :key="item.name" class="advanced-tag-list__pill">
      <span class="advanced-tag-list__text" :title="item.label || item.name">
        {{ item.label || item.name }}
      </span>
      <span
        class="advanced-tag-list__remove"
        role="button"
        tabindex="0"
        :aria-label="t('common.delete')"
        @click="emit('remove', item.name)"
        @keydown.enter.prevent="emit('remove', item.name)"
        @keydown.space.prevent="emit('remove', item.name)"
      >
        <CloseOutlined class="advanced-tag-list__remove-icon" />
      </span>
    </span>

    <button
      v-if="showAdd"
      type="button"
      class="advanced-tag-list__add"
      @click.stop.prevent="emit('add')"
    >
      <PlusOutlined class="advanced-tag-list__add-icon" />
      <span>{{ addText }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { CloseOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    items: Array<{
      name: string
      label?: string
    }>
    tone: 'tools' | 'skills'
    addText: string
    showAdd?: boolean
  }>(),
  {
    showAdd: true,
  }
)

const emit = defineEmits<{
  add: []
  remove: [name: string]
}>()

const { t } = useI18n()
</script>

<style scoped lang="scss">
.advanced-tag-list {
  --advanced-tag-color: var(--color-primary);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 32px;
}

.advanced-tag-list--tools {
  --advanced-tag-color: var(--color-primary);
}

.advanced-tag-list--skills {
  --advanced-tag-color: #10b981;
}

.advanced-tag-list__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: min(100%, 148px);
  height: 28px;
  padding: 0 8px 0 12px;
  color: var(--advanced-tag-color);
  font-size: 12px;
  line-height: 1;
  border: 1px solid color-mix(in srgb, var(--advanced-tag-color) 42%, transparent);
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--advanced-tag-color) 13%, transparent);
}

.advanced-tag-list__text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.advanced-tag-list__remove {
  display: inline-flex;
  flex: 0 0 14px;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  color: var(--advanced-tag-color);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.advanced-tag-list__remove:hover {
  background: color-mix(in srgb, var(--advanced-tag-color) 16%, transparent);
}

.advanced-tag-list__remove:focus-visible,
.advanced-tag-list__add:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.advanced-tag-list__remove-icon {
  font-size: 10px;
}

.advanced-tag-list__add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 12px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-full);
  background: transparent;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.advanced-tag-list__add:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-text-tertiary);
}

.advanced-tag-list__add-icon {
  color: inherit;
  font-size: 12px;
}
</style>
