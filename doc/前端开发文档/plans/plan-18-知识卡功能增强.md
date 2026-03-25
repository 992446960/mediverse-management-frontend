# Plan 18: 知识卡功能增强（列表筛选 + 版本对比 + 创建关联文件）

> 来源：PRD 知识卡功能清单第 3–8、10–12 项
> 前置依赖：Plan 10（知识卡通用组件集已实现）
> 项目目录：`mediverse-management-frontend/`

---

## 一、需求总览

| # | 功能点 | 说明 |
|---|--------|------|
| 3 | 列表新增 `source_file_id` 远程搜索筛选 | 默认展示对应知识库前 50 条文件，支持关键字远程搜索 |
| 4 | 列表新增 `tag` 筛选 | 输入框自由输入标签文本进行筛选 |
| 5 | 创建知识卡支持关联文件 | 新增 `source_file_ids` 字段到 Payload |
| 6 | 编辑知识卡 **不**支持修改关联文件 | 严格遵守 API 文档（4.1.10 无 source_file_ids 字段） |
| 7 | 版本 Timeline 「预览」改为「对比」 | 去掉旧版本预览，改为调用 diff 接口 |
| 8 | Viewer 新增「版本对比」Tab | 展示 diff 结果，支持单栏 / 左右分栏切换 |
| 10 | 对比默认行为 | 点击某版本「对比」→ 默认 from=该版本, to=最新版本 |
| 11 | 自定义对比版本 | 对比 Tab 顶部双 Select 可自由选择 from/to |
| 12 | 版本回滚保留 | Timeline 非当前版本仍展示「回退」按钮 |

**不实现：** 1（删除知识卡）、2（批量操作）、9（预览旧版本内容——已用 diff 替代）

---

## 二、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 V2.0 | `doc/初始文档/API设计V2.0.md` | 4.1.7 知识卡列表 · 4.1.9 创建知识卡 · 4.1.12 版本列表 · 4.1.13 版本对比 |
| 项目开发规范 | `doc/前端开发文档/项目开发规范.md` | 全文（组件/API/Mock/i18n/样式规范） |
| Plan 10 | `doc/前端开发文档/plans/plan-10-知识卡通用组件集.md` | 知识卡基础组件上下文 |

---

## 三、计划内容

### Step 1：类型定义补全

> 涉及文件：`src/types/knowledge.ts`

**1.1** `KnowledgeCardListParams` 新增两个可选字段：

```typescript
export interface KnowledgeCardListParams extends PaginationParams {
  type?: CardType | 'all'
  online_status?: OnlineStatus
  audit_status?: AuditStatus
  keyword?: string
  /** 按来源文件过滤（API 4.1.7） */
  source_file_id?: string
  /** 按标签过滤（API 4.1.7） */
  tag?: string
}
```

**1.2** `KnowledgeCardPayload` 新增 `source_file_ids`：

```typescript
export interface KnowledgeCardPayload {
  id?: string
  title: string
  content: string
  type: CardType
  tags: string[]
  /** 来源文件 ID 列表，仅创建时可选（API 4.1.9） */
  source_file_ids?: string[]
}
```

**1.3** 新增版本对比相关类型：

```typescript
/** 版本 Diff 单元（API 4.1.13） */
export interface VersionDiffSegment {
  type: 'equal' | 'delete' | 'insert'
  content: string
}

/** 版本对比响应（API 4.1.13） */
export interface VersionDiffResult {
  from_version: number
  to_version: number
  diff: VersionDiffSegment[]
}
```

---

### Step 2：API 函数补全

> 涉及文件：`src/api/knowledge.ts`

**2.1** 新增版本对比函数：

```typescript
/**
 * 知识卡版本对比（API 4.1.13）
 * GET /api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/versions/diff
 */
export function getKnowledgeCardVersionDiff(
  ownerType: OwnerType,
  ownerId: string,
  cardId: string,
  fromVersion: number,
  toVersion: number
) {
  return request.get<VersionDiffResult>(
    `${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}/versions/diff`,
    { params: { from_version: fromVersion, to_version: toVersion } }
  )
}
```

**2.2** `updateKnowledgeCard` 已正确排除 `source_file_ids`（仅接受 `title/content/tags/change_summary`），**无需修改**，符合 API 4.1.10。

**2.3** `saveKnowledgeCard`（创建）已使用 `KnowledgeCardPayload`，增加 `source_file_ids` 后自动传递，**无需修改函数签名**。

---

### Step 3：Mock 数据 & Handler 补全

> 涉及文件：`src/mocks/handlers/knowledge.ts`、`src/mocks/data/knowledgeCards.ts`

**3.1** 版本 Mock 数据补充 `content` 字段（现有 `mockCardVersions` 可能已有，确认并补全）。

**3.2** 知识卡列表 Handler 增加 `source_file_id` 和 `tag` 查询参数的过滤逻辑：

```typescript
// 从 url.searchParams 读取
const sourceFileId = url.searchParams.get('source_file_id')
const tag = url.searchParams.get('tag')

// 过滤逻辑
if (sourceFileId) {
  filtered = filtered.filter((c) =>
    c.source_files?.some((s) => s.id === sourceFileId)
  )
}
if (tag) {
  filtered = filtered.filter((c) =>
    c.tags?.some((t) => t.includes(tag))
  )
}
```

**3.3** 新增版本对比 Handler：

```typescript
// GET .../cards/:id/versions/diff
http.get(`${API_BASE}/knowledge/:ownerType/:ownerId/cards/:id/versions/diff`, async ({ request, params }) => {
  await delay(300)
  const url = new URL(request.url)
  const fromVersion = Number(url.searchParams.get('from_version'))
  const toVersion = Number(url.searchParams.get('to_version'))
  // 基于 mockCardVersions 生成模拟 diff
  return HttpResponse.json({
    code: 0,
    message: 'ok',
    data: {
      from_version: fromVersion,
      to_version: toVersion,
      diff: [
        { type: 'equal', content: '## 一线降压药\n\n' },
        { type: 'delete', content: '初始剂量 5mg/天' },
        { type: 'insert', content: '初始剂量 10mg/天（2026版指南更新）' },
        { type: 'equal', content: '\n\n## 二线降压药\n\n联合用药方案保持不变。' },
      ],
    },
  })
})
```

**3.4** 创建知识卡 Handler 增加 `source_file_ids` 字段处理：从 body 读取，写入新卡的 `source_files` 数组。

---

### Step 4：列表筛选增强 — `source_file_id` 远程搜索

> 涉及文件：`src/components/KnowledgeCardList/index.vue`

**4.1** 由于 `PageFilter` 组件的 `type` 不支持 `remote-select`（详见 `PageFilter/types.ts` 仅有 `input | select | date | date-range | number-input | slot`），使用 **`slot`** 类型自定义渲染远程搜索 Select。

在 `filterConf` 中新增 slot 类型筛选项：

```typescript
{
  key: 'source_file_id',
  label: t('knowledge.card.sourceFileFilter'),
  type: 'slot',
  slotName: 'sourceFileFilter',
  col: 8,
}
```

**4.2** 在 template 中 `<PageFilter>` 内新增具名插槽：

```vue
<template #sourceFileFilter="{ formData }">
  <a-select
    v-model:value="formData.source_file_id"
    show-search
    allow-clear
    :placeholder="t('knowledge.card.sourceFilePlaceholder')"
    :filter-option="false"
    :options="sourceFileOptions"
    :loading="sourceFileLoading"
    @search="handleSourceFileSearch"
  />
</template>
```

**4.3** 新增远程搜索逻辑（script setup）：

```typescript
import { getFileList } from '@/api/knowledge'

const sourceFileOptions = ref<Array<{ label: string; value: string }>>([])
const sourceFileLoading = ref(false)

/** 初始加载默认 50 条 */
async function loadDefaultSourceFiles() {
  sourceFileLoading.value = true
  try {
    const { items } = await getFileList(props.ownerType, props.ownerId, {
      page: 1,
      page_size: 50,
    })
    sourceFileOptions.value = items.map((f) => ({
      label: f.file_name,
      value: f.id,
    }))
  } finally {
    sourceFileLoading.value = false
  }
}

/** 关键词远程搜索（防抖 300ms） */
let searchTimer: ReturnType<typeof setTimeout> | null = null
function handleSourceFileSearch(keyword: string) {
  if (searchTimer) clearTimeout(searchTimer)
  if (!keyword) {
    loadDefaultSourceFiles()
    return
  }
  searchTimer = setTimeout(async () => {
    sourceFileLoading.value = true
    try {
      const { items } = await getFileList(props.ownerType, props.ownerId, {
        page: 1,
        page_size: 50,
        keyword,
      })
      sourceFileOptions.value = items.map((f) => ({
        label: f.file_name,
        value: f.id,
      }))
    } finally {
      sourceFileLoading.value = false
    }
  }, 300)
}

onMounted(() => {
  loadDefaultSourceFiles()
})
```

**4.4** `fetchData` 中将 `source_file_id` 传入请求参数：

```typescript
source_file_id: (params.source_file_id as string) || undefined,
```

---

### Step 5：列表筛选增强 — `tag` 输入框筛选

> 涉及文件：`src/components/KnowledgeCardList/index.vue`

**5.1** 在 `filterConf` 中新增 input 类型筛选项：

```typescript
{
  key: 'tag',
  label: t('knowledge.card.tagsLabel'),
  type: 'input',
  ph: t('knowledge.card.tagFilterPlaceholder'),
  col: 6,
}
```

**5.2** `fetchData` 中将 `tag` 传入请求参数：

```typescript
tag: (params.tag as string) || undefined,
```

---

### Step 6：创建知识卡支持关联文件

> 涉及文件：`src/components/KnowledgeCardEditor/index.vue`

**6.1** 新增关联文件选择区域（仅在**创建模式**时展示）：

```vue
<!-- 关联文件选择：仅创建模式 -->
<a-form-item
  v-if="!isEditMode"
  :label="t('knowledge.card.sourceFileLabel')"
>
  <a-select
    v-model:value="formState.source_file_ids"
    mode="multiple"
    show-search
    allow-clear
    :placeholder="t('knowledge.card.sourceFilePlaceholder')"
    :filter-option="false"
    :options="editorSourceFileOptions"
    :loading="editorSourceFileLoading"
    @search="handleEditorSourceFileSearch"
  />
</a-form-item>
```

**6.2** 判断 `isEditMode`：

```typescript
const isEditMode = computed(() => !!props.card?.id)
```

**6.3** 远程搜索逻辑与 Step 4 类似（默认加载 50 条 + 关键词搜索），提取为 `composable` 以复用（见 Step 7）。

**6.4** 表单提交时，创建模式传递 `source_file_ids`：

```typescript
const payload: KnowledgeCardPayload = {
  title: formState.title,
  content: formState.content,
  type: formState.type,
  tags: formState.tags,
  ...(isEditMode.value ? {} : { source_file_ids: formState.source_file_ids }),
}
```

**6.5** 编辑模式下，关联文件区域**不展示**（API 4.1.10 不支持修改关联文件）。

---

### Step 7：提取文件远程搜索 Composable

> 涉及文件：`src/composables/useFileRemoteSearch.ts`（新建）

Step 4 和 Step 6 都需要文件远程搜索，提取为可复用 composable：

```typescript
import type { OwnerType, FileListItem } from '@/types/knowledge'
import { getFileList } from '@/api/knowledge'

export function useFileRemoteSearch(
  ownerType: Ref<OwnerType> | OwnerType,
  ownerId: Ref<string> | string,
  pageSize = 50
) {
  const options = ref<Array<{ label: string; value: string }>>([])
  const loading = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  const ot = () => (typeof ownerType === 'string' ? ownerType : ownerType.value)
  const oi = () => (typeof ownerId === 'string' ? ownerId : ownerId.value)

  async function loadDefault() {
    loading.value = true
    try {
      const { items } = await getFileList(ot(), oi(), { page: 1, page_size: pageSize })
      options.value = items.map((f) => ({ label: f.file_name, value: f.id }))
    } finally {
      loading.value = false
    }
  }

  function search(keyword: string) {
    if (timer) clearTimeout(timer)
    if (!keyword) {
      loadDefault()
      return
    }
    timer = setTimeout(async () => {
      loading.value = true
      try {
        const { items } = await getFileList(ot(), oi(), {
          page: 1,
          page_size: pageSize,
          keyword,
        })
        options.value = items.map((f) => ({ label: f.file_name, value: f.id }))
      } finally {
        loading.value = false
      }
    }, 300)
  }

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return { options, loading, loadDefault, search }
}
```

---

### Step 8：VersionTimeline 改造（预览→对比）

> 涉及文件：`src/components/KnowledgeCardViewer/VersionTimeline.vue`

**8.1** 移除 `preview` 事件，新增 `compare` 事件：

```typescript
const emit = defineEmits<{
  (e: 'compare', fromVersion: number, toVersion: number): void
  (e: 'rollback', version: string, targetVersion: number): void
}>()
```

**8.2** 将 `<EyeOutlined>` 预览按钮替换为 `<SwapOutlined>` 或 `<DiffOutlined>` 对比按钮：

```vue
<a-button type="link" size="small" @click="handleCompare(v)">
  <template #icon><SwapOutlined /></template>
  {{ t('knowledge.card.compare') }}
</a-button>
```

**8.3** 对比点击处理（默认 from=点击版本, to=最新版本）：

```typescript
import type { KnowledgeCardVersion } from '@/types/knowledge'

const props = defineProps<{
  versions: KnowledgeCardVersion[]
  currentVersion: string
}>()

function handleCompare(v: KnowledgeCardVersion) {
  // 从版本字符串提取版本号，如 "v3" → 3
  const fromNum = extractVersionNumber(v.version)
  const latestVersion = props.versions[0] // 版本列表按新→旧排序
  const toNum = extractVersionNumber(latestVersion.version)
  if (fromNum != null && toNum != null) {
    emit('compare', fromNum, toNum)
  }
}

function extractVersionNumber(version: string): number | null {
  const m = version.match(/(\d+)/)
  return m ? Number(m[1]) : null
}
```

**8.4** 非当前版本保留「回退」按钮（逻辑不变）。

---

### Step 9：新增版本对比 Tab 及 Diff 渲染组件

> 涉及文件：
> - `src/components/KnowledgeCardViewer/VersionDiffView.vue`（新建）
> - `src/components/KnowledgeCardViewer/index.vue`（修改）

#### 9.1 新建 `VersionDiffView.vue`

**Props**：

```typescript
interface Props {
  diff: VersionDiffSegment[]
  fromVersion: number
  toVersion: number
  versions: KnowledgeCardVersion[]   // 用于构建 Select 选项
  loading: boolean
}
```

**Emits**：

```typescript
const emit = defineEmits<{
  (e: 'change-versions', fromVersion: number, toVersion: number): void
}>()
```

**Template 结构**：

```vue
<template>
  <div class="version-diff-view">
    <!-- 顶部版本选择器 -->
    <div class="flex items-center gap-3 mb-4">
      <a-select
        :value="fromVersion"
        :options="versionOptions"
        style="width: 160px"
        @change="(val) => emit('change-versions', val, toVersion)"
      />
      <span class="text-gray-400">→</span>
      <a-select
        :value="toVersion"
        :options="versionOptions"
        style="width: 160px"
        @change="(val) => emit('change-versions', fromVersion, val)"
      />
      <!-- 视图模式切换 -->
      <a-radio-group v-model:value="viewMode" size="small" class="ml-auto">
        <a-radio-button value="unified">
          {{ t('knowledge.card.diffUnified') }}
        </a-radio-button>
        <a-radio-button value="split">
          {{ t('knowledge.card.diffSplit') }}
        </a-radio-button>
      </a-radio-group>
    </div>

    <a-spin :spinning="loading">
      <!-- 单栏模式 -->
      <div v-if="viewMode === 'unified'" class="diff-unified p-4 bg-gray-50 rounded-lg overflow-auto max-h-[calc(100vh-320px)]">
        <template v-for="(seg, i) in diff" :key="i">
          <span v-if="seg.type === 'equal'" class="diff-equal">{{ seg.content }}</span>
          <span v-else-if="seg.type === 'delete'" class="diff-delete">{{ seg.content }}</span>
          <span v-else-if="seg.type === 'insert'" class="diff-insert">{{ seg.content }}</span>
        </template>
      </div>

      <!-- 左右分栏模式 -->
      <div v-else class="diff-split grid grid-cols-2 gap-4">
        <div class="p-4 bg-gray-50 rounded-lg overflow-auto max-h-[calc(100vh-320px)]">
          <div class="text-xs text-gray-400 mb-2 font-medium">v{{ fromVersion }}</div>
          <template v-for="(seg, i) in diff" :key="'l-' + i">
            <span v-if="seg.type === 'equal'" class="diff-equal">{{ seg.content }}</span>
            <span v-else-if="seg.type === 'delete'" class="diff-delete">{{ seg.content }}</span>
            <!-- insert 在左侧不显示 -->
          </template>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg overflow-auto max-h-[calc(100vh-320px)]">
          <div class="text-xs text-gray-400 mb-2 font-medium">v{{ toVersion }}</div>
          <template v-for="(seg, i) in diff" :key="'r-' + i">
            <span v-if="seg.type === 'equal'" class="diff-equal">{{ seg.content }}</span>
            <span v-else-if="seg.type === 'insert'" class="diff-insert">{{ seg.content }}</span>
            <!-- delete 在右侧不显示 -->
          </template>
        </div>
      </div>
    </a-spin>
  </div>
</template>
```

**样式（scoped）**：

```css
.diff-equal {
  white-space: pre-wrap;
}
.diff-delete {
  background-color: #fdd;
  text-decoration: line-through;
  white-space: pre-wrap;
  color: var(--color-error);
}
.diff-insert {
  background-color: #dfd;
  white-space: pre-wrap;
  color: var(--color-success);
}
```

#### 9.2 修改 `KnowledgeCardViewer/index.vue`

**9.2.1** 新增 import 和状态：

```typescript
import { getKnowledgeCardVersionDiff } from '@/api/knowledge'
import type { VersionDiffResult, VersionDiffSegment } from '@/types/knowledge'
import VersionDiffView from './VersionDiffView.vue'

const diffResult = ref<VersionDiffSegment[]>([])
const diffFrom = ref<number>(0)
const diffTo = ref<number>(0)
const diffLoading = ref(false)
```

**9.2.2** 移除旧预览逻辑：

- 删除 `previewVersion` ref
- 删除 `handlePreviewVersion` 函数
- 删除 content Tab 中预览版本的蓝色提示条（`v-if="previewVersion"` 块）
- `renderedContent` 不再引用 `previewVersion`：

```typescript
const renderedContent = computed(() => {
  const content = card.value?.content || ''
  const html = marked.parse(content) as string
  return DOMPurify.sanitize(html)
})
```

**9.2.3** 新增「版本对比」Tab（在 versions Tab 之后）：

```vue
<a-tab-pane key="diff" :tab="t('knowledge.card.tabDiff')">
  <VersionDiffView
    :diff="diffResult"
    :from-version="diffFrom"
    :to-version="diffTo"
    :versions="versions"
    :loading="diffLoading"
    @change-versions="handleDiffVersionChange"
  />
</a-tab-pane>
```

**9.2.4** 新增对比处理函数：

```typescript
async function handleCompareFromTimeline(fromVersion: number, toVersion: number) {
  diffFrom.value = fromVersion
  diffTo.value = toVersion
  activeTab.value = 'diff'
  await loadDiff(fromVersion, toVersion)
}

async function handleDiffVersionChange(fromVersion: number, toVersion: number) {
  diffFrom.value = fromVersion
  diffTo.value = toVersion
  await loadDiff(fromVersion, toVersion)
}

async function loadDiff(from: number, to: number) {
  if (!props.cardId || from === to) return
  diffLoading.value = true
  try {
    const result = await getKnowledgeCardVersionDiff(
      props.ownerType, props.ownerId, props.cardId, from, to
    )
    diffResult.value = result.diff
  } catch (err) {
    console.error('Load diff failed:', err)
    message.error(t('knowledge.card.diffFailed'))
    diffResult.value = []
  } finally {
    diffLoading.value = false
  }
}
```

**9.2.5** VersionTimeline 事件由 `@preview` 改为 `@compare`：

```vue
<VersionTimeline
  :versions="versions"
  :current-version="card.version"
  @compare="handleCompareFromTimeline"
  @rollback="handleRollback"
/>
```

---

### Step 10：国际化 Key 补充

> 涉及文件：`src/i18n/locales/zh-CN.ts`、`src/i18n/locales/en-US.ts`

**zh-CN.ts** 在 `knowledge.card` 下新增：

```typescript
// 列表筛选
sourceFileFilter: '来源文件',
sourceFilePlaceholder: '选择或搜索文件',
sourceFileLabel: '关联文件',
tagFilterPlaceholder: '输入标签名筛选',

// 版本对比
compare: '对比',
tabDiff: '版本对比',
diffUnified: '单栏',
diffSplit: '分栏',
diffFailed: '加载版本对比失败',
diffNoData: '请选择两个不同版本进行对比',
diffFromLabel: '旧版本',
diffToLabel: '新版本',
```

**en-US.ts** 对应新增：

```typescript
sourceFileFilter: 'Source File',
sourceFilePlaceholder: 'Select or search files',
sourceFileLabel: 'Associated Files',
tagFilterPlaceholder: 'Enter tag to filter',

compare: 'Compare',
tabDiff: 'Version Diff',
diffUnified: 'Unified',
diffSplit: 'Split',
diffFailed: 'Failed to load version diff',
diffNoData: 'Select two different versions to compare',
diffFromLabel: 'Old version',
diffToLabel: 'New version',
```

同时移除旧预览相关 key（若不再使用）：

```
previewingVersion → 保留或移除（此处移除）
exitPreview → 保留或移除（此处移除）
```

---

### Step 11：清理旧预览相关代码

> 涉及文件：多文件

| 位置 | 清理内容 |
|------|---------|
| `VersionTimeline.vue` | 移除 `EyeOutlined` import，移除 `preview` emit |
| `KnowledgeCardViewer/index.vue` | 移除 `previewVersion` ref、`handlePreviewVersion` 函数、预览蓝色提示条 |
| `zh-CN.ts` / `en-US.ts` | 移除 `previewingVersion`、`exitPreview`（如无其他引用） |

---

## 四、文件变更清单

| 操作 | 文件路径 | Step |
|------|---------|------|
| 修改 | `src/types/knowledge.ts` | 1 |
| 修改 | `src/api/knowledge.ts` | 2 |
| 修改 | `src/mocks/handlers/knowledge.ts` | 3 |
| 修改 | `src/mocks/data/knowledgeCards.ts` | 3 |
| 修改 | `src/components/KnowledgeCardList/index.vue` | 4, 5 |
| 修改 | `src/components/KnowledgeCardEditor/index.vue` | 6 |
| **新建** | `src/composables/useFileRemoteSearch.ts` | 7 |
| 修改 | `src/components/KnowledgeCardViewer/VersionTimeline.vue` | 8 |
| **新建** | `src/components/KnowledgeCardViewer/VersionDiffView.vue` | 9 |
| 修改 | `src/components/KnowledgeCardViewer/index.vue` | 9, 11 |
| 修改 | `src/i18n/locales/zh-CN.ts` | 10 |
| 修改 | `src/i18n/locales/en-US.ts` | 10 |

---

## 五、执行顺序与依赖关系

```
Step 1 (类型) ─┬─→ Step 2 (API) ─→ Step 3 (Mock)
               │
               ├─→ Step 7 (Composable) ─┬─→ Step 4 (列表: source_file_id)
               │                        └─→ Step 6 (编辑器: 关联文件)
               │
               └─→ Step 5 (列表: tag 筛选) ← 独立，可与 Step 4 并行

Step 2 ─→ Step 8 (Timeline 改造) ─→ Step 9 (Diff Tab + 渲染组件)

Step 10 (i18n) ← 贯穿全程，每个 Step 中涉及新文案时同步添加
Step 11 (清理) ← 最后执行，确保无遗漏引用
```

---

## 六、验收清单

### 列表筛选
- [ ] `source_file_id` 远程搜索 Select 默认展示 50 条文件
- [ ] 输入关键词后 300ms 防抖远程搜索，结果正确更新
- [ ] 选择文件后列表正确过滤，清空后恢复全部
- [ ] 个人/科室/机构知识库分别搜索对应 ownerType 的文件
- [ ] `tag` 输入框筛选：输入标签文本后列表正确过滤

### 创建知识卡关联文件
- [ ] 创建模式：展示关联文件多选框，支持远程搜索
- [ ] 创建提交时 `source_file_ids` 正确传递
- [ ] 编辑模式：**不展示**关联文件选择区域

### 版本对比
- [ ] VersionTimeline 每个版本显示「对比」按钮（非「预览」）
- [ ] 点击「对比」后自动切换到「版本对比」Tab
- [ ] 默认 from=点击版本, to=最新版本
- [ ] 对比 Tab 顶部双 Select 可自由切换版本
- [ ] 单栏模式：equal 正常、delete 红色删除线、insert 绿色高亮
- [ ] 左右分栏模式：左侧显示旧版本（equal+delete），右侧显示新版本（equal+insert）
- [ ] 模式切换按钮工作正常
- [ ] 非当前版本的「回退」按钮仍正常工作

### 规范合规
- [ ] 无硬编码中文，所有文案走 i18n
- [ ] zh-CN.ts 和 en-US.ts 同步更新
- [ ] 无手动 import `ref/computed/onMounted` 等 Vue runtime API
- [ ] Antd 组件通过 `a-` 前缀使用，无手动 import
- [ ] 新文件 < 400 行，函数 < 50 行
- [ ] TypeScript 编译无错误
- [ ] ESLint 无新增 error
