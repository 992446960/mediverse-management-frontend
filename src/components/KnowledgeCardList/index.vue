<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import type {
  KnowledgeCard,
  CardType,
  OnlineStatus,
  AuditStatus,
  OwnerType,
} from '@/types/knowledge'
import { CARD_TYPE_CONFIG, ONLINE_STATUS_CONFIG, AUDIT_STATUS_CONFIG } from '@/types/knowledge'
import KnowledgeCardEditor from '../KnowledgeCardEditor/index.vue'
import KnowledgeCardViewer from '../KnowledgeCardViewer/index.vue'
import PageHead from '@/components/PageHead/index.vue'
import PageFilter from '@/components/PageFilter/index.vue'
import PageTable from '@/components/PageTable/index.vue'
import type { PageHeadConfig } from '@/components/PageHead/types'
import type { PageFilterConfig } from '@/components/PageFilter/types'
import type { PageTableConfig, PageTableColumnConfig } from '@/components/PageTable/types'
import dayjs from 'dayjs'

defineProps<{
  ownerType: OwnerType
  ownerId: string
}>()

defineEmits<{
  (e: 'success'): void
}>()

const pageFilterRef = ref<InstanceType<typeof PageFilter> | null>(null)
const pageTableRef = ref<InstanceType<typeof PageTable> | null>(null)

const activeTab = ref<CardType | 'all'>('all')
const loading = ref(false)
const tableData = ref<KnowledgeCard[]>([])
const total = ref(0)

// 编辑器和查看器状态
const editorVisible = ref(false)
const editingCard = ref<KnowledgeCard | undefined>(undefined)
const viewerVisible = ref(false)
const viewingCardId = ref<string | null>(null)

const headConf = computed<PageHeadConfig>(() => ({
  title: '知识卡管理',
  btns: [
    {
      text: '新建知识卡',
      type: 'primary',
      icon: PlusOutlined,
      handle: handleCreate,
    },
  ],
  tabsOptions: [
    { label: '全部', value: 'all' },
    { label: '循证卡', value: 'evidence' },
    { label: '规则卡', value: 'rule' },
    { label: '经验卡', value: 'experience' },
  ],
  defaultTab: activeTab.value,
  tabChangeHandle: (val) => {
    activeTab.value = val as CardType | 'all'
    handleSearch()
  },
}))

const filterConf = computed<PageFilterConfig>(() => ({
  filterForm: [
    {
      key: 'keyword',
      label: '搜索',
      type: 'input',
      ph: '搜索标题或内容',
      col: 8,
      icon: SearchOutlined,
    },
    {
      key: 'online_status',
      label: '上线状态',
      type: 'select',
      ph: '全部',
      col: 6,
      options: Object.entries(ONLINE_STATUS_CONFIG).map(([value, cfg]) => ({
        label: cfg.label,
        value,
      })),
      clearable: true,
    },
    {
      key: 'audit_status',
      label: '审核状态',
      type: 'select',
      ph: '全部',
      col: 6,
      options: Object.entries(AUDIT_STATUS_CONFIG).map(([value, cfg]) => ({
        label: cfg.label,
        value,
      })),
      clearable: true,
    },
  ],
  btns: [
    {
      text: '查询',
      type: 'primary',
      icon: SearchOutlined,
      handle: handleSearch,
    },
    {
      text: '重置',
      icon: ReloadOutlined,
      handle: () => {
        pageFilterRef.value?.filterFormReset()
        handleSearch()
      },
    },
  ],
  btnsCol: 4,
}))

const tableConf = computed<PageTableConfig>(() => ({
  isLoading: loading.value,
  total: total.value,
  updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  rowKey: 'id',
}))

const tableColumns = computed<PageTableColumnConfig[]>(() => [
  {
    label: '标题',
    prop: 'title',
    width: 250,
    type: 'slot',
    slotName: 'title',
  },
  {
    label: '类型',
    prop: 'type',
    width: 100,
    type: 'scope',
    scopeType: '_tag',
    tagType: (row) => CARD_TYPE_CONFIG[row.type as CardType].color,
    tagText: (row) => CARD_TYPE_CONFIG[row.type as CardType].label,
  },
  {
    label: '状态',
    prop: 'online_status',
    width: 120,
    type: 'scope',
    scopeType: '_tag',
    tagType: (row) => (row.online_status === 'online' ? 'success' : 'default'),
    tagText: (row) => ONLINE_STATUS_CONFIG[row.online_status as OnlineStatus].label,
  },
  {
    label: '审核状态',
    prop: 'audit_status',
    width: 120,
    type: 'scope',
    scopeType: '_tag',
    tagType: (row) => AUDIT_STATUS_CONFIG[row.audit_status as AuditStatus].color,
    tagText: (row) => AUDIT_STATUS_CONFIG[row.audit_status as AuditStatus].label,
  },
  {
    label: '引用次数',
    prop: 'reference_count',
    width: 100,
    align: 'center',
  },
  {
    label: '更新时间',
    prop: 'updated_at',
    width: 160,
    formatter: (row) => dayjs(row.updated_at as string).format('YYYY-MM-DD HH:mm'),
  },
  {
    label: '操作',
    type: 'operation',
    width: 240,
    fixed: 'right',
    btns: [
      {
        text: '详情',
        icon: EyeOutlined,
        handle: (row) => handleView(row as unknown as KnowledgeCard),
      },
      {
        text: '编辑',
        icon: EditOutlined,
        handle: (row) => handleEdit(row as unknown as KnowledgeCard),
      },
      {
        text: '上下线',
        dynamicText: (row) => (row.online_status === 'online' ? '下线' : '上线'),
        dynamicIcon: (row) =>
          row.online_status === 'online' ? CloudDownloadOutlined : CloudUploadOutlined,
        type: 'popconfirm',
        dynamicPopconfirmTitle: (row) =>
          `确定要${row.online_status === 'online' ? '下线' : '上线'}该知识卡吗？`,
        handle: (row) => handleStatusToggle(row as unknown as KnowledgeCard),
      },
      {
        text: '删除',
        icon: DeleteOutlined,
        color: 'danger',
        type: 'popconfirm',
        popconfirmTitle: '确定要删除吗？',
        handle: () => handleDelete(),
      },
    ],
  },
])

const fetchData = async () => {
  const params = pageFilterRef.value?.filteParams ?? {}
  const page = pageTableRef.value?.currentPage ?? 1
  const pageSize = pageTableRef.value?.pageSize ?? 10

  loading.value = true
  try {
    // 这里实际应调用 axios.get
    const mockCards = (await import('../../mocks/data/knowledgeCards')).mockKnowledgeCards
    let filtered = [...mockCards]

    if (activeTab.value !== 'all') {
      filtered = filtered.filter((c) => c.type === activeTab.value)
    }
    if (params.keyword) {
      const kw = String(params.keyword).toLowerCase()
      filtered = filtered.filter((c) => c.title.toLowerCase().includes(kw))
    }
    if (params.online_status) {
      filtered = filtered.filter((c) => c.online_status === params.online_status)
    }
    if (params.audit_status) {
      filtered = filtered.filter((c) => c.audit_status === params.audit_status)
    }

    total.value = filtered.length
    tableData.value = filtered.slice((page - 1) * pageSize, page * pageSize)
  } catch (err) {
    console.error('Fetch failed:', err)
    message.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

const handleSearch = () => {
  pageTableRef.value?.resetCurPage(1)
  fetchData()
}

const handleCreate = () => {
  editingCard.value = undefined
  editorVisible.value = true
}

const handleEdit = (record: KnowledgeCard) => {
  editingCard.value = record
  editorVisible.value = true
}

const handleView = (record: KnowledgeCard) => {
  viewingCardId.value = record.id
  viewerVisible.value = true
}

const handleDelete = async () => {
  try {
    // 模拟 API 调用
    message.success('删除成功')
    fetchData()
  } catch (err) {
    console.error('Delete failed:', err)
    message.error('删除失败')
  }
}

const handleStatusToggle = async (record: KnowledgeCard) => {
  const newStatus = record.online_status === 'online' ? 'offline' : 'online'
  try {
    // 模拟 API 调用
    record.online_status = newStatus
    message.success(`已${newStatus === 'online' ? '上线' : '下线'}`)
  } catch (err) {
    console.error('Status toggle failed:', err)
    message.error('操作失败')
  }
}
</script>

<template>
  <div class="knowledge-card-list flex flex-1 flex-col overflow-hidden">
    <div class="app-container p-4 mb-4">
      <PageHead :head-conf="headConf" />
      <PageFilter ref="pageFilterRef" :filter-conf="filterConf" @fetch-table-data="handleSearch" />
    </div>

    <div class="app-container p-0 flex-1 flex flex-col min-h-0">
      <PageTable
        ref="pageTableRef"
        :table-conf="tableConf"
        :table-columns="tableColumns"
        :table-data="tableData as unknown as Record<string, unknown>[]"
        @fetch-table-data="fetchData"
      >
        <template #title="{ row }">
          <div class="flex flex-col">
            <span class="font-medium text-gray-800">{{ (row as KnowledgeCard).title }}</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <Tag v-for="tag in (row as KnowledgeCard).tags" :key="tag" size="small">
                {{ tag }}
              </Tag>
            </div>
          </div>
        </template>
      </PageTable>
    </div>

    <KnowledgeCardEditor
      v-model:visible="editorVisible"
      :card="editingCard"
      :owner-type="ownerType"
      :owner-id="ownerId"
      @success="fetchData"
    />

    <KnowledgeCardViewer
      v-model:visible="viewerVisible"
      :card-id="viewingCardId"
      :owner-type="ownerType"
      :owner-id="ownerId"
      @rollback-success="fetchData"
    />
  </div>
</template>
