<template>
  <a-result status="404" title="404" :sub-title="t('error.notFoundSubtitle')">
    <template #extra>
      <a-button type="primary" @click="$router.push('/')">{{ t('error.backHome') }}</a-button>
    </template>
  </a-result>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
