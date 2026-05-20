<template>
  <div class="version-diff-view">
    <!-- 版本选择 + 对比 / 回退 -->
    <div
      class="flex items-center gap-3 flex-wrap"
      :class="displayedDiff.length > 0 ? 'mb-2' : 'mb-4'"
    >
      <a-select
        v-model:value="localFrom"
        :options="versionOptions"
        style="width: 160px"
        :placeholder="t('knowledge.card.diffFromLabel')"
      />
      <span class="text-gray-400">vs</span>
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
      <a-radio-group
        v-if="displayedDiff.length > 0"
        v-model:value="viewMode"
        size="small"
        class="ml-auto"
      >
        <a-radio-button value="unified">
          {{ t('knowledge.card.diffUnified') }}
        </a-radio-button>
        <a-radio-button value="split">
          {{ t('knowledge.card.diffSplit') }}
        </a-radio-button>
      </a-radio-group>
    </div>

    <a-spin :spinning="loading">
      <a-empty
        v-if="!loading && displayedDiff.length === 0"
        :description="t('knowledge.card.diffNoData')"
      />

      <!-- 单栏 unified：所有 segment 按顺序渲染在一个块中 -->
      <div
        v-else-if="viewMode === 'unified'"
        class="markdown-body p-4 bg-gray-50 rounded-lg overflow-auto max-h-[calc(100vh-320px)]"
      >
        <div class="text-xs text-gray-400 mb-2 font-medium">
          {{ fromVersionLabel }} vs {{ toVersionLabel }}
        </div>
        <template v-for="(seg, i) in displayedDiff" :key="'u-' + i">
          <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
          <span
            v-if="seg.type === 'equal'"
            class="diff-equal"
            v-html="renderSegment(seg.md_content)"
          ></span>
          <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
          <span
            v-else-if="seg.type === 'delete'"
            class="diff-delete"
            v-html="renderSegment(seg.md_content)"
          ></span>
          <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
          <span
            v-else-if="seg.type === 'insert'"
            class="diff-insert"
            v-html="renderSegment(seg.md_content)"
          ></span>
        </template>
      </div>

      <!-- 左右分栏：左=from（旧版本），右=to（新版本） -->
      <div v-else class="diff-split grid grid-cols-2 gap-4">
        <div
          class="markdown-body p-4 bg-gray-50 rounded-lg overflow-auto max-h-[calc(100vh-320px)]"
        >
          <div class="text-xs text-gray-400 mb-2 font-medium">{{ fromVersionLabel }}</div>
          <template v-for="(seg, i) in displayedDiff" :key="'l-' + i">
            <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
            <span
              v-if="seg.type === 'equal'"
              class="diff-equal"
              v-html="renderSegment(seg.md_content)"
            ></span>
            <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
            <span
              v-else-if="seg.type === 'delete'"
              class="diff-delete"
              v-html="renderSegment(seg.md_content)"
            ></span>
          </template>
        </div>
        <div
          class="markdown-body p-4 bg-gray-50 rounded-lg overflow-auto max-h-[calc(100vh-320px)]"
        >
          <div class="text-xs text-gray-400 mb-2 font-medium">{{ toVersionLabel }}</div>
          <template v-for="(seg, i) in displayedDiff" :key="'r-' + i">
            <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
            <span
              v-if="seg.type === 'equal'"
              class="diff-equal"
              v-html="renderSegment(seg.md_content)"
            ></span>
            <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
            <span
              v-else-if="seg.type === 'insert'"
              class="diff-insert"
              v-html="renderSegment(seg.md_content)"
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
import {
  buildKnowledgeCardVersionOptions,
  canCompareKnowledgeCardVersions,
  canRollbackKnowledgeCardVersion,
  isKnowledgeCardDiffSelectionApplied,
  resolveKnowledgeCardVersionKey,
} from '@/utils/knowledgeCardVersion'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const { t } = useI18n()

const props = defineProps<{
  diff: VersionDiffSegment[]
  fromVersion: number
  toVersion: number
  versions: KnowledgeCardVersion[]
  currentVersionKey: number | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'change-versions', fromVersion: number, toVersion: number): void
  (e: 'rollback-to', versionLabel: string, targetVersion: number): void
}>()

const viewMode = ref<'unified' | 'split'>('unified')
const localFrom = ref<number>(0)
const localTo = ref<number>(0)

function versionLabelForNumeric(n: number): string {
  const row = props.versions.find((v) => resolveKnowledgeCardVersionKey(v) === n)
  return row?.version ?? `v${n}`
}

const fromVersionLabel = computed(() => versionLabelForNumeric(props.fromVersion))
const toVersionLabel = computed(() => versionLabelForNumeric(props.toVersion))

watch(
  () => [props.fromVersion, props.toVersion],
  ([f, t]) => {
    localFrom.value = f ?? 0
    localTo.value = t ?? 0
  },
  { immediate: true }
)

const versionOptions = computed(() =>
  buildKnowledgeCardVersionOptions(props.versions).map(({ label, value }) => ({ label, value }))
)
const validVersionKeys = computed(() => versionOptions.value.map((option) => option.value))
const isAppliedSelection = computed(() =>
  isKnowledgeCardDiffSelectionApplied(
    props.fromVersion,
    props.toVersion,
    localFrom.value,
    localTo.value
  )
)
const displayedDiff = computed(() => (isAppliedSelection.value ? props.diff : []))

const canCompare = computed(() => {
  return canCompareKnowledgeCardVersions(localFrom.value, localTo.value, validVersionKeys.value)
})

const canRollbackToTarget = computed(() => {
  return (
    isAppliedSelection.value &&
    canRollbackKnowledgeCardVersion(
      localTo.value,
      props.currentVersionKey,
      validVersionKeys.value,
      localFrom.value
    )
  )
})

function handleCompare() {
  if (!canCompare.value) return
  const f = localFrom.value
  const t = localTo.value
  if (f > t) {
    localFrom.value = t
    localTo.value = f
    emit('change-versions', t, f)
  } else {
    emit('change-versions', f, t)
  }
}

function handleRollbackClick() {
  if (!canRollbackToTarget.value) return
  const targetVersion = localTo.value
  const row = props.versions.find((v) => resolveKnowledgeCardVersionKey(v) === targetVersion)
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

function renderSegment(content: string): string {
  if (!content) return ''
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
