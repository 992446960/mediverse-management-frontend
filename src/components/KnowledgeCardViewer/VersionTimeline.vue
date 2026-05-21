<template>
  <div
    class="version-timeline p-4 max-h-[min(480px,calc(100vh-280px))] overflow-y-auto overflow-x-hidden"
  >
    <a-timeline>
      <a-timeline-item v-for="v in versions" :key="v.version">
        <template #dot>
          <HistoryOutlined style="font-size: 16px" />
        </template>
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <a-space>
              <span class="font-bold text-gray-800">{{ v.version }}</span>
              <a-tag v-if="isCurrentVersion(v)" color="blue">
                {{ t('knowledge.card.currentVersion') }}
              </a-tag>
            </a-space>
            <span class="text-xs text-gray-400">{{
              dayjs(v.created_at).format('YYYY-MM-DD HH:mm')
            }}</span>
          </div>
          <p class="text-sm text-gray-600 mb-2">{{ v.summary }}</p>
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>{{ t('knowledge.card.operator') }}: {{ v.created_by_name }}</span>
            <a-space>
              <a-button
                v-if="canCompareVersion(v)"
                type="link"
                size="small"
                @click="handleCompare(v)"
              >
                <template #icon><SwapOutlined /></template>
                {{ t('knowledge.card.compare') }}
              </a-button>
              <a-button
                v-if="canRollbackVersion(v)"
                type="link"
                size="small"
                danger
                @click="handleRollback(v)"
              >
                <template #icon><RollbackOutlined /></template>
                {{ t('knowledge.card.rollback') }}
              </a-button>
            </a-space>
          </div>
        </div>
      </a-timeline-item>
    </a-timeline>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import { Modal, Textarea as ATextarea, message } from 'ant-design-vue'
import { HistoryOutlined, RollbackOutlined, SwapOutlined } from '@ant-design/icons-vue'
import type { KnowledgeCardVersion } from '@/types/knowledge'
import {
  buildKnowledgeCardVersionOptions,
  canRollbackKnowledgeCardVersion,
  findKnowledgeCardCompareTarget,
  isKnowledgeCardCurrentVersion,
  resolveKnowledgeCardVersionKey,
} from '@/utils/knowledgeCardVersion'
import dayjs from 'dayjs'

const { t } = useI18n()

const props = defineProps<{
  versions: KnowledgeCardVersion[]
  currentVersionKey: number | null
}>()

const emit = defineEmits<{
  (e: 'compare', fromVersion: number, toVersion: number): void
  (e: 'rollback', version: string, targetVersion: number, reason?: string): void
}>()

const validVersionKeys = computed(() =>
  buildKnowledgeCardVersionOptions(props.versions).map((option) => option.value)
)

function isCurrentVersion(v: KnowledgeCardVersion) {
  return isKnowledgeCardCurrentVersion(v, props.currentVersionKey)
}

function canCompareVersion(v: KnowledgeCardVersion) {
  return findKnowledgeCardCompareTarget(v, props.versions, props.currentVersionKey) != null
}

function canRollbackVersion(v: KnowledgeCardVersion) {
  const targetVersion = resolveKnowledgeCardVersionKey(v)
  return (
    targetVersion != null &&
    canRollbackKnowledgeCardVersion(targetVersion, props.currentVersionKey, validVersionKeys.value)
  )
}

function handleCompare(v: KnowledgeCardVersion) {
  const target = findKnowledgeCardCompareTarget(v, props.versions, props.currentVersionKey)
  if (target) emit('compare', target.from, target.to)
}

const rollbackReason = ref('')

const handleRollback = (v: KnowledgeCardVersion) => {
  const targetVersion = resolveKnowledgeCardVersionKey(v)
  if (
    targetVersion == null ||
    !canRollbackKnowledgeCardVersion(targetVersion, props.currentVersionKey, validVersionKeys.value)
  ) {
    message.warning(t('knowledge.card.rollbackInvalidVersion'))
    return
  }
  rollbackReason.value = ''
  Modal.confirm({
    title: t('knowledge.card.rollbackConfirmTitle'),
    content: h('div', [
      h('p', t('knowledge.card.rollbackConfirmContent', { version: v.version })),
      h(ATextarea, {
        value: rollbackReason.value,
        'onUpdate:value': (val: string) => {
          rollbackReason.value = val
        },
        placeholder: t('knowledge.card.rollbackReasonPlaceholder'),
        maxlength: 2000,
        showCount: true,
        rows: 3,
        style: 'margin-top: 8px',
      }),
    ]),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: () => {
      emit('rollback', v.version, targetVersion, rollbackReason.value || undefined)
    },
  })
}
</script>
