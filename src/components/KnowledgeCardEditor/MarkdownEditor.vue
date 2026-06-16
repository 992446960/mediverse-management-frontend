<template>
  <MdEditor
    v-model="content"
    :language="locale === 'zh-CN' ? 'zh-CN' : 'en-US'"
    :placeholder="placeholder"
    :style="{ height: '400px' }"
    :theme="editorTheme"
    :preview="false"
    :toolbars="toolbars"
    class="knowledge-card-markdown-editor"
  />
</template>

<script setup lang="ts">
import { MdEditor } from 'md-editor-v3'
import type { ToolbarNames } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/stores/theme'

const { locale } = useI18n()
const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)

defineProps<{
  placeholder?: string
}>()

const content = defineModel<string>({ default: '' })
const editorTheme = computed(() => (isDark.value ? 'dark' : 'light'))

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
