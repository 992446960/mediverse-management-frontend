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
              <a-tag v-if="v.version === currentVersion" color="blue">
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
              <a-button type="link" size="small" @click="handleCompare(v)">
                <template #icon><SwapOutlined /></template>
                {{ t('knowledge.card.compare') }}
              </a-button>
              <a-button
                v-if="v.version !== currentVersion"
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
import { useI18n } from 'vue-i18n'
import { Modal, message } from 'ant-design-vue'
import { HistoryOutlined, RollbackOutlined, SwapOutlined } from '@ant-design/icons-vue'
import type { KnowledgeCardVersion } from '@/types/knowledge'
import { knowledgeCardVersionToNumeric } from '@/utils/knowledgeCardVersion'
import dayjs from 'dayjs'

const { t } = useI18n()

const props = defineProps<{
  versions: KnowledgeCardVersion[]
  currentVersion: string
}>()

const emit = defineEmits<{
  (e: 'compare', fromVersion: number, toVersion: number): void
  (e: 'rollback', version: string, targetVersion: number): void
}>()

function handleCompare(v: KnowledgeCardVersion) {
  const latestVersion = props.versions[0]
  if (!latestVersion) return

  const toNum = knowledgeCardVersionToNumeric(v.version)
  if (toNum == null) return

  /** 点击项作为 to；from 为当前列表最新。若点的就是最新，则与相邻上一版对比。 */
  let fromRow: KnowledgeCardVersion | undefined
  if (v.version === latestVersion.version) {
    fromRow = props.versions[1]
  } else {
    fromRow = latestVersion
  }
  if (!fromRow) return

  const fromNum = knowledgeCardVersionToNumeric(fromRow.version)
  if (fromNum != null && fromNum !== toNum) {
    emit('compare', fromNum, toNum)
  }
}

const handleRollback = (v: KnowledgeCardVersion) => {
  const targetVersion = knowledgeCardVersionToNumeric(v.version)
  if (targetVersion == null) {
    message.warning(t('knowledge.card.rollbackInvalidVersion'))
    return
  }
  Modal.confirm({
    title: t('knowledge.card.rollbackConfirmTitle'),
    content: t('knowledge.card.rollbackConfirmContent', { version: v.version }),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: () => {
      emit('rollback', v.version, targetVersion)
    },
  })
}
</script>
