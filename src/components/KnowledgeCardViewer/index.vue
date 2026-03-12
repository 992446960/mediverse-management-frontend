<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Drawer, Tabs, Tag, Space, Button, List, Empty, Spin, message } from 'ant-design-vue'
import { FileOutlined, CloudUploadOutlined, CloudDownloadOutlined } from '@ant-design/icons-vue'
import type { KnowledgeCard, KnowledgeCardVersion, OwnerType } from '@/types/knowledge'
import { CARD_TYPE_CONFIG, ONLINE_STATUS_CONFIG, AUDIT_STATUS_CONFIG } from '@/types/knowledge'
import VersionTimeline from './VersionTimeline.vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import dayjs from 'dayjs'

const props = defineProps<{
  visible: boolean
  cardId: string | null
  ownerType: OwnerType
  ownerId: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'rollback-success'): void
}>()

const activeTab = ref('content')
const loading = ref(false)
const card = ref<KnowledgeCard | null>(null)
const versions = ref<KnowledgeCardVersion[]>([])
const previewVersion = ref<KnowledgeCardVersion | null>(null)

const renderedContent = computed(() => {
  const content = previewVersion.value?.content || card.value?.content || ''
  const html = marked.parse(content) as string
  return DOMPurify.sanitize(html)
})

const fetchCardDetails = async (id: string) => {
  loading.value = true
  try {
    // 模拟 API 调用
    console.log('Fetching card details for:', id)
    // 实际应调用 axios.get(`${API_BASE}/knowledge/${props.ownerType}/${props.ownerId}/cards/${id}`)
    // 这里先用 mock 数据模拟
    const mockCards = (await import('../../mocks/data/knowledgeCards')).mockKnowledgeCards
    const found = mockCards.find((c) => c.id === id)
    if (found) {
      card.value = found
      // 获取版本历史
      const mockVersions = (await import('../../mocks/data/knowledgeCards')).mockCardVersions
      versions.value = mockVersions[id] || []
    }
  } catch (err) {
    console.error('Fetch card failed:', err)
    message.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.cardId) {
      activeTab.value = 'content'
      previewVersion.value = null
      fetchCardDetails(props.cardId)
    }
  }
)

const handleClose = () => {
  emit('update:visible', false)
}

const handlePreviewVersion = (v: KnowledgeCardVersion) => {
  previewVersion.value = v
  activeTab.value = 'content'
}

const handleRollback = async (version: string) => {
  try {
    // 模拟 API 调用
    console.log('Rolling back to version:', version)
    message.success('已成功回退到版本 ' + version)
    emit('rollback-success')
    handleClose()
  } catch (err) {
    console.error('Rollback failed:', err)
    message.error('回退失败')
  }
}

const handleStatusToggle = async () => {
  if (!card.value) return
  const newStatus = card.value.online_status === 'online' ? 'offline' : 'online'
  try {
    // 模拟 API 调用
    card.value.online_status = newStatus
    message.success(`已${newStatus === 'online' ? '上线' : '下线'}`)
  } catch (err) {
    console.error('Status toggle failed:', err)
    message.error('操作失败')
  }
}
</script>

<template>
  <Drawer :open="visible" title="知识卡详情" width="600px" @close="handleClose">
    <Spin :spinning="loading">
      <div v-if="card" class="card-viewer">
        <div class="flex items-center justify-between mb-6">
          <div class="flex flex-col gap-2">
            <h2 class="text-xl font-bold m-0">{{ card.title }}</h2>
            <Space>
              <Tag :color="CARD_TYPE_CONFIG[card.type].color">{{
                CARD_TYPE_CONFIG[card.type].label
              }}</Tag>
              <Tag :color="ONLINE_STATUS_CONFIG[card.online_status].color">{{
                ONLINE_STATUS_CONFIG[card.online_status].label
              }}</Tag>
              <Tag :color="AUDIT_STATUS_CONFIG[card.audit_status].color">{{
                AUDIT_STATUS_CONFIG[card.audit_status].label
              }}</Tag>
            </Space>
          </div>
          <div class="flex gap-2">
            <Button
              :type="card.online_status === 'online' ? 'default' : 'primary'"
              @click="handleStatusToggle"
            >
              <template #icon>
                <CloudUploadOutlined v-if="card.online_status === 'offline'" />
                <CloudDownloadOutlined v-else />
              </template>
              {{ card.online_status === 'online' ? '下线' : '上线' }}
            </Button>
          </div>
        </div>

        <Tabs v-model:active-key="activeTab">
          <Tabs.TabPane key="content" tab="正文内容">
            <div class="p-4 bg-gray-50 rounded-lg min-h-[400px]">
              <div
                v-if="previewVersion"
                class="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-blue-600 text-sm flex justify-between items-center"
              >
                <span>正在预览版本: {{ previewVersion.version }}</span>
                <Button type="link" size="small" @click="previewVersion = null">退出预览</Button>
              </div>
              <div class="markdown-body" v-html="renderedContent"></div>
            </div>

            <div class="mt-6">
              <h3 class="text-sm font-bold text-gray-500 mb-2 flex items-center gap-2">
                <FileOutlined /> 溯源文件
              </h3>
              <List
                v-if="card.source_files?.length"
                size="small"
                :data-source="card.source_files"
                class="bg-white border rounded"
              >
                <template #renderItem="{ item }">
                  <List.Item>
                    <div
                      class="flex items-center gap-2 cursor-pointer text-blue-600 hover:underline"
                    >
                      <FileOutlined />
                      <span>{{ item.name }}</span>
                    </div>
                  </List.Item>
                </template>
              </List>
              <Empty v-else description="暂无关联文件" />
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="versions" tab="版本历史">
            <VersionTimeline
              :versions="versions"
              :current-version="card.version"
              @preview="handlePreviewVersion"
              @rollback="handleRollback"
            />
          </Tabs.TabPane>

          <Tabs.TabPane key="info" tab="元数据">
            <div class="p-4 space-y-4">
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">知识卡 ID</span>
                <span class="font-mono">{{ card.id }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">创建人</span>
                <span>{{ card.created_by_name }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">创建时间</span>
                <span>{{ dayjs(card.created_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">最后更新</span>
                <span>{{ dayjs(card.updated_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">引用次数</span>
                <span>{{ card.reference_count }} 次</span>
              </div>
              <div class="flex flex-col gap-2">
                <span class="text-gray-500">标签</span>
                <div class="flex flex-wrap gap-1">
                  <Tag v-for="tag in card.tags" :key="tag">{{ tag }}</Tag>
                </div>
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
      <Empty v-else-if="!loading" description="未找到知识卡信息" />
    </Spin>
  </Drawer>
</template>

<style scoped>
.markdown-body {
  line-height: 1.6;
}
.markdown-body :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}
.markdown-body :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
}
.markdown-body :deep(h4) {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
.markdown-body :deep(p) {
  margin-bottom: 1rem;
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}
.markdown-body :deep(li) {
  margin-bottom: 0.25rem;
}
.markdown-body :deep(blockquote) {
  border-left: 4px solid #dfe2e5;
  color: #6a737d;
  padding-left: 1rem;
  margin-left: 0;
  margin-bottom: 1rem;
}
.markdown-body :deep(code) {
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-size: 85%;
  margin: 0;
  padding: 0.2em 0.4em;
}
</style>
