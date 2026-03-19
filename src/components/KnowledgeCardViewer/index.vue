<template>
  <a-drawer
    :open="open"
    :title="t('knowledge.card.detailTitle')"
    width="600px"
    @close="handleClose"
  >
    <a-spin :spinning="loading">
      <div v-if="card" class="card-viewer">
        <div class="flex items-center justify-between mb-6">
          <div class="flex flex-col gap-2">
            <h2 class="text-xl font-bold m-0">{{ card.title }}</h2>
            <a-space>
              <a-tag :color="CARD_TYPE_CONFIG[card.type].color">{{
                CARD_TYPE_CONFIG[card.type].label
              }}</a-tag>
              <a-tag :color="ONLINE_STATUS_CONFIG[card.online_status].color">{{
                ONLINE_STATUS_CONFIG[card.online_status].label
              }}</a-tag>
              <a-tag :color="AUDIT_STATUS_CONFIG[card.audit_status].color">{{
                AUDIT_STATUS_CONFIG[card.audit_status].label
              }}</a-tag>
            </a-space>
          </div>
          <div class="flex gap-2">
            <a-button
              :type="card.online_status === 'online' ? 'default' : 'primary'"
              @click="handleStatusToggle"
            >
              <template #icon>
                <CloudUploadOutlined v-if="card.online_status === 'offline'" />
                <CloudDownloadOutlined v-else />
              </template>
              {{
                card.online_status === 'online'
                  ? t('knowledge.card.offline')
                  : t('knowledge.card.online')
              }}
            </a-button>
          </div>
        </div>

        <a-tabs v-model:active-key="activeTab">
          <a-tab-pane key="content" :tab="t('knowledge.card.tabContent')">
            <div class="p-4 bg-gray-50 rounded-lg min-h-[400px]">
              <div class="markdown-body" v-html="renderedContent"></div>
            </div>

            <div class="mt-6">
              <h3 class="text-sm font-bold text-gray-500 mb-2 flex items-center gap-2">
                <FileOutlined /> {{ t('knowledge.card.sourceFile') }}
              </h3>
              <a-list
                v-if="card.sources?.length"
                size="small"
                :data-source="card.sources"
                class="bg-white border rounded"
              >
                <template #renderItem="{ item }">
                  <a-list-item>
                    <div
                      class="flex items-center gap-2 cursor-pointer text-blue-600 hover:underline"
                    >
                      <FileOutlined />
                      <span>{{ item.file_name }}</span>
                      <span v-if="item.page_hint" class="text-xs text-gray-400"
                        >({{ item.page_hint }})</span
                      >
                    </div>
                  </a-list-item>
                </template>
              </a-list>
              <a-empty v-else :description="t('knowledge.card.noSourceFile')" />
            </div>
          </a-tab-pane>

          <a-tab-pane key="versions" :tab="t('knowledge.card.tabVersions')">
            <VersionTimeline
              :versions="versions"
              :current-version="card.current_version"
              @rollback="handleRollback"
            />
          </a-tab-pane>

          <a-tab-pane key="info" :tab="t('knowledge.card.tabInfo')">
            <div class="p-4 space-y-4">
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">{{ t('knowledge.card.cardId') }}</span>
                <span class="font-mono">{{ card.id }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">{{ t('common.createdBy') }}</span>
                <span>{{ card.created_by_name }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">{{ t('common.createdAt') }}</span>
                <span>{{ dayjs(card.created_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">{{ t('common.updatedAt') }}</span>
                <span>{{ dayjs(card.updated_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">{{ t('knowledge.card.referenceCount') }}</span>
                <span>{{ card.reference_count }} {{ t('knowledge.card.times') }}</span>
              </div>
              <div class="flex flex-col gap-2">
                <span class="text-gray-500">{{ t('knowledge.card.tagsLabel') }}</span>
                <div class="flex flex-wrap gap-1">
                  <a-tag v-for="tag in card.tags" :key="tag">{{ tag }}</a-tag>
                </div>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
      <a-empty v-else-if="!loading" :description="t('knowledge.card.notFound')" />
    </a-spin>
  </a-drawer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { FileOutlined, CloudUploadOutlined, CloudDownloadOutlined } from '@ant-design/icons-vue'
import type { KnowledgeCard, KnowledgeCardVersion, OwnerType } from '@/types/knowledge'
import { CARD_TYPE_CONFIG, ONLINE_STATUS_CONFIG, AUDIT_STATUS_CONFIG } from '@/types/knowledge'
import {
  getKnowledgeCardDetail,
  getKnowledgeCardVersions,
  toggleKnowledgeCardStatus,
  rollbackKnowledgeCard,
} from '@/api/knowledge'
import VersionTimeline from './VersionTimeline.vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import dayjs from 'dayjs'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  cardId: string | null
  ownerType: OwnerType
  ownerId: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'rollback-success'): void
}>()

const activeTab = ref('content')
const loading = ref(false)
const card = ref<KnowledgeCard | null>(null)
const versions = ref<KnowledgeCardVersion[]>([])

const renderedContent = computed(() => {
  const content = card.value?.content || ''
  const html = marked.parse(content) as string
  return DOMPurify.sanitize(html)
})

const fetchCardDetails = async (id: string) => {
  loading.value = true
  try {
    const [cardData, versionsData] = await Promise.all([
      getKnowledgeCardDetail(props.ownerType, props.ownerId, id),
      getKnowledgeCardVersions(props.ownerType, props.ownerId, id),
    ])
    card.value = cardData
    versions.value = versionsData
  } catch (err) {
    console.error('Fetch card failed:', err)
    message.error(t('knowledge.card.fetchDetailFailed'))
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  (val) => {
    if (val && props.cardId) {
      activeTab.value = 'content'
      fetchCardDetails(props.cardId)
    }
  }
)

const handleClose = () => {
  emit('update:open', false)
}

const handleRollback = async (targetVersion: number) => {
  if (!props.cardId) return
  try {
    await rollbackKnowledgeCard(props.ownerType, props.ownerId, props.cardId, targetVersion)
    message.success(t('knowledge.card.rollbackSuccess', { version: targetVersion }))
    emit('rollback-success')
    handleClose()
  } catch (err) {
    console.error('Rollback failed:', err)
    message.error(t('knowledge.card.rollbackFailed'))
  }
}

const handleStatusToggle = async () => {
  if (!card.value) return
  const newStatus = card.value.online_status === 'online' ? 'offline' : 'online'
  try {
    await toggleKnowledgeCardStatus(props.ownerType, props.ownerId, card.value.id, newStatus)
    card.value.online_status = newStatus
    message.success(
      newStatus === 'online'
        ? t('knowledge.card.onlineSuccess')
        : t('knowledge.card.offlineSuccess')
    )
  } catch (err) {
    console.error('Status toggle failed:', err)
    message.error(t('common.error'))
  }
}
</script>

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
