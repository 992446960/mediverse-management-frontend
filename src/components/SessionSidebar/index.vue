<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
  MoreOutlined,
} from '@ant-design/icons-vue'
import { storeToRefs } from 'pinia'
import { message } from 'ant-design-vue'
import { useRouter, useRoute } from 'vue-router'
import SessionRenameForm from '@/components/SessionSidebar/components/SessionRenameForm.vue'
import { useChatStore } from '@/stores/chat'
import { confirmDelete } from '@/utils/confirm'
import type { Session } from '@/types/chat'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const isOnChatHome = computed(() => route.name === 'ChatHome')
const chatStore = useChatStore()
const { groupedSessions, currentSessionId } = storeToRefs(chatStore)
const { removeSession, updateSessionTitle } = chatStore
const renameOpen = ref(false)
const editingSession = ref<{ id: string; title: string } | null>(null)

const sortedGroupKeys = computed(() => {
  return Object.keys(groupedSessions.value).sort((a, b) => {
    const priority = { today: 4, yesterday: 3, week: 2 }
    const pA = priority[a as keyof typeof priority] || 1
    const pB = priority[b as keyof typeof priority] || 1
    if (pA !== pB) return pB - pA
    return b.localeCompare(a)
  })
})

const getGroupLabel = (key: string) => {
  if (key === 'today') return t('chat.groupToday')
  if (key === 'yesterday') return t('chat.groupYesterday')
  if (key === 'week') return t('chat.groupWeek')
  return key
}

const handleMenuClick = ({ key }: { key: string | number }, session: Session) => {
  const action = String(key)
  if (action === 'delete') {
    confirmDelete({
      title: t('common.confirmDeleteTitle'),
      content: t('common.confirmDeleteContent'),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        const isCurrentSession = currentSessionId.value === session.id
        await removeSession(session.id)
        message.success(t('common.success'))
        if (isCurrentSession) {
          router.push('/chat')
        }
      },
    })
  } else if (action === 'rename') {
    editingSession.value = {
      id: session.id,
      title: session.title || '',
    }
    renameOpen.value = true
  }
}

const hasSessions = computed(() => Object.keys(groupedSessions.value).length > 0)

const handleAdd = () => {
  router.push('/chat')
}

const handleSelect = (key: string) => {
  if (!key) return
  router.push(`/chat/session/${key}`)
}

watch(renameOpen, (open) => {
  if (!open) {
    editingSession.value = null
  }
})

async function handleRenameSubmit(title: string) {
  if (!editingSession.value?.id) return
  await updateSessionTitle(editingSession.value.id, title)
  message.success(t('common.success'))
}
</script>

<template>
  <div
    class="session-sidebar h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"
  >
    <div
      v-if="!isOnChatHome"
      class="session-sidebar__new-session p-4 border-b border-(--color-border)"
    >
      <a-button type="primary" block :icon="h(PlusOutlined)" @click="handleAdd">
        {{ t('chat.newSession') }}
      </a-button>
    </div>

    <div class="flex-1 overflow-y-auto flex flex-col m-2">
      <div v-if="hasSessions" class="sessions-list">
        <div v-for="key in sortedGroupKeys" :key="key" class="session-group">
          <div class="session-group-title">{{ getGroupLabel(key) }}</div>
          <div
            v-for="session in groupedSessions[key]"
            :key="session.id"
            class="session-item"
            :class="{ 'session-item-active': currentSessionId === session.id }"
            @click="handleSelect(session.id)"
          >
            <div class="session-item-icon">
              <MessageOutlined />
            </div>
            <div class="session-item-content">
              <div class="session-item-label">{{ session.title || t('chat.untitledSession') }}</div>
              <div v-if="session.avatar_name" class="session-item-description">
                {{ session.avatar_name }}
              </div>
            </div>
            <a-dropdown :trigger="['click']">
              <div class="session-item-more" @click.stop>
                <MoreOutlined />
              </div>
              <template #overlay>
                <a-menu @click="(e: { key: string | number }) => handleMenuClick(e, session)">
                  <a-menu-item key="rename">
                    <template #icon><EditOutlined /></template>
                    {{ t('chat.rename') }}
                  </a-menu-item>
                  <a-menu-item key="delete" danger>
                    <template #icon><DeleteOutlined /></template>
                    {{ t('chat.delete') }}
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </div>
      </div>
      <div v-else class="flex-1 flex flex-col items-center justify-center px-4 py-8 min-h-0">
        <a-empty :description="t('chat.noSessionsHint')" class="session-sidebar__empty">
          <template #image>
            <MessageOutlined
              class="session-sidebar__empty-icon text-4xl text-gray-300 dark:text-gray-600"
            />
          </template>
        </a-empty>
      </div>
    </div>

    <SessionRenameForm
      v-model:open="renameOpen"
      :initial-title="editingSession?.title"
      @submit="handleRenameSubmit"
    />
  </div>
</template>

<style scoped>
.session-sidebar {
  transition: all 0.3s ease;
}

.session-group-title {
  font-size: 12px;
  color: var(--ant-color-text-quaternary);
  padding: 16px 8px 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.session-item {
  margin: 2px 0;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.session-item:hover {
  background-color: var(--ant-color-fill-secondary);
}

.session-item-active {
  background-color: var(--ant-color-primary-bg) !important;
  color: var(--ant-color-primary-text) !important;
}

.session-item-icon {
  font-size: 16px;
  color: var(--ant-color-text-tertiary);
  display: flex;
  align-items: center;
}

.session-item-active .session-item-icon {
  color: var(--ant-color-primary) !important;
}

.session-item-content {
  flex: 1;
  min-width: 0;
}

.session-item-label {
  font-weight: 500;
  color: var(--ant-color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}

.session-item-description {
  font-size: 11px;
  color: var(--ant-color-text-description);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-item-more {
  opacity: 0;
  transition: opacity 0.2s ease;
  color: var(--ant-color-text-tertiary);
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.session-item:hover .session-item-more {
  opacity: 1;
}

.session-item-more:hover {
  background-color: var(--ant-color-fill-tertiary);
  color: var(--ant-color-text-secondary);
}

.session-sidebar__empty :deep(.ant-empty-image) {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  opacity: 0.6;
}

.session-sidebar__empty :deep(.ant-empty-description) {
  text-align: center;
  color: var(--ant-color-text-tertiary);
  font-size: 13px;
}

/* 隐藏滚动条但保持可滚动 */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: var(--ant-color-fill-tertiary) transparent;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: var(--ant-color-fill-tertiary);
  border-radius: 10px;
}
</style>
