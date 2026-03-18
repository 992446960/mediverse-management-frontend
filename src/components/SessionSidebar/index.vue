<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { Conversations } from 'ant-design-x-vue'
import { PlusOutlined, DeleteOutlined, EditOutlined, MessageOutlined } from '@ant-design/icons-vue'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const isOnChatHome = computed(() => route.name === 'ChatHome')
const chatStore = useChatStore()
const { groupedSessions, currentSessionId } = storeToRefs(chatStore)
const { removeSession, updateSessionTitle, selectSession } = chatStore

const activeKey = computed({
  get: () => currentSessionId.value || '',
  set: (val) => selectSession(val),
})

const menu = (session: { key: string; label: string }) => ({
  items: [
    {
      key: 'rename',
      label: t('chat.rename'),
      icon: h(EditOutlined),
    },
    {
      key: 'delete',
      label: t('chat.delete'),
      icon: h(DeleteOutlined),
      danger: true,
    },
  ],
  onClick: ({ key }: { key: string }) => {
    if (key === 'delete') {
      Modal.confirm({
        title: t('common.confirmDeleteTitle'),
        content: t('common.confirmDeleteContent'),
        onOk: async () => {
          await removeSession(session.key)
          message.success(t('common.success'))
          if (currentSessionId.value === session.key) {
            router.push('/chat')
          }
        },
      })
    } else if (key === 'rename') {
      const newTitle = prompt(t('chat.renamePlaceholder'), session.label)
      if (newTitle) {
        updateSessionTitle(session.key, newTitle)
      }
    }
  },
})

const items = computed(() => {
  const groups = []

  if (groupedSessions.value.today.length) {
    groups.push({
      label: t('chat.groupToday'),
      items: groupedSessions.value.today.map((s) => ({
        label: s.title || t('chat.untitledSession'),
        key: s.id,
        icon: h(MessageOutlined),
      })),
    })
  }

  if (groupedSessions.value.yesterday.length) {
    groups.push({
      label: t('chat.groupYesterday'),
      items: groupedSessions.value.yesterday.map((s) => ({
        label: s.title || t('chat.untitledSession'),
        key: s.id,
        icon: h(MessageOutlined),
      })),
    })
  }

  if (groupedSessions.value.week.length) {
    groups.push({
      label: t('chat.groupWeek'),
      items: groupedSessions.value.week.map((s) => ({
        label: s.title || t('chat.untitledSession'),
        key: s.id,
        icon: h(MessageOutlined),
      })),
    })
  }

  if (groupedSessions.value.earlier.length) {
    groups.push({
      label: t('chat.groupEarlier'),
      items: groupedSessions.value.earlier.map((s) => ({
        label: s.title || t('chat.untitledSession'),
        key: s.id,
        icon: h(MessageOutlined),
      })),
    })
  }

  return groups
})

const hasSessions = computed(
  () =>
    groupedSessions.value.today.length > 0 ||
    groupedSessions.value.yesterday.length > 0 ||
    groupedSessions.value.week.length > 0 ||
    groupedSessions.value.earlier.length > 0
)

const handleAdd = () => {
  router.push('/chat')
}

const handleSelect = (key: string) => {
  router.push(`/chat/session/${key}`)
}
</script>

<template>
  <div
    class="session-sidebar h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"
  >
    <div v-if="!isOnChatHome" class="p-4">
      <a-button type="primary" block :icon="h(PlusOutlined)" @click="handleAdd">
        {{ t('chat.newSession') }}
      </a-button>
    </div>

    <div class="flex-1 overflow-y-auto flex flex-col">
      <Conversations
        v-if="hasSessions"
        :items="items"
        :active-key="activeKey"
        groupable
        :menu="menu"
        @active-change="handleSelect"
      />
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
  </div>
</template>

<style scoped>
.session-sidebar__empty :deep(.ant-empty-image) {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}
.session-sidebar__empty :deep(.ant-empty-description) {
  text-align: center;
}
</style>
