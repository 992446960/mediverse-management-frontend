<template>
  <div class="json-content-pane">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-500">{{ t('knowledge.card.jsonPane') }}</span>
      <a-button v-if="hasJsonContent" size="small" type="text" @click="handleCopy">
        <template #icon><CopyOutlined /></template>
        {{ t('knowledge.card.copyJson') }}
      </a-button>
    </div>
    <div
      class="json-content-pane__body p-4 bg-gray-50 rounded-lg min-h-[200px] h-[min(480px,calc(100vh-240px))] overflow-y-auto"
    >
      <vue-json-pretty
        v-if="parsedData !== null"
        :data="parsedData"
        :deep="3"
        :show-line="false"
        show-double-quotes
      />
      <a-empty
        v-else
        :description="t('knowledge.card.jsonEmpty')"
        :image="Empty.PRESENTED_IMAGE_SIMPLE"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message, Empty } from 'ant-design-vue'
import { CopyOutlined } from '@ant-design/icons-vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

const { t } = useI18n()

const props = defineProps<{
  jsonContent: string
}>()

const parsedData = computed(() => {
  if (!props.jsonContent || props.jsonContent.trim() === '') return null
  try {
    return JSON.parse(props.jsonContent)
  } catch {
    return null
  }
})

const hasJsonContent = computed(() => parsedData.value !== null)

function handleCopy() {
  if (!hasJsonContent.value) return
  const text = props.jsonContent || '{}'
  navigator.clipboard.writeText(text).then(() => {
    message.success(t('common.copied'))
  })
}
</script>

<style scoped lang="scss">
.json-content-pane__body {
  display: flex;
  flex-direction: column;
}

.json-content-pane__body :deep(.ant-empty) {
  margin: auto;
}
</style>
