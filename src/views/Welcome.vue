<template>
  <div class="welcome-page flex flex-1">
    <div class="welcome-layout">
      <section class="welcome-hero">
        <div class="welcome-hero__main">
          <div class="welcome-hero__brand">
            <span class="welcome-hero__logo-wrap">
              <img class="welcome-hero__logo" :src="logoUrl" :alt="brandName" />
            </span>
            <div>
              <p class="welcome-hero__org">{{ t('welcome.orgName') }}</p>
              <h1 class="welcome-hero__title">
                {{ t('welcome.title', { brand: brandName }) }}
              </h1>
            </div>
          </div>

          <p class="welcome-hero__subtitle">{{ t('welcome.subtitle') }}</p>
        </div>

        <div class="welcome-hero__footer">
          <div>
            <span class="welcome-hero__status-dot" />
            <span class="welcome-hero__status">{{ t('welcome.statusTitle') }}</span>
          </div>
          <strong>Mediverse Management</strong>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import logoUrl from '@/assets/images/logo.svg'

const { t } = useI18n()

const brandName = computed(() => t('app.brandName'))
</script>

<style scoped>
.welcome-page {
  min-height: 0;
  padding: 20px;
  background: var(--color-bg-layout);
}

.welcome-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.welcome-hero {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 520px;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: clamp(32px, 5vw, 64px);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.welcome-hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background:
    linear-gradient(90deg, rgba(14, 165, 233, 0.08) 1px, transparent 1px),
    linear-gradient(0deg, rgba(14, 165, 233, 0.06) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.55;
  pointer-events: none;
}

.welcome-hero::after {
  position: absolute;
  top: 0;
  right: 0;
  width: 42%;
  height: 6px;
  content: '';
  background: var(--color-primary);
}

.welcome-hero__main,
.welcome-hero__footer {
  position: relative;
}

.welcome-hero__brand {
  display: flex;
  align-items: center;
  gap: 22px;
  min-width: 0;
}

.welcome-hero__logo-wrap {
  display: inline-flex;
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(14, 165, 233, 0.22);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.86);
}

.welcome-hero__logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.welcome-hero__org {
  margin: 0 0 8px;
  color: var(--color-text-secondary);
  font-size: 15px;
  line-height: 1.4;
}

.welcome-hero__title {
  margin: 0;
  color: var(--color-text-base);
  font-size: clamp(30px, 3vw, 38px);
  font-weight: 700;
  line-height: 1.2;
}

.welcome-hero__subtitle {
  max-width: 680px;
  margin: 34px 0 0;
  color: var(--color-text-secondary);
  font-size: 15px;
  line-height: 1.8;
}

.welcome-hero__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.welcome-hero__footer strong {
  color: var(--color-text-base);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.welcome-hero__status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 8px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.12);
}

@media (max-width: 1120px) {
  .welcome-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .welcome-page {
    padding: 12px;
  }

  .welcome-hero {
    min-height: 360px;
    padding: 28px;
  }

  .welcome-hero__brand {
    align-items: flex-start;
  }
}
</style>
