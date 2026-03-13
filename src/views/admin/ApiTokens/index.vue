<template>
  <div class="flex items-center justify-center h-full py-20">
    <a-result
      status="info"
      :title="t('common.featureInDevelopment')"
      :sub-title="t('common.featureInDevelopmentDesc')"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
