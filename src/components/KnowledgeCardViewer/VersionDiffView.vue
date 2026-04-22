<template>
  <div class="version-diff-view">
    <!-- 版本选择 + 对比 / 回退 -->
    <div class="flex items-center gap-3 flex-wrap" :class="diff.length > 0 ? 'mb-2' : 'mb-4'">
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
      <a-button danger size="small" :disabled="!canRollbackToTarget" @click="handleRollbackClick">
        <template #icon>
          <RollbackOutlined />
        </template>
        {{ t('knowledge.card.rollback') }}
      </a-button>
    </div>
    <!-- 默认固定分栏展示，单栏与 Radio 切换已停用
    <div v-if="diff.length > 0" class="flex justify-end mb-4">
      <a-radio-group v-model:value="viewMode" size="small">
        <a-radio-button value="unified">
          {{ t('knowledge.card.diffUnified') }}
        </a-radio-button>
        <a-radio-button value="split">
          {{ t('knowledge.card.diffSplit') }}
        </a-radio-button>
      </a-radio-group>
    </div>
    -->

    <a-spin :spinning="loading">
      <!-- 无数据提示 -->
      <a-empty v-if="!loading && diff.length === 0" :description="t('knowledge.card.diffNoData')" />

      <!-- 单栏 unified 已移除；与上方 Radio 一并恢复时，需恢复 script 内 viewMode -->

      <!-- 左右分栏（默认唯一展示方式） -->
      <div v-else class="diff-split grid grid-cols-2 gap-4">
        <div
          class="markdown-body p-4 bg-gray-50 rounded-lg overflow-auto max-h-[calc(100vh-320px)]"
        >
          <div class="text-xs text-gray-400 mb-2 font-medium">{{ fromVersionLabel }}</div>
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
          <div class="text-xs text-gray-400 mb-2 font-medium">{{ toVersionLabel }}</div>
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
import { Modal } from 'ant-design-vue'
import { RollbackOutlined } from '@ant-design/icons-vue'
import type { VersionDiffSegment, KnowledgeCardVersion } from '@/types/knowledge'
import { knowledgeCardVersionToNumeric } from '@/utils/knowledgeCardVersion'
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
  (e: 'rollback-to', versionLabel: string, targetVersion: number): void
}>()

/** 单栏/分栏切换已移除，固定分栏；原 viewMode 保留注释便于恢复 */
// const viewMode = ref<'unified' | 'split'>('split')
const localFrom = ref<number>(0)
const localTo = ref<number>(0)

function versionLabelForNumeric(n: number): string {
  const row = props.versions.find((v) => knowledgeCardVersionToNumeric(v.version) === n)
  return row?.version ?? `v${n}`
}

const fromVersionLabel = computed(() => versionLabelForNumeric(props.fromVersion))
const toVersionLabel = computed(() => versionLabelForNumeric(props.toVersion))

/** 同步外部传入的版本号到本地 Select */
watch(
  () => [props.fromVersion, props.toVersion],
  ([f, t]) => {
    localFrom.value = f ?? 0
    localTo.value = t ?? 0
  },
  { immediate: true }
)

const versionOptions = computed(() =>
  props.versions.map((v) => {
    const num = knowledgeCardVersionToNumeric(v.version) ?? 0
    return { label: v.version, value: num }
  })
)

/** from 和 to 必须不同且都已选择 */
const canCompare = computed(() => {
  return localFrom.value > 0 && localTo.value > 0 && localFrom.value !== localTo.value
})

/** 回退目标为右侧 to；仅当 to 无合法版本时禁用 */
const canRollbackToTarget = computed(() => {
  if (localTo.value <= 0) return false
  return props.versions.some((v) => knowledgeCardVersionToNumeric(v.version) === localTo.value)
})

function handleCompare() {
  if (!canCompare.value) return
  emit('change-versions', localFrom.value, localTo.value)
}

function handleRollbackClick() {
  if (!canRollbackToTarget.value) return
  const targetVersion = localTo.value
  const row = props.versions.find((v) => knowledgeCardVersionToNumeric(v.version) === targetVersion)
  const versionLabel = row?.version ?? `v${targetVersion}`
  Modal.confirm({
    title: t('knowledge.card.rollbackConfirmTitle'),
    content: t('knowledge.card.rollbackConfirmContent', { version: versionLabel }),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: () => {
      emit('rollback-to', versionLabel, targetVersion)
    },
  })
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
