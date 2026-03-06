<template>
  <div class="pro-components-example p-4">
    <h1 class="text-lg font-semibold mb-4">
      通用组件示例（ProTable + ModalForm）
    </h1>

    <section class="mb-8">
      <h2 class="text-base font-medium mb-2">
        ProTable 示例
      </h2>
      <p class="text-gray-600 mb-2">
        列配置、dataSource、loading、操作列插槽、空状态、可选分页。
      </p>
      <div class="mb-2 flex gap-2">
        <a-button type="primary" @click="openCreateModal">
          新增
        </a-button>
        <a-button @click="toggleLoading">
          {{ loading ? '取消加载' : '模拟加载' }}
        </a-button>
        <a-button @click="toggleEmpty">
          {{ showEmpty ? '显示数据' : '清空数据' }}
        </a-button>
      </div>
      <ProTable
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 800 }"
        empty-text="暂无数据"
        :pagination="paginationConfig"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-badge
              :status="record.status === 'active' ? 'success' : 'default'"
              :text="record.status === 'active' ? '启用' : '停用'"
            />
          </template>
          <template v-else-if="column.key === 'created_at'">
            {{ formatDate(record.created_at) }}
          </template>
        </template>
        <template #actions="{ record }">
          <a-space>
            <a-button type="link" size="small" @click="openEditModal(record)">
              编辑
            </a-button>
            <a-button type="link" size="small" danger @click="handleDelete(record)">
              删除
            </a-button>
          </a-space>
        </template>
      </ProTable>
    </section>

    <section>
      <h2 class="text-base font-medium mb-2">
        ModalForm 示例
      </h2>
      <p class="text-gray-600 mb-2">
        配置化 formItems、initialValues 回填、提交后关闭。
      </p>
      <ModalForm
        v-model:open="modalOpen"
        :title="editingRecord ? '编辑项' : '新增项'"
        :initial-values="initialFormValues"
        :form-items="formItems"
        :confirm-loading="confirmLoading"
        @submit="handleFormSubmit"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { ProTable } from '@/components/Table'
import { ModalForm } from '@/components/Form'
import type { ColumnsType } from 'ant-design-vue/es/table'
import type { ProTablePagination } from '@/components/Table/types'
import type { ModalFormItemConfig } from '@/components/Form/types'

interface MockRecord {
  id: string
  name: string
  code: string
  status: 'active' | 'inactive'
  created_at: string
}

const list = ref<MockRecord[]>([
  { id: '1', name: '示例机构 A', code: 'ORG-A', status: 'active', created_at: '2024-01-15T10:00:00Z' },
  { id: '2', name: '示例机构 B', code: 'ORG-B', status: 'inactive', created_at: '2024-02-20T14:30:00Z' },
])

const loading = ref(false)
const showEmpty = ref(false)
const tableData = computed(() => (showEmpty.value ? [] : list.value))

const columns: ColumnsType<Record<string, unknown>> = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 160, ellipsis: true },
  { title: '编码', dataIndex: 'code', key: 'code', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '操作', key: 'actions', fixed: 'right', width: 160 },
]

const paginationState = ref({ current: 1, pageSize: 10, total: 2 })
const paginationConfig = computed<ProTablePagination>(() => ({
  current: paginationState.value.current,
  pageSize: paginationState.value.pageSize,
  total: paginationState.value.total,
  onChange: (page: number, pageSize: number) => {
    paginationState.value = {
      current: page,
      pageSize,
      total: paginationState.value.total,
    }
  },
}))

function onTableChange(pagination: ProTablePagination) {
  paginationState.value = {
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
  }
}

function formatDate(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

function toggleLoading() {
  loading.value = !loading.value
}

function toggleEmpty() {
  showEmpty.value = !showEmpty.value
}

// ModalForm
const modalOpen = ref(false)
const editingRecord = ref<MockRecord | null>(null)
const confirmLoading = ref(false)

const formItems: ModalFormItemConfig[] = [
  {
    name: 'name',
    label: '名称',
    type: 'input',
    placeholder: '请输入名称',
    maxlength: 100,
    rules: [{ required: true, message: '请输入名称', trigger: 'blur' }, { max: 100, message: '最多 100 字', trigger: 'blur' }],
  },
  {
    name: 'code',
    label: '编码',
    type: 'input',
    placeholder: '请输入编码',
    rules: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  },
  {
    name: 'description',
    label: '描述',
    type: 'textarea',
    placeholder: '选填',
    rows: 3,
  },
]

const initialFormValues = computed(() => {
  const r = editingRecord.value
  if (!r) return {}
  return {
    name: r.name,
    code: r.code,
    description: '',
  }
})

function openCreateModal() {
  editingRecord.value = null
  modalOpen.value = true
}

function openEditModal(record: MockRecord) {
  editingRecord.value = record
  modalOpen.value = true
}

async function handleFormSubmit(values: Record<string, unknown>) {
  confirmLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  confirmLoading.value = false
  console.log('ModalForm submit:', values)
  if (editingRecord.value) {
    const idx = list.value.findIndex(i => i.id === editingRecord.value!.id)
    const row = idx >= 0 ? list.value[idx] : undefined
    if (row) {
      list.value[idx] = {
        id: row.id,
        name: String(values.name ?? ''),
        code: String(values.code ?? ''),
        status: row.status,
        created_at: row.created_at,
      }
    }
  }
  else {
    list.value.push({
      id: String(Date.now()),
      name: String(values.name ?? ''),
      code: String(values.code ?? ''),
      status: 'active',
      created_at: new Date().toISOString(),
    })
    paginationState.value.total = list.value.length
  }
}

function handleDelete(record: MockRecord) {
  const idx = list.value.findIndex(i => i.id === record.id)
  if (idx >= 0) {
    list.value.splice(idx, 1)
    paginationState.value.total = list.value.length
  }
}
</script>
