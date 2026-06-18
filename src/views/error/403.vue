<template>
  <a-result status="403" title="403" :sub-title="t('error.forbiddenSubtitle')">
    <template #extra>
      <a-button type="primary" @click="$router.push('/')">{{ t('error.backHome') }}</a-button>
    </template>
  </a-result>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
