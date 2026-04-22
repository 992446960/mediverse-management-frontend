<template>
  <div class="universal-preview-page flex min-h-screen w-full flex-col">
    <UniversalFilePreview v-if="ready" :file-url="decodedUrl" :file-name="decodedName" />
    <div v-else class="flex min-h-screen w-full items-center justify-center p-6">
      <a-empty :description="emptyDescription" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { LocationQueryValue } from 'vue-router'
import UniversalFilePreview from '@/components/UniversalFilePreview/index.vue'
import { isAllowedPreviewUrl } from '@/utils/fileType'

const { t } = useI18n()
const route = useRoute()

function singleQuery(v: LocationQueryValue | LocationQueryValue[] | undefined): string | undefined {
  if (v == null) return undefined
  return Array.isArray(v) ? (v[0] ?? undefined) : v
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

const decodedUrl = computed(() => {
  const raw = singleQuery(route.query.url)
  if (!raw) return ''
  return safeDecode(raw)
})

const decodedName = computed(() => {
  const raw = singleQuery(route.query.name)
  if (!raw) return undefined
  return safeDecode(raw)
})

const ready = computed(() => {
  if (!decodedUrl.value) return false
  return isAllowedPreviewUrl(decodedUrl.value)
})

const emptyDescription = computed(() => {
  if (!decodedUrl.value) return t('knowledge.missingFileUrl')
  return t('knowledge.previewNoUrlHint')
})
</script>

<style scoped>
.universal-preview-page {
  align-self: stretch;
  height: 100vh;
  background-color: var(--color-bg-layout);
}
</style>
