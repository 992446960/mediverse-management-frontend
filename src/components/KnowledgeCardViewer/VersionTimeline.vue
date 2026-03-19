<template>
  <div class="version-timeline p-4">
    <a-timeline>
      <a-timeline-item v-for="v in versions" :key="v.version_number">
        <template #dot>
          <HistoryOutlined style="font-size: 16px" />
        </template>
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <a-space>
              <span class="font-bold text-gray-800">v{{ v.version_number }}</span>
              <a-tag v-if="v.version_number === currentVersion" color="blue">
                {{ t('knowledge.card.currentVersion') }}
              </a-tag>
            </a-space>
            <span class="text-xs text-gray-400">{{
              dayjs(v.created_at).format('YYYY-MM-DD HH:mm')
            }}</span>
          </div>
          <p class="text-sm text-gray-600 mb-2">{{ v.change_summary }}</p>
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>{{ t('knowledge.card.operator') }}: {{ v.operated_by_name }}</span>
            <a-space>
              <a-button
                v-if="v.version_number !== currentVersion"
                type="link"
                size="small"
                danger
                @click="handleRollback(v.version_number)"
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
import { Modal } from 'ant-design-vue'
import { HistoryOutlined, RollbackOutlined } from '@ant-design/icons-vue'
import type { KnowledgeCardVersion } from '@/types/knowledge'
import dayjs from 'dayjs'

const { t } = useI18n()

defineProps<{
  versions: KnowledgeCardVersion[]
  currentVersion: number
}>()

const emit = defineEmits<{
  (e: 'rollback', targetVersion: number): void
}>()

const handleRollback = (targetVersion: number) => {
  Modal.confirm({
    title: t('knowledge.card.rollbackConfirmTitle'),
    content: t('knowledge.card.rollbackConfirmContent', { version: targetVersion }),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: () => {
      emit('rollback', targetVersion)
    },
  })
}
</script>
