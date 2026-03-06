<template>
  <div
    class="table-tree pb-4 bg-white dark:bg-slate-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col flex-1 overflow-hidden border border-slate-200/60 dark:border-slate-800 min-h-0"
    :style="{ maxHeight }"
  >
    <div class="px-5 pt-6 pb-4">
      <div class="flex items-center justify-between mb-5">
        <h2
          class="text-[15px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"
        >
          <span class="w-1 h-4 bg-primary rounded-full" />
          {{ title }}
        </h2>
        <button
          v-if="fetchData"
          type="button"
          class="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          :title="refreshTitle"
          :disabled="loading"
          aria-label="refresh"
          @click="onRefresh"
        >
          <ReloadOutlined class="text-[14px]" />
        </button>
      </div>
      <div v-if="searchPlaceholder" class="relative group">
        <SearchOutlined
          class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] transition-colors group-focus-within:text-primary pointer-events-none"
          aria-hidden
        />
        <input
          v-model="searchKeyword"
          type="text"
          class="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-400"
          :placeholder="searchPlaceholder"
        />
      </div>
    </div>
    <div class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-4 min-h-0">
      <a-spin :spinning="loading" class="block min-h-[120px]">
        <div v-if="filteredTree.length > 0" class="space-y-0.5">
          <template v-for="node in filteredTree" :key="node.key">
            <!-- 根节点 -->
            <div
              v-if="!node.children?.length"
              class="flex items-center gap-3 px-5 py-3 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group border-l-[3px] border-transparent rounded-r"
              :class="
                selectedKey === node.key
                  ? 'institution-item-active'
                  : 'text-slate-600 dark:text-slate-400'
              "
              @click="onNodeClick(node, 'root')"
            >
              <span
                v-if="nodeIconComponent(node.icon)"
                class="flex items-center justify-center w-5 h-5 shrink-0 text-slate-400 group-hover:text-primary transition-colors"
                :class="selectedKey === node.key ? 'text-primary' : ''"
              >
                <component :is="nodeIconComponent(node.icon)!" class="text-[18px]" />
              </span>
              <span class="text-[14px] font-medium leading-relaxed truncate">{{ node.label }}</span>
            </div>
            <!-- 根节点 + 子节点（可展开/收起） -->
            <template v-else>
              <div
                class="flex items-center gap-3 px-5 py-3 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group border-l-[3px] border-transparent rounded-r"
                :class="
                  selectedKey === node.key
                    ? 'institution-item-active'
                    : 'text-slate-600 dark:text-slate-400'
                "
                @click="onNodeClick(node, 'root')"
              >
                <span
                  v-if="nodeIconComponent(node.icon)"
                  class="flex items-center justify-center w-5 h-5 shrink-0 text-slate-400 group-hover:text-primary transition-colors"
                  :class="selectedKey === node.key ? 'text-primary' : ''"
                >
                  <component :is="nodeIconComponent(node.icon)!" class="text-[18px]" />
                </span>
                <span class="text-[14px] font-medium leading-relaxed truncate flex-1">{{
                  node.label
                }}</span>
                <DownOutlined
                  class="text-sm transition-transform shrink-0"
                  :class="expandedKeys.has(node.key) ? 'rotate-0' : '-rotate-90'"
                />
              </div>
              <div v-show="expandedKeys.has(node.key)" class="branch-connector">
                <div
                  v-for="child in node.children"
                  :key="child.key"
                  class="branch-item flex items-center gap-3 pl-12 pr-5 py-2.5 cursor-pointer text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group relative"
                  :class="selectedKey === child.key ? 'institution-item-active' : ''"
                  @click.stop="onNodeClick(child, 'branch')"
                >
                  <span
                    v-if="nodeIconComponent(child.icon)"
                    class="flex items-center justify-center w-5 h-5 shrink-0 text-slate-300 group-hover:text-primary transition-colors"
                    :class="selectedKey === child.key ? 'text-primary' : ''"
                  >
                    <component :is="nodeIconComponent(child.icon)!" class="text-[16px]" />
                  </span>
                  <span class="text-[13px] font-normal leading-relaxed">{{ child.label }}</span>
                </div>
              </div>
            </template>
          </template>
        </div>
        <a-empty v-else :description="emptyText" class="py-4" />
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ReloadOutlined, SearchOutlined, DownOutlined } from '@ant-design/icons-vue'
import { tableTreeIconMap } from './icons'
import type { TableTreeNode, TableTreeClickPayload } from './types'

function nodeIconComponent(icon: string | undefined) {
  return icon ? tableTreeIconMap[icon] : undefined
}

interface Props {
  /** 标题，如「全部机构」 */
  title: string
  /** 搜索框占位符，不传则不显示搜索 */
  searchPlaceholder?: string
  /** 树数据 */
  treeData: TableTreeNode[]
  /** 当前选中节点 key */
  selectedKey?: string
  /** 加载态 */
  loading?: boolean
  /** 刷新回调：传入时展示刷新按钮，点击后调用 */
  fetchData?: () => void | Promise<void>
  /** 刷新按钮的 title 文案 */
  refreshTitle?: string
  /** 无数据或过滤无结果时的文案 */
  emptyText?: string
  /** 最大高度，默认 90vh，用于限制树区域高度并内部滚动 */
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  selectedKey: '',
  searchPlaceholder: undefined,
  loading: false,
  fetchData: undefined,
  refreshTitle: '刷新',
  emptyText: '暂无数据',
  maxHeight: '90vh',
})

function onRefresh() {
  if (typeof props.fetchData === 'function') {
    const ret = props.fetchData()
    if (ret && typeof (ret as Promise<unknown>).then === 'function') {
      ;(ret as Promise<void>).catch(() => {})
    }
  }
}

const emit = defineEmits<{
  (e: 'node-click', payload: TableTreeClickPayload): void
}>()

const searchKeyword = ref('')
const expandedKeys = ref<Set<string>>(new Set())

/** 根据关键词过滤树（仅过滤根节点 label，子节点保留） */
const filteredTree = computed(() => {
  const list = props.treeData
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return list
  return list.filter((node) => node.label.toLowerCase().includes(kw))
})

/** 选中变化时若为带子节点且当前在列表中，默认展开 */
watch(
  () => props.selectedKey,
  (key) => {
    if (!key) return
    const found = findNodeByKey(props.treeData, key)
    if (found?.parentKey) expandedKeys.value = new Set([...expandedKeys.value, found.parentKey])
  },
  { immediate: true }
)

function findNodeByKey(
  nodes: TableTreeNode[],
  key: string,
  parentKey?: string
): { parentKey?: string } | undefined {
  for (const node of nodes) {
    if (node.key === key) return { parentKey }
    if (node.children) {
      const inChild = findNodeByKey(node.children, key, node.key)
      if (inChild) return inChild
    }
  }
  return undefined
}

function onNodeClick(node: TableTreeNode, level: TableTreeClickPayload['level']) {
  if (node.children?.length) {
    const next = new Set(expandedKeys.value)
    if (next.has(node.key)) next.delete(node.key)
    else next.add(node.key)
    expandedKeys.value = next
  }
  emit('node-click', { key: node.key, label: node.label, level })
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
.institution-item-active {
  background-color: rgb(14 165 233 / 0.05);
  color: #0ea5e9;
  border-left-color: #0ea5e9 !important;
  font-weight: 700;
}
.branch-connector {
  position: relative;
}
.branch-connector::before {
  content: '';
  position: absolute;
  left: 26px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #e2e8f0;
}
.dark .branch-connector::before {
  background-color: #334155;
}
.branch-item::after {
  content: '';
  position: absolute;
  left: 26px;
  top: 50%;
  width: 12px;
  height: 1px;
  background-color: #e2e8f0;
}
.dark .branch-item::after {
  background-color: #334155;
}
</style>
