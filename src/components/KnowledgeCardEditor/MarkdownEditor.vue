<template>
  <MdEditor
    v-model="content"
    :language="locale === 'zh-CN' ? 'zh-CN' : 'en-US'"
    :placeholder="placeholder"
    :style="{ height: '400px' }"
    :preview="false"
    :toolbars="toolbars"
  />
</template>

<script setup lang="ts">
import { MdEditor } from 'md-editor-v3'
import type { ToolbarNames } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

defineProps<{
  placeholder?: string
}>()

const content = defineModel<string>({ default: '' })

const toolbars: ToolbarNames[] = [
  'bold',
  'italic',
  'strikeThrough',
  '-',
  'title',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'quote',
  '-',
  'table',
  'link',
]
</script>
