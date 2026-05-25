<template>
  <div
    class="page-tree-shell"
    :class="{
      'is-collapsed': collapsed,
      'is-resizing': resizing,
      'is-resizable': resizable,
      'is-collapsible': collapsible,
    }"
    :style="shellStyle"
  >
    <template v-if="!collapsed">
      <div
        class="table-tree pb-4 bg-white dark:bg-slate-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col overflow-hidden border border-slate-200/60 dark:border-slate-800"
        :style="tableTreeStyle"
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
                  <span class="text-[14px] font-medium leading-relaxed truncate">{{
                    node.label
                  }}</span>
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

      <button
        v-if="resizable"
        type="button"
        class="page-tree__resize-handle"
        title="可拖拽调整宽度，双击恢复默认宽度"
        aria-label="拖拽调整筛选树宽度"
        @pointerdown="startResize"
        @dblclick="resetWidth"
      >
        <span />
        <span />
        <span />
      </button>

      <a-tooltip v-if="collapsible" title="收起">
        <button
          type="button"
          class="page-tree__collapse-button"
          aria-label="收起筛选树"
          @click="collapsePanel"
        >
          <CaretLeftOutlined />
        </button>
      </a-tooltip>
    </template>

    <a-tooltip v-else :title="`点击展开${collapsedLabel}`" placement="right">
      <button
        type="button"
        class="page-tree__collapsed-entry"
        :aria-label="`展开${collapsedLabel}`"
        @click="expandPanel"
      >
        <BankOutlined class="page-tree__collapsed-icon" />
        <span class="page-tree__collapsed-text">{{ collapsedLabel }}</span>
        <span class="page-tree__collapsed-action">
          <RightOutlined />
        </span>
      </button>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
import {
  ReloadOutlined,
  SearchOutlined,
  DownOutlined,
  CaretLeftOutlined,
  BankOutlined,
  RightOutlined,
} from '@ant-design/icons-vue'
import { TABLE_TREE_HEIGHT_CALC } from '@/constants/layout'
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
  /**
   * 树容器高度，用于限制树区域并保证内部滚动生效。
   * 默认 100vh - layout header - content margin，与 MainLayout 一致；可传值覆盖。
   */
  maxHeight?: string
  resizable?: boolean
  collapsible?: boolean
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  collapsedWidth?: number
  collapsedLabel?: string
}

const DEFAULT_TREE_WIDTH = 280
const MIN_TREE_WIDTH = 220
const MAX_TREE_WIDTH = 420
const COLLAPSED_TREE_WIDTH = 48

const props = withDefaults(defineProps<Props>(), {
  selectedKey: '',
  searchPlaceholder: undefined,
  loading: false,
  fetchData: undefined,
  refreshTitle: '刷新',
  emptyText: '暂无数据',
  maxHeight: TABLE_TREE_HEIGHT_CALC,
  resizable: false,
  collapsible: false,
  defaultWidth: DEFAULT_TREE_WIDTH,
  minWidth: MIN_TREE_WIDTH,
  maxWidth: MAX_TREE_WIDTH,
  collapsedWidth: COLLAPSED_TREE_WIDTH,
  collapsedLabel: '筛选',
})

/** 根节点样式：固定高度以让内部 overflow 滚动生效，避免 flex-1 导致滚动失效 */
const tableTreeStyle = computed(() => ({ height: props.maxHeight }))
const collapsed = ref(false)
const resizing = ref(false)
const panelWidth = ref(clampWidth(props.defaultWidth))
let resizeStartX = 0
let resizeStartWidth = props.defaultWidth

const shellStyle = computed(() => {
  const base = { height: props.maxHeight }
  if (!props.resizable && !props.collapsible) return base
  return {
    ...base,
    width: `${collapsed.value ? props.collapsedWidth : panelWidth.value}px`,
  }
})

function clampWidth(width: number): number {
  return Math.min(props.maxWidth, Math.max(props.minWidth, width))
}

function onResizeMove(event: PointerEvent) {
  if (!resizing.value) return
  panelWidth.value = clampWidth(resizeStartWidth + event.clientX - resizeStartX)
}

function stopResize() {
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', stopResize)
  resizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function startResize(event: PointerEvent) {
  if (!props.resizable || collapsed.value) return
  event.preventDefault()
  resizeStartX = event.clientX
  resizeStartWidth = panelWidth.value
  resizing.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', stopResize)
}

function resetWidth() {
  panelWidth.value = clampWidth(props.defaultWidth)
}

function collapsePanel() {
  if (!props.collapsible) return
  stopResize()
  collapsed.value = true
}

function expandPanel() {
  collapsed.value = false
}

watch(
  () => [props.defaultWidth, props.minWidth, props.maxWidth] as const,
  () => {
    panelWidth.value = clampWidth(panelWidth.value)
  }
)

onBeforeUnmount(stopResize)

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

/** 根据关键词过滤树：无子节点时按根 label；有子节点时按根或子 label 匹配并过滤子节点 */
const filteredTree = computed(() => {
  const list = props.treeData
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return list
  return list
    .map((node) => {
      if (!node.children?.length) {
        return node.label.toLowerCase().includes(kw) ? node : null
      }
      const matchedChildren = node.children.filter((c) => c.label.toLowerCase().includes(kw))
      const rootMatch = node.label.toLowerCase().includes(kw)
      if (rootMatch || matchedChildren.length > 0) {
        return {
          ...node,
          children: rootMatch ? node.children : matchedChildren,
        }
      }
      return null
    })
    .filter((n): n is TableTreeNode => !!n)
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
.page-tree-shell {
  position: relative;
  display: flex;
  flex: 0 0 auto;
  min-width: 0;
  transition: width 0.18s ease;
}

.page-tree-shell.is-resizing {
  transition: none;
}

.page-tree-shell .table-tree {
  width: 100%;
  height: 100%;
}

.page-tree__resize-handle {
  position: absolute;
  top: 0;
  right: -10px;
  z-index: 3;
  display: flex;
  width: 16px;
  height: 100%;
  cursor: col-resize;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: 0;
  background: transparent;
  color: #94a3b8;
  transition:
    color 0.16s ease,
    background-color 0.16s ease;
}

.page-tree__resize-handle:hover,
.page-tree-shell.is-resizing .page-tree__resize-handle {
  background: linear-gradient(90deg, transparent, rgb(14 165 233 / 0.08), transparent);
  color: var(--color-primary);
}

.page-tree__resize-handle span {
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: currentColor;
}

.page-tree__collapse-button {
  position: absolute;
  top: 50%;
  right: -20px;
  z-index: 4;
  display: flex;
  width: 24px;
  height: 44px;
  transform: translateY(-50%);
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(14 165 233 / 0.28);
  border-radius: 999px;
  background: #fff;
  color: var(--color-primary);
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.08);
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    box-shadow 0.16s ease;
}

.page-tree__collapse-button:hover {
  border-color: rgb(14 165 233 / 0.55);
  background: #f0f9ff;
  box-shadow: 0 10px 24px rgb(14 165 233 / 0.16);
}

.page-tree__collapsed-entry {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 220px;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  border: 1px solid rgb(14 165 233 / 0.35);
  border-radius: 10px;
  background: linear-gradient(180deg, rgb(240 249 255 / 0.96), #fff 38%), #fff;
  color: var(--color-primary);
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.06);
  padding: 18px 0;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.page-tree__collapsed-entry:hover {
  border-color: rgb(14 165 233 / 0.7);
  box-shadow: 0 12px 28px rgb(14 165 233 / 0.14);
}

.page-tree__collapsed-icon {
  font-size: 19px;
}

.page-tree__collapsed-text {
  writing-mode: vertical-rl;
  letter-spacing: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.page-tree__collapsed-action {
  position: absolute;
  top: 50%;
  right: -13px;
  display: flex;
  width: 26px;
  height: 42px;
  transform: translateY(-50%);
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(14 165 233 / 0.35);
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 8px 20px rgb(15 23 42 / 0.1);
}

.dark .page-tree__collapse-button,
.dark .page-tree__collapsed-entry,
.dark .page-tree__collapsed-action {
  background: var(--color-bg-container);
}

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
