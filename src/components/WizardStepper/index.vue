<template>
  <nav class="wizard-stepper" :aria-label="ariaLabel">
    <ol class="wizard-stepper__list">
      <li v-for="(step, index) in steps" :key="step.key" class="wizard-stepper__item">
        <div class="wizard-stepper__node">
          <span
            class="wizard-stepper__circle"
            :class="{
              'wizard-stepper__circle--done': index < current,
              'wizard-stepper__circle--current': index === current,
              'wizard-stepper__circle--pending': index > current,
            }"
            :aria-current="index === current ? 'step' : undefined"
          >
            <CheckOutlined v-if="index < current" class="wizard-stepper__check" />
            <span v-else>{{ index + 1 }}</span>
          </span>
          <span
            class="wizard-stepper__label"
            :class="{ 'wizard-stepper__label--current': index === current }"
            :title="step.title"
          >
            {{ step.title }}
          </span>
        </div>
        <span
          v-if="index < steps.length - 1"
          class="wizard-stepper__line"
          :class="{ 'wizard-stepper__line--done': index < current }"
          aria-hidden="true"
        />
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { CheckOutlined } from '@ant-design/icons-vue'

export interface WizardStep {
  key: string
  title: string
}

withDefaults(
  defineProps<{
    steps: WizardStep[]
    current: number
    ariaLabel?: string
  }>(),
  {
    ariaLabel: 'Wizard progress',
  }
)
</script>

<style scoped lang="scss">
.wizard-stepper {
  min-width: 0;
}

.wizard-stepper__list {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0;
  margin: 0;
  list-style: none;
}

.wizard-stepper__item {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  min-width: 0;
}

.wizard-stepper__item:last-child {
  flex: 0 0 auto;
}

.wizard-stepper__node {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: var(--spacing-xs);
}

.wizard-stepper__circle {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.wizard-stepper__circle--done {
  color: var(--color-primary);
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
  background: var(--color-primary-50);
}

.wizard-stepper__circle--current {
  color: #fff;
  background: var(--color-primary);
}

.wizard-stepper__circle--pending {
  color: var(--color-text-tertiary);
  border: 1px solid var(--color-border);
  background: var(--color-bg-layout);
}

.wizard-stepper__check {
  font-size: 1rem;
}

.wizard-stepper__label {
  min-width: 0;
  max-width: 8em;
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wizard-stepper__label--current {
  color: var(--color-text-base);
  font-weight: 600;
}

.wizard-stepper__line {
  flex: 1 1 24px;
  min-width: 16px;
  height: 1px;
  margin: 0 var(--spacing-sm);
  background: var(--color-border-secondary);
}

.wizard-stepper__line--done {
  background: var(--color-primary);
}

@media (max-width: 640px) {
  .wizard-stepper__list {
    align-items: flex-start;
  }

  .wizard-stepper__node {
    flex-direction: column;
    gap: 4px;
  }

  .wizard-stepper__label {
    max-width: 5.5em;
    font-size: 0.75rem;
  }

  .wizard-stepper__line {
    margin-top: 16px;
  }
}
</style>
