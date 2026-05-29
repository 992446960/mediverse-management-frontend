<template>
  <div class="step-type">
    <div class="step-type__grid">
      <label
        v-for="opt in allowedTypeOptions"
        :key="opt.value"
        class="step-type__option"
        :class="{ 'step-type__option--selected': modelValue.type === opt.value }"
      >
        <input
          type="radio"
          :value="opt.value"
          :checked="modelValue.type === opt.value"
          class="step-type__input"
          :aria-label="t(opt.titleKey)"
          @change="emit('update:modelValue', { ...modelValue, type: opt.value })"
        />
        <div class="step-type__card">
          <div class="step-type__icon" :class="`step-type__icon--${opt.value}`" aria-hidden="true">
            <component :is="TYPE_ICON_MAP[opt.value]" />
          </div>
          <div class="step-type__content">
            <h3 class="step-type__title">{{ t(opt.titleKey) }}</h3>
            <p class="step-type__description">{{ t(opt.detailKey) }}</p>
          </div>
          <div class="step-type__radio" aria-hidden="true">
            <span v-if="modelValue.type === opt.value" />
          </div>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { ApartmentOutlined, BankOutlined, UserOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import { useAvatarCreatePermission } from '@/composables/useAvatarCreatePermission'
import type { AvatarWizardForm, AvatarType } from '@/types/avatar'

const { t } = useI18n()
const { allowedTypeOptions, isTypeAllowed } = useAvatarCreatePermission()

const TYPE_ICON_MAP: Record<AvatarType, Component> = {
  general: BankOutlined,
  specialist: ApartmentOutlined,
  expert: UserOutlined,
}

const props = defineProps<{
  modelValue: AvatarWizardForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AvatarWizardForm]
}>()

// 科室管理员打开时，若当前选中 general 则自动重置为第一个允许的类型
watch(
  () => [props.modelValue.type, allowedTypeOptions.value] as const,
  ([type, opts]) => {
    if (type && opts.length && !isTypeAllowed(type as AvatarType)) {
      const first = opts[0]
      if (first) {
        emit('update:modelValue', { ...props.modelValue, type: first.value })
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.step-type__grid {
  display: grid;
  gap: 16px;
}

.step-type__option {
  display: block;
  cursor: pointer;
}

.step-type__input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.step-type__card {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 112px;
  gap: 22px;
  padding: 20px 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-container);
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast);
}

.step-type__option:hover .step-type__card,
.step-type__option--selected .step-type__card {
  border-color: var(--color-primary);
}

.step-type__option--selected .step-type__card {
  background: color-mix(in srgb, var(--color-primary) 7%, var(--color-bg-container));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.step-type__input:focus-visible + .step-type__card {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.step-type__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  color: var(--type-icon-color);
  background: var(--type-icon-bg);
  font-size: 1.75rem;
}

.step-type__icon--general {
  --type-icon-color: #6157ff;
  --type-icon-bg: color-mix(in srgb, #6157ff 16%, transparent);
}

.step-type__icon--specialist {
  --type-icon-color: #14b8b2;
  --type-icon-bg: color-mix(in srgb, #14b8b2 16%, transparent);
}

.step-type__icon--expert {
  --type-icon-color: #0ea5e9;
  --type-icon-bg: color-mix(in srgb, #0ea5e9 16%, transparent);
}

.step-type__radio {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: auto;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-container);
}

.step-type__option--selected .step-type__radio {
  border-color: var(--color-primary);
}

.step-type__radio span {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
}

.step-type__content {
  flex: 1 1 auto;
  min-width: 0;
}

.step-type__title {
  margin: 0;
  color: var(--color-text-base);
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.5;
}

.step-type__description {
  margin: var(--spacing-xs) 0 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
  word-break: break-word;
}
</style>
