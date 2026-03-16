<template>
  <div class="kb-sidebar h-full flex flex-col border-r border-gray-200 bg-gray-50">
    <div class="p-4">
      <a-button type="primary" block @click="createNewSession">
        <template #icon><PlusOutlined /></template>
        新建搜索
      </a-button>
    </div>

    <div class="flex-1 overflow-y-auto px-2">
      <div v-if="loading" class="p-4 text-center">
        <a-spin />
      </div>

      <template v-else>
        <div
          v-for="(group, key) in groupedSessions"
          v-show="group.length > 0"
          :key="key"
          class="mb-4"
        >
          <div class="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
            {{ groupLabel(key) }}
          </div>
          <div
            v-for="session in group"
            :key="session.id"
            class="group flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors"
            :class="
              currentSessionId === session.id
                ? 'bg-blue-50 text-blue-600'
                : 'hover:bg-gray-100 text-gray-700'
            "
            @click="selectSession(session.id)"
          >
            <div class="flex-1 truncate text-sm">
              {{ session.title || '无标题会话' }}
            </div>
            <div class="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              <a-dropdown :trigger="['click']" @click.stop>
                <EllipsisOutlined class="text-gray-400 hover:text-gray-600" />
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="delete" danger @click="deleteSession(session.id)">
                      <DeleteOutlined /> 删除会话
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PlusOutlined, EllipsisOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { useKnowledgeSearchStore } from '@/stores/knowledgeSearch'
import { storeToRefs } from 'pinia'

const router = useRouter()
const store = useKnowledgeSearchStore()
const { groupedSessions, currentSessionId, loading } = storeToRefs(store)

const groupLabel = (key: string) => {
  const labels: Record<string, string> = {
    today: '今天',
    yesterday: '昨天',
    week: '过去7天',
    earlier: '更早',
  }
  return labels[key] || key
}

const createNewSession = () => {
  router.push('/knowledge-base')
}

const selectSession = (id: string) => {
  store.currentSessionId = id
  router.push(`/knowledge-base/search/${id}`)
}

const deleteSession = async (id: string) => {
  await store.deleteSession(id)
  if (currentSessionId.value === id) {
    router.push('/knowledge-base')
  }
}

onMounted(() => {
  store.fetchSessions()
})
</script>

<style scoped>
.kb-sidebar {
  width: 260px;
  min-width: 260px;
}
</style>
