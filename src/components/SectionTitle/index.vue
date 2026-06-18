<template>
  <div class="section-title">
    <span class="section-title__accent" />
    <div class="section-title__content">
      <h3 class="section-title__text">{{ title }}</h3>
      <p v-if="description" class="section-title__description">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style scoped lang="scss">
.section-title {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  min-width: 0;
}

.section-title__accent {
  flex-shrink: 0;
  width: 3px;
  height: 1rem;
  margin-top: 0.1875rem;
  background: var(--color-primary);
  border-radius: var(--radius-full);
}

.section-title__content {
  min-width: 0;
}

.section-title__text {
  margin: 0;
  color: var(--color-text-base);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
}

.section-title__description {
  margin: var(--spacing-xs) 0 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
}
</style>
