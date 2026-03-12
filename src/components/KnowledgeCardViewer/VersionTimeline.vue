<script setup lang="ts">
import { Timeline, Button, Tag, Space, Modal } from 'ant-design-vue'
import { HistoryOutlined, RollbackOutlined, EyeOutlined } from '@ant-design/icons-vue'
import type { KnowledgeCardVersion } from '@/types/knowledge'
import dayjs from 'dayjs'

defineProps<{
  versions: KnowledgeCardVersion[]
  currentVersion: string
}>()

const emit = defineEmits<{
  (e: 'preview', version: KnowledgeCardVersion): void
  (e: 'rollback', version: string): void
}>()

const handleRollback = (version: string) => {
  Modal.confirm({
    title: '确认回退版本',
    content: `确定要将知识卡内容回退到版本 ${version} 吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      emit('rollback', version)
    },
  })
}
</script>

<template>
  <div class="version-timeline p-4">
    <Timeline>
      <Timeline.Item v-for="v in versions" :key="v.version">
        <template #dot>
          <HistoryOutlined style="font-size: 16px" />
        </template>
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <Space>
              <span class="font-bold text-gray-800">{{ v.version }}</span>
              <Tag v-if="v.version === currentVersion" color="blue">当前版本</Tag>
            </Space>
            <span class="text-xs text-gray-400">{{
              dayjs(v.created_at).format('YYYY-MM-DD HH:mm')
            }}</span>
          </div>
          <p class="text-sm text-gray-600 mb-2">{{ v.summary }}</p>
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>操作人: {{ v.created_by_name }}</span>
            <Space>
              <Button type="link" size="small" @click="emit('preview', v)">
                <template #icon><EyeOutlined /></template>
                预览
              </Button>
              <Button
                v-if="v.version !== currentVersion"
                type="link"
                size="small"
                danger
                @click="handleRollback(v.version)"
              >
                <template #icon><RollbackOutlined /></template>
                回退
              </Button>
            </Space>
          </div>
        </div>
      </Timeline.Item>
    </Timeline>
  </div>
</template>
