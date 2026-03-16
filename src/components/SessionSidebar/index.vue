<script setup lang="ts">
import { computed, h } from 'vue'
import { Conversations } from 'ant-design-x-vue'
import { PlusOutlined, DeleteOutlined, EditOutlined, MessageOutlined } from '@ant-design/icons-vue'
import { useChatStore } from '@/stores/chat'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'

const router = useRouter()
const chatStore = useChatStore()
const { groupedSessions, currentSessionId } = storeToRefs(chatStore)
const { createNewSession, removeSession, updateSessionTitle, selectSession } = chatStore

const activeKey = computed({
  get: () => currentSessionId.value || '',
  set: (val) => selectSession(val),
})

const menu = (session: { key: string; label: string }) => ({
  items: [
    {
      key: 'rename',
      label: '重命名',
      icon: h(EditOutlined),
    },
    {
      key: 'delete',
      label: '删除',
      icon: h(DeleteOutlined),
      danger: true,
    },
  ],
  onClick: ({ key }: { key: string }) => {
    if (key === 'delete') {
      Modal.confirm({
        title: '确认删除会话？',
        content: '删除后无法恢复',
        onOk: async () => {
          await removeSession(session.key)
          message.success('已删除')
          if (currentSessionId.value === session.key) {
            router.push('/chat')
          }
        },
      })
    } else if (key === 'rename') {
      const newTitle = prompt('请输入新标题', session.label)
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
      label: '今天',
      items: groupedSessions.value.today.map((s) => ({
        label: s.title,
        key: s.id,
        icon: h(MessageOutlined),
      })),
    })
  }

  if (groupedSessions.value.yesterday.length) {
    groups.push({
      label: '昨天',
      items: groupedSessions.value.yesterday.map((s) => ({
        label: s.title,
        key: s.id,
        icon: h(MessageOutlined),
      })),
    })
  }

  if (groupedSessions.value.week.length) {
    groups.push({
      label: '本周',
      items: groupedSessions.value.week.map((s) => ({
        label: s.title,
        key: s.id,
        icon: h(MessageOutlined),
      })),
    })
  }

  if (groupedSessions.value.earlier.length) {
    groups.push({
      label: '更早',
      items: groupedSessions.value.earlier.map((s) => ({
        label: s.title,
        key: s.id,
        icon: h(MessageOutlined),
      })),
    })
  }

  return groups
})

const handleAdd = async () => {
  const session = await createNewSession()
  router.push(`/chat/session/${session.id}`)
}

const handleSelect = (key: string) => {
  router.push(`/chat/session/${key}`)
}
</script>

<template>
  <div
    class="session-sidebar h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"
  >
    <div class="p-4">
      <a-button type="primary" block :icon="h(PlusOutlined)" @click="handleAdd">
        新建会话
      </a-button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <Conversations
        :items="items"
        :active-key="activeKey"
        groupable
        :menu="menu"
        @active-change="handleSelect"
      />
    </div>
  </div>
</template>
