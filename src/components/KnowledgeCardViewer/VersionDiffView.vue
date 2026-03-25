<template>
  <div class="version-diff-view">
    <!-- 顶部版本选择器 + 对比按钮 + 视图切换 -->
    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <a-select
        v-model:value="localFrom"
        :options="versionOptions"
        style="width: 160px"
        :placeholder="t('knowledge.card.diffFromLabel')"
      />
      <span class="text-gray-400">→</span>
      <a-select
        v-model:value="localTo"
        :options="versionOptions"
        style="width: 160px"
        :placeholder="t('knowledge.card.diffToLabel')"
      />
      <a-button type="primary" size="small" :disabled="!canCompare" @click="handleCompare">
        {{ t('knowledge.card.compare') }}
      </a-button>
      <a-radio-group v-model:value="viewMode" size="small" class="ml-auto">
        <a-radio-button value="unified">
          {{ t('knowledge.card.diffUnified') }}
        </a-radio-button>
        <a-radio-button value="split">
          {{ t('knowledge.card.diffSplit') }}
        </a-radio-button>
      </a-radio-group>
    </div>

    <a-spin :spinning="loading">
      <!-- 无数据提示 -->
      <a-empty v-if="!loading && diff.length === 0" :description="t('knowledge.card.diffNoData')" />

      <!-- 单栏模式 -->
      <div
        v-else-if="viewMode === 'unified'"
        class="diff-unified markdown-body p-4 bg-gray-50 rounded-lg overflow-auto max-h-[calc(100vh-320px)]"
      >
        <template v-for="(seg, i) in diff" :key="i">
          <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
          <span
            v-if="seg.type === 'equal'"
            class="diff-equal"
            v-html="renderSegment(seg.content)"
          ></span>
          <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
          <span
            v-else-if="seg.type === 'delete'"
            class="diff-delete"
            v-html="renderSegment(seg.content)"
          ></span>
          <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
          <span
            v-else-if="seg.type === 'insert'"
            class="diff-insert"
            v-html="renderSegment(seg.content)"
          ></span>
        </template>
      </div>

      <!-- 左右分栏模式 -->
      <div v-else class="diff-split grid grid-cols-2 gap-4">
        <div
          class="markdown-body p-4 bg-gray-50 rounded-lg overflow-auto max-h-[calc(100vh-320px)]"
        >
          <div class="text-xs text-gray-400 mb-2 font-medium">v{{ fromVersion }}</div>
          <template v-for="(seg, i) in diff" :key="'l-' + i">
            <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
            <span
              v-if="seg.type === 'equal'"
              class="diff-equal"
              v-html="renderSegment(seg.content)"
            ></span>
            <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
            <span
              v-else-if="seg.type === 'delete'"
              class="diff-delete"
              v-html="renderSegment(seg.content)"
            ></span>
          </template>
        </div>
        <div
          class="markdown-body p-4 bg-gray-50 rounded-lg overflow-auto max-h-[calc(100vh-320px)]"
        >
          <div class="text-xs text-gray-400 mb-2 font-medium">v{{ toVersion }}</div>
          <template v-for="(seg, i) in diff" :key="'r-' + i">
            <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
            <span
              v-if="seg.type === 'equal'"
              class="diff-equal"
              v-html="renderSegment(seg.content)"
            ></span>
            <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
            <span
              v-else-if="seg.type === 'insert'"
              class="diff-insert"
              v-html="renderSegment(seg.content)"
            ></span>
          </template>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { VersionDiffSegment, KnowledgeCardVersion } from '@/types/knowledge'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const { t } = useI18n()

const props = defineProps<{
  diff: VersionDiffSegment[]
  fromVersion: number
  toVersion: number
  versions: KnowledgeCardVersion[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'change-versions', fromVersion: number, toVersion: number): void
}>()

const viewMode = ref<'unified' | 'split'>('unified')
const localFrom = ref<number>(0)
const localTo = ref<number>(0)

/** 同步外部传入的版本号到本地 Select */
watch(
  () => [props.fromVersion, props.toVersion],
  ([f, t]) => {
    localFrom.value = f
    localTo.value = t
  },
  { immediate: true }
)

const versionOptions = computed(() =>
  props.versions.map((v) => {
    const m = v.version.match(/(\d+)/)
    const num = m ? Number(m[1]) : 0
    return { label: v.version, value: num }
  })
)

/** from 和 to 必须不同且都已选择 */
const canCompare = computed(() => {
  return localFrom.value > 0 && localTo.value > 0 && localFrom.value !== localTo.value
})

function handleCompare() {
  if (!canCompare.value) return
  emit('change-versions', localFrom.value, localTo.value)
}

/** 将 Markdown 片段渲染为安全 HTML */
function renderSegment(content: string): string {
  const html = marked.parse(content) as string
  return DOMPurify.sanitize(html)
}
</script>

<style scoped>
.diff-equal {
  display: inline;
}
.diff-delete {
  background-color: #fdd;
  text-decoration: line-through;
  display: inline;
  color: var(--color-error);
}
.diff-insert {
  background-color: #dfd;
  display: inline;
  color: var(--color-success);
}
</style>
