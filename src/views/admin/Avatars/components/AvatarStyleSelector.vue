<template>
  <a-radio-group :value="modelValue" class="avatar-style-selector" @update:value="onChange">
    <a-radio
      v-for="styleOpt in styleOptions"
      :key="styleOpt.value"
      :value="styleOpt.value"
      class="avatar-style-selector__card"
      :class="[
        `avatar-style-selector__card--${styleOpt.value}`,
        { 'avatar-style-selector__card--selected': modelValue === styleOpt.value },
      ]"
    >
      <span class="avatar-style-selector__content">
        <span class="avatar-style-selector__icon-wrap">
          <component :is="styleOpt.icon" class="avatar-style-selector__icon" />
        </span>
        <span class="avatar-style-selector__title">{{ t(styleOpt.labelKey) }}</span>
        <span class="avatar-style-selector__desc">{{ t(styleOpt.descriptionKey) }}</span>
      </span>
    </a-radio>
  </a-radio-group>
</template>

<script setup lang="ts">
import {
  FileTextOutlined,
  MessageOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import type { Component } from 'vue'
import type { AvatarStyle } from '@/types/avatar'

defineProps<{
  modelValue: AvatarStyle
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AvatarStyle]
}>()

const { t } = useI18n()

const styleOptions = [
  {
    value: 'formal',
    labelKey: 'avatar.wizard.styleFormal',
    descriptionKey: 'avatar.wizard.styleFormalDesc',
    icon: UserOutlined,
  },
  {
    value: 'friendly',
    labelKey: 'avatar.wizard.styleFriendly',
    descriptionKey: 'avatar.wizard.styleFriendlyDesc',
    icon: MessageOutlined,
  },
  {
    value: 'concise',
    labelKey: 'avatar.wizard.styleConcise',
    descriptionKey: 'avatar.wizard.styleConciseDesc',
    icon: ThunderboltOutlined,
  },
  {
    value: 'detailed',
    labelKey: 'avatar.wizard.styleDetailed',
    descriptionKey: 'avatar.wizard.styleDetailedDesc',
    icon: FileTextOutlined,
  },
  {
    value: 'custom',
    labelKey: 'avatar.wizard.styleCustom',
    descriptionKey: 'avatar.wizard.styleCustomDesc',
    icon: SettingOutlined,
  },
] satisfies { value: AvatarStyle; labelKey: string; descriptionKey: string; icon: Component }[]

function onChange(value: AvatarStyle) {
  emit('update:modelValue', value)
}
</script>

<style scoped lang="scss">
.avatar-style-selector {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--spacing-md);
  width: 100%;
}

.avatar-style-selector__card {
  --style-color: var(--color-primary);
  position: relative;
  display: flex;
  min-height: 128px;
  align-items: stretch;
  justify-content: center;
  margin-inline-end: 0;
  padding: 16px 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    color var(--transition-fast);
}

.avatar-style-selector__card:hover,
.avatar-style-selector__card--selected {
  border-color: var(--style-color);
  background: color-mix(in srgb, var(--style-color) 10%, var(--color-bg-container));
}

.avatar-style-selector__card--selected {
  color: var(--style-color);
}

.avatar-style-selector__card--formal {
  --style-color: var(--color-primary);
}

.avatar-style-selector__card--friendly {
  --style-color: #10b981;
}

.avatar-style-selector__card--concise {
  --style-color: #f59e0b;
}

.avatar-style-selector__card--detailed {
  --style-color: #7c3aed;
}

.avatar-style-selector__card--custom {
  --style-color: #64748b;
}

.avatar-style-selector__card :deep(.ant-radio) {
  position: absolute;
  top: 14px;
  left: 14px;
  margin: 0;
}

.avatar-style-selector__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
  gap: 6px;
  color: inherit;
  font-size: 0.875rem;
  text-align: center;
}

.avatar-style-selector__icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  color: var(--style-color);
  background: color-mix(in srgb, var(--style-color) 16%, transparent);
  font-size: 1.375rem;
}

.avatar-style-selector__icon {
  flex-shrink: 0;
}

.avatar-style-selector__title {
  color: var(--color-text-base);
  font-weight: 600;
  line-height: 1.4;
}

.avatar-style-selector__desc {
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  line-height: 1.45;
}

@media (max-width: 768px) {
  .avatar-style-selector {
    grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  }
}
</style>
