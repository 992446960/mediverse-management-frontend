<template>
  <div class="org-dept-tree">
    <a-spin :spinning="loading">
      <a-tree
        v-if="treeData.length > 0"
        :tree-data="treeData"
        :selected-keys="selectedKeys"
        :field-names="{ key: 'key', title: 'title', children: 'children' }"
        block-node
        @select="onSelect"
      />
      <a-empty v-else :description="t('common.noData')" class="py-4" />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { getDepartmentsTree } from '@/api/departments'
import type { OrgDeptTreeNode } from '@/types/department'

interface TreeNodeOption {
  key: string
  title: string
  children?: TreeNodeOption[]
}

interface Props {
  /** 是否展示科室子节点（科室管理=false，用户管理=true） */
  showDepartments?: boolean
  /** 当前选中节点 key（org_xxx / dept_xxx） */
  selectedKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  showDepartments: false,
  selectedKey: '',
})

const emit = defineEmits<{
  (e: 'node-click', payload: { type: 'org' | 'dept'; id: string; name: string }): void
}>()

const { t } = useI18n()
const authStore = useAuthStore()

const loading = ref(false)
const rawTree = ref<OrgDeptTreeNode[]>([])

const selectedKeys = computed(() => (props.selectedKey ? [props.selectedKey] : []))

function toTreeOption(node: OrgDeptTreeNode, prefix: 'org' | 'dept'): TreeNodeOption {
  const key = `${prefix}_${node.id}`
  const children =
    props.showDepartments && node.children?.length
      ? node.children.map(c => toTreeOption(c, 'dept'))
      : undefined
  return {
    key,
    title: node.name,
    children,
  }
}

const treeData = computed<TreeNodeOption[]>(() => {
  let list = rawTree.value
  if (authStore.isOrgAdmin && authStore.currentOrgId) {
    list = list.filter(n => n.type === 'org' && n.id === authStore.currentOrgId)
  }
  return list
    .filter(n => n.type === 'org')
    .map(n => toTreeOption(n, 'org'))
})

function findTitleByKey(data: TreeNodeOption[], key: string): string {
  for (const node of data) {
    if (node.key === key) return node.title
    if (node.children) {
      const found = findTitleByKey(node.children, key)
      if (found) return found
    }
  }
  return ''
}

function onSelect(selectedKeysVal: (string | number)[], e: { node?: { key?: string; title?: string }; selectedNodes?: Array<{ key?: string; title?: string }> }) {
  const key = selectedKeysVal[0] != null ? String(selectedKeysVal[0]) : ''
  if (!key) return
  const title = e.node?.title ?? e.selectedNodes?.[0]?.title ?? findTitleByKey(treeData.value, key)
  const [type, id] = key.startsWith('org_') ? ['org', key.slice(4)] : ['dept', key.slice(5)]
  emit('node-click', {
    type: type as 'org' | 'dept',
    id,
    name: title || '',
  })
}

async function loadTree() {
  loading.value = true
  try {
    rawTree.value = await getDepartmentsTree()
  }
  finally {
    loading.value = false
  }
}

onMounted(loadTree)
</script>
