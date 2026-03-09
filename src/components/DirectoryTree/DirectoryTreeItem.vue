<template>
  <div
    class="directory-tree-item"
    :class="{ 'is-active': selectedKey === node.key }"
    @click.stop="$emit('node-click', node)"
  >
    <div
      class="flex items-center gap-2 px-5 py-2.5 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group border-l-[3px] border-transparent"
      :style="{ paddingLeft: `${level * 16 + 20}px` }"
      :class="selectedKey === node.key ? 'item-active' : 'text-slate-600 dark:text-slate-400'"
    >
      <!-- 展开/收起图标 -->
      <span
        v-if="node.children?.length"
        class="w-4 h-4 flex items-center justify-center text-slate-400 transition-transform"
        :class="{ 'rotate-90': isExpanded }"
        @click.stop="toggleExpand"
      >
        <CaretRightOutlined class="text-[12px]" />
      </span>
      <span v-else class="w-4 h-4" />

      <!-- 文件夹图标 -->
      <FolderOpenOutlined v-if="isExpanded" class="text-[16px] text-primary/80" />
      <FolderOutlined v-else class="text-[16px] text-slate-400" />

      <!-- 目录名称 -->
      <span class="text-[14px] font-medium truncate flex-1">{{ node.label }}</span>

      <!-- 文件数量 -->
      <span class="text-[12px] text-slate-400 group-hover:hidden">{{ node.file_count }}</span>

      <!-- 操作按钮（仅非虚拟节点显示新增） -->
      <div v-if="!isVirtual" class="hidden group-hover:flex items-center gap-1">
        <a-tooltip :title="t('knowledge.addSubtitle')">
          <PlusOutlined
            class="text-[14px] text-slate-400 hover:text-primary transition-colors p-1"
            @click.stop="$emit('add-click', node)"
          />
        </a-tooltip>
      </div>
    </div>

    <!-- 子节点递归 -->
    <div v-if="isExpanded && node.children?.length">
      <DirectoryTreeItem
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :level="level + 1"
        :selected-key="selectedKey"
        @node-click="$emit('node-click', $event)"
        @add-click="$emit('add-click', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  FolderOutlined,
  FolderOpenOutlined,
  CaretRightOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import type { DirectoryTreeNode } from './types'

const props = defineProps<{
  node: DirectoryTreeNode
  level: number
  selectedKey: string
  isVirtual?: boolean
}>()

defineEmits<{
  (e: 'node-click', node: DirectoryTreeNode): void
  (e: 'add-click', node: DirectoryTreeNode): void
}>()

const { t } = useI18n()
const isExpanded = ref(false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function expand() {
  isExpanded.value = true
}

defineExpose({ expand })
</script>

<style scoped>
.item-active {
  background-color: rgb(14 165 233 / 0.05);
  color: #0ea5e9;
  border-left-color: #0ea5e9 !important;
  font-weight: 700;
}
</style>
