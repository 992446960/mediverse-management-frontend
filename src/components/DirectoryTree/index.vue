<template>
  <div
    class="directory-tree-shell"
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
        class="directory-tree pb-4 bg-white dark:bg-(--color-bg-container) rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col overflow-hidden border border-slate-200/60 dark:border-(--color-border)"
        :style="treeStyle"
      >
        <div class="px-5 pt-6 pb-4">
          <div class="flex items-center justify-between mb-5">
            <h2
              class="text-[15px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2"
            >
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
              :class="
                selectedKey === '__all__' ? 'item-active' : 'text-slate-600 dark:text-slate-400'
              "
              @click="
                onNodeClick({ key: '__all__', label: t('knowledge.allFiles'), level: 'virtual' })
              "
            >
              <FileOutlined class="text-[18px] text-slate-400" />
              <span class="text-[14px] font-medium">{{ t('knowledge.allFiles') }}</span>
            </div>

            <!-- 虚拟节点：未分类 -->
            <div
              class="flex items-center gap-3 px-5 py-3 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group border-l-[3px] border-transparent"
              :class="
                selectedKey === '__uncategorized__'
                  ? 'item-active'
                  : 'text-slate-600 dark:text-slate-400'
              "
              @click="
                onNodeClick({
                  key: '__uncategorized__',
                  label: t('knowledge.uncategorized'),
                  level: 'virtual',
                })
              "
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
                @rename-click="openRenameModal"
                @delete-click="handleDeleteDirectory"
              />
            </div>
            <a-empty v-else :description="t('common.noData')" class="py-4" />
          </a-spin>
        </div>

        <!-- 新增目录弹窗 -->
        <a-modal
          v-model:open="addModalVisible"
          :title="addModalTitle"
          :confirm-loading="addLoading"
          @ok="handleAddDirectory"
        >
          <a-form layout="vertical">
            <a-form-item :label="t('knowledge.directoryName')" required>
              <a-input
                v-model:value="newDirName"
                :placeholder="t('knowledge.directoryNamePlaceholder')"
              />
            </a-form-item>
          </a-form>
        </a-modal>

        <!-- 重命名目录弹窗 -->
        <a-modal
          v-model:open="renameModalVisible"
          :title="t('knowledge.renameDirectory')"
          :confirm-loading="renameLoading"
          @ok="handleRenameDirectory"
        >
          <a-form layout="vertical">
            <a-form-item :label="t('knowledge.directoryName')" required>
              <a-input
                v-model:value="renameDirName"
                :placeholder="t('knowledge.directoryNamePlaceholder')"
              />
            </a-form-item>
          </a-form>
        </a-modal>
      </div>

      <button
        v-if="resizable"
        type="button"
        class="directory-tree__resize-handle"
        title="可拖拽调整宽度，双击恢复默认宽度"
        aria-label="拖拽调整目录宽度"
        @pointerdown="startResize"
        @dblclick="resetWidth"
      >
        <span />
        <span />
        <span />
      </button>

      <a-tooltip v-if="collapsible" title="收起目录">
        <button
          type="button"
          class="directory-tree__collapse-button"
          aria-label="收起目录"
          @click="collapsePanel"
        >
          <CaretLeftOutlined />
        </button>
      </a-tooltip>
    </template>

    <a-tooltip v-else :title="`点击展开${collapsedLabel}`" placement="right">
      <button
        type="button"
        class="directory-tree__collapsed-entry"
        :aria-label="`展开${collapsedLabel}`"
        @click="expandPanel"
      >
        <FolderOpenOutlined class="directory-tree__collapsed-icon" />
        <span class="directory-tree__collapsed-text">{{ collapsedLabel }}</span>
        <span class="directory-tree__collapsed-action">
          <RightOutlined />
        </span>
      </button>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  ReloadOutlined,
  SearchOutlined,
  PlusOutlined,
  FileOutlined,
  InboxOutlined,
  CaretLeftOutlined,
  FolderOpenOutlined,
  RightOutlined,
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
  loading: false,
  maxHeight: TABLE_TREE_HEIGHT_CALC,
  resizable: false,
  collapsible: false,
  defaultWidth: DEFAULT_TREE_WIDTH,
  minWidth: MIN_TREE_WIDTH,
  maxWidth: MAX_TREE_WIDTH,
  collapsedWidth: COLLAPSED_TREE_WIDTH,
  collapsedLabel: '目录',
})

const emit = defineEmits<{
  (e: 'node-click', payload: DirectoryTreeClickPayload): void
  (e: 'create-dir', parentId: string | null, name: string): Promise<void>
  (e: 'rename-dir', directoryId: string, name: string): Promise<void>
  (e: 'delete-dir', directoryId: string): Promise<void>
}>()

const { t } = useI18n()
const searchKeyword = ref('')
const treeStyle = computed(() => ({ height: props.maxHeight }))
const collapsed = ref(false)
const resizing = ref(false)
const panelWidth = ref(clampWidth(props.defaultWidth))
let resizeStartX = 0
let resizeStartWidth = props.defaultWidth

const shellStyle = computed(() => ({
  width: `${collapsed.value ? props.collapsedWidth : panelWidth.value}px`,
  height: props.maxHeight,
}))

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

/** 转换数据结构并过滤 */
const filteredTree = computed(() => {
  const transform = (nodes: DirectoryNode[]): DirectoryTreeNode[] => {
    return nodes
      .filter(
        (n) =>
          !searchKeyword.value || n.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
      )
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

// 重命名 / 删除目录
const renameModalVisible = ref(false)
const renameLoading = ref(false)
const renamingNode = ref<DirectoryTreeNode | null>(null)
const renameDirName = ref('')

function openRenameModal(node: DirectoryTreeNode) {
  renamingNode.value = node
  renameDirName.value = node.name
  renameModalVisible.value = true
}

async function handleRenameDirectory() {
  const node = renamingNode.value
  const name = renameDirName.value.trim()
  if (!node || !name) return
  renameLoading.value = true
  try {
    await emit('rename-dir', node.id, name)
    renameModalVisible.value = false
  } finally {
    renameLoading.value = false
  }
}

async function handleDeleteDirectory(node: DirectoryTreeNode) {
  await emit('delete-dir', node.id)
}
</script>

<style scoped>
.directory-tree-shell {
  position: relative;
  display: flex;
  flex: 0 0 auto;
  min-width: 0;
  transition: width 0.18s ease;
}

.directory-tree-shell.is-resizing {
  transition: none;
}

.directory-tree-shell .directory-tree {
  width: 100%;
  height: 100%;
}

.directory-tree__resize-handle {
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

.directory-tree__resize-handle:hover,
.directory-tree-shell.is-resizing .directory-tree__resize-handle {
  background: linear-gradient(90deg, transparent, rgb(14 165 233 / 0.08), transparent);
  color: var(--color-primary);
}

.directory-tree__resize-handle span {
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: currentColor;
}

.directory-tree__collapse-button {
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

.directory-tree__collapse-button:hover {
  border-color: rgb(14 165 233 / 0.55);
  background: #f0f9ff;
  box-shadow: 0 10px 24px rgb(14 165 233 / 0.16);
}

.directory-tree__collapsed-entry {
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

.directory-tree__collapsed-entry:hover {
  border-color: rgb(14 165 233 / 0.7);
  box-shadow: 0 12px 28px rgb(14 165 233 / 0.14);
}

.directory-tree__collapsed-icon {
  font-size: 19px;
}

.directory-tree__collapsed-text {
  writing-mode: vertical-rl;
  letter-spacing: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}

.directory-tree__collapsed-action {
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

.dark .directory-tree__collapse-button,
.dark .directory-tree__collapsed-entry,
.dark .directory-tree__collapsed-action {
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
.item-active {
  background-color: rgb(14 165 233 / 0.05);
  color: #0ea5e9;
  border-left-color: #0ea5e9 !important;
  font-weight: 700;
}
</style>
