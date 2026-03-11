<template>
  <div
    class="directory-tree pb-4 bg-white dark:bg-slate-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col overflow-hidden border border-slate-200/60 dark:border-slate-800"
    :style="treeStyle"
  >
    <div class="px-5 pt-6 pb-4">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-[15px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span class="w-1 h-4 bg-primary rounded-full" />
          {{ title }}
        </h2>
        <div class="flex items-center gap-1">
          <button
            v-if="fetchData"
            type="button"
            class="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            :title="t('common.refresh')"
            :disabled="loading"
            @click="onRefresh"
          >
            <ReloadOutlined class="text-[14px]" />
          </button>
          <button
            type="button"
            class="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            :title="t('knowledge.addRootDirectory')"
            @click="openAddModal(null)"
          >
            <PlusOutlined class="text-[14px]" />
          </button>
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="relative group">
        <SearchOutlined
          class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] transition-colors group-focus-within:text-primary pointer-events-none"
        />
        <input
          v-model="searchKeyword"
          type="text"
          class="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400"
          :placeholder="searchPlaceholder || t('knowledge.searchDirectory')"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-4 min-h-0">
      <a-spin :spinning="loading" class="block min-h-[120px]">
        <!-- 虚拟节点：所有文件 -->
        <div
          class="flex items-center gap-3 px-5 py-3 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group border-l-[3px] border-transparent"
          :class="selectedKey === '__all__' ? 'item-active' : 'text-slate-600 dark:text-slate-400'"
          @click="onNodeClick({ key: '__all__', label: t('knowledge.allFiles'), level: 'virtual' })"
        >
          <FileOutlined class="text-[18px] text-slate-400" />
          <span class="text-[14px] font-medium">{{ t('knowledge.allFiles') }}</span>
        </div>

        <!-- 虚拟节点：未分类 -->
        <div
          class="flex items-center gap-3 px-5 py-3 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group border-l-[3px] border-transparent"
          :class="selectedKey === '__uncategorized__' ? 'item-active' : 'text-slate-600 dark:text-slate-400'"
          @click="onNodeClick({ key: '__uncategorized__', label: t('knowledge.uncategorized'), level: 'virtual' })"
        >
          <InboxOutlined class="text-[18px] text-slate-400" />
          <span class="text-[14px] font-medium">{{ t('knowledge.uncategorized') }}</span>
        </div>

        <div class="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-5" />

        <!-- 真实目录树 -->
        <div v-if="filteredTree.length > 0" class="space-y-0.5">
          <DirectoryTreeItem
            v-for="node in filteredTree"
            :key="node.key"
            :node="node"
            :level="0"
            :selected-key="selectedKey"
            @node-click="onNodeClick"
            @add-click="openAddModal"
          />
        </div>
        <a-empty v-else :description="t('common.noData')" class="py-4" />
      </a-spin>
    </div>

    <!-- 新增目录弹窗 -->
    <a-modal
      v-model:open="addModalVisible"
      :title="addModalTitle"
      @ok="handleAddDirectory"
      :confirm-loading="addLoading"
    >
      <a-form layout="vertical">
        <a-form-item :label="t('knowledge.directoryName')" required>
          <a-input v-model:value="newDirName" :placeholder="t('knowledge.directoryNamePlaceholder')" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ReloadOutlined,
  SearchOutlined,
  PlusOutlined,
  FileOutlined,
  InboxOutlined,
} from '@ant-design/icons-vue'
import { TABLE_TREE_HEIGHT_CALC } from '@/constants/layout'
import type { DirectoryNode } from '@/types/knowledge'
import type { DirectoryTreeNode, DirectoryTreeClickPayload } from './types'
import DirectoryTreeItem from './DirectoryTreeItem.vue'

interface Props {
  title: string
  treeData: DirectoryNode[]
  selectedKey: string
  loading?: boolean
  fetchData?: () => void | Promise<void>
  searchPlaceholder?: string
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  maxHeight: TABLE_TREE_HEIGHT_CALC,
})

const emit = defineEmits<{
  (e: 'node-click', payload: DirectoryTreeClickPayload): void
  (e: 'create-dir', parentId: string | null, name: string): Promise<void>
}>()

const { t } = useI18n()
const searchKeyword = ref('')
const treeStyle = computed(() => ({ height: props.maxHeight }))

/** 转换数据结构并过滤 */
const filteredTree = computed(() => {
  const transform = (nodes: DirectoryNode[]): DirectoryTreeNode[] => {
    return nodes
      .filter((n) => !searchKeyword.value || n.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
      .map((n) => ({
        ...n,
        key: n.id,
        label: n.name,
        children: n.children ? transform(n.children) : undefined,
      }))
  }
  return transform(props.treeData)
})

function onRefresh() {
  props.fetchData?.()
}

function onNodeClick(payload: any) {
  // 如果是 DirectoryTreeNode 类型
  if (payload.key) {
    emit('node-click', payload)
  } else {
    // 处理来自 DirectoryTreeItem 的原始节点
    emit('node-click', {
      key: payload.id,
      label: payload.name,
      level: payload.is_default ? 'root' : 'branch',
      data: payload,
    })
  }
}

// 新增目录相关
const addModalVisible = ref(false)
const addLoading = ref(false)
const newDirName = ref('')
const currentParentId = ref<string | null>(null)
/** 当前父节点名称，用于弹框标题「在 xx 下新增目录」 */
const currentParentLabel = ref<string | null>(null)

const addModalTitle = computed(() =>
  currentParentLabel.value
    ? t('knowledge.addDirectoryUnderParent', { parent: currentParentLabel.value })
    : t('knowledge.addDirectory')
)

function openAddModal(parent: DirectoryTreeNode | null) {
  currentParentId.value = parent ? parent.id : null
  currentParentLabel.value = parent ? (parent.label ?? parent.name) : null
  newDirName.value = ''
  addModalVisible.value = true
}

async function handleAddDirectory() {
  if (!newDirName.value.trim()) return
  addLoading.value = true
  try {
    await emit('create-dir', currentParentId.value, newDirName.value.trim())
    addModalVisible.value = false
  } finally {
    addLoading.value = false
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475569;
}
.item-active {
  background-color: rgb(14 165 233 / 0.05);
  color: #0ea5e9;
  border-left-color: #0ea5e9 !important;
  font-weight: 700;
}
</style>
