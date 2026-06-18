<template>
  <a-result status="403" title="401" :sub-title="t('error.unauthorizedSubtitle')">
    <template #extra>
      <a-space>
        <a-button v-if="!noGoBack" @click="$router.go(-1)">
          {{ t('error.goBack') }}
        </a-button>
        <a-button type="primary" @click="$router.push('/login')">
          {{ t('error.goToLogin') }}
        </a-button>
      </a-space>
    </template>
  </a-result>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const noGoBack = computed(() => route.query.noGoBack === '1')
</script>
