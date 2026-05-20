# Knowledge API Contract Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对齐知识库相关前端接口与 `docs/API设计.md` 的最新合同，只实现目录重命名/删除、批量移动文件、文件上传重试、知识库搜索 owner 隔离路径，以及二次 diff 后仍未对齐的字段合同。

**Architecture:** 以 `src/api/knowledge.ts` 和 `src/api/knowledgeSearch.ts` 作为唯一 HTTP 封装入口，页面只消费封装函数和类型。目录与文件操作落在 `src/views/shared/KnowledgeFiles.vue`、`src/components/DirectoryTree/*`，搜索路径变更落在 `src/api/knowledgeSearch.ts` 和 `src/stores/knowledgeSearch.ts`。MSW mock 后端必须同步真实接口路径、请求体和响应字段，保证本地开发模式与真实 API 合同一致。

**Tech Stack:** Vue 3 + TypeScript, Pinia, Ant Design Vue, Vite, Vitest API contract tests, `pnpm check:docs`, `pnpm verify`

---

## Scope

**In scope**

- 前端接入 `PATCH /api/v1/knowledge/{owner_type}/{owner_id}/directories/{directory_id}/rename`。
- 前端接入 `DELETE /api/v1/knowledge/{owner_type}/{owner_id}/directories/{directory_id}`。
- 前端接入 `POST /api/v1/knowledge/{owner_type}/{owner_id}/files/batch/move`。
- 前端接入 `POST /api/v1/knowledge/{owner_type}/{owner_id}/files/indexing-tasks/{task_id}/retry`。
- 将知识库搜索从旧 `POST /knowledge-qa/search` 改为 `POST /knowledge-qa/{owner_type}/{owner_id}/search`。
- 同步 `src/mocks/**` 中的 KnowledgeBase / Knowledge QA mock 后端，使 mock 路由、请求体、响应字段与真实接口一致。
- 对参数/返回字段做二次 diff；只有仍不对齐时才修改。
- 同步 API contract 测试和文档看板。

**Out of scope**

- 不接入 4.1.17 审核状态接口，尽管路径已确认为 `/api/v1/knowledge/{owner_type}/{owner_id}/cards/{id}/audit`。
- 不接入 4.3 预签名上传。
- 不接入 4.4 知识卡召回接口。
- 不修改 `public/mockServiceWorker.js`，除非 MSW 版本升级或服务 worker 生成文件确实需要重建；本计划不涉及该情况。
- 不重构 PageTable、DirectoryTree 的通用架构，只做本需求必要扩展。

---

## Confirmed API Routes

- `PATCH /api/v1/knowledge/{owner_type}/{owner_id}/directories/{directory_id}/rename`
- `DELETE /api/v1/knowledge/{owner_type}/{owner_id}/directories/{directory_id}`
- `POST /api/v1/knowledge/{owner_type}/{owner_id}/files/batch/move`
- `POST /api/v1/knowledge/{owner_type}/{owner_id}/files/indexing-tasks/{task_id}/retry`
- `POST /api/v1/knowledge-qa/{owner_type}/{owner_id}/search`

---

## File Map

- Modify: `src/types/knowledge.ts`  
  Add missing response fields and request/response types for directory rename/delete, batch move, retry.
- Modify: `src/api/knowledge.ts`  
  Add API functions for the four in-scope KnowledgeBase operations; fix create/update return/payload contracts only if second diff confirms mismatch.
- Modify: `src/components/DirectoryTree/types.ts`  
  Add action payload types if needed.
- Modify: `src/components/DirectoryTree/DirectoryTreeItem.vue`  
  Add rename/delete icons for non-default real directories.
- Modify: `src/components/DirectoryTree/index.vue`  
  Add rename modal, delete confirm emission, and event forwarding.
- Modify: `src/views/shared/KnowledgeFiles.vue`  
  Wire directory rename/delete, batch move modal, and failed indexing retry.
- Modify: `src/api/knowledgeSearch.ts`  
  Change search endpoint signature to require owner context.
- Modify: `src/stores/knowledgeSearch.ts`  
  Resolve owner from current user and call the new search endpoint.
- Modify: `src/views/knowledge-base/Search.vue` only if the store needs route-level fallback/error display.
- Modify: `src/i18n/locales/zh-CN.ts`, `src/i18n/locales/en-US.ts`  
  Add text for rename/delete directory, batch move, retry task, and missing owner context.
- Modify: `src/mocks/handlers/knowledge.ts`  
  Add mock routes and state mutation for directory rename/delete, batch move, indexing retry, and missing response fields.
- Modify: `src/mocks/handlers/knowledgeSearch.ts`  
  Change search mock route from `/knowledge-qa/search` to `/knowledge-qa/{owner_type}/{owner_id}/search`.
- Modify: `src/mocks/data/knowledge.ts`, `src/mocks/data/knowledgeCards.ts` if needed  
  Add `indexing_task_id`, `audit_reject_reason`, `sources` fields required by the real API shape.
- Modify: `tests/api-contract/knowledge.test.ts`  
  Add contract coverage for directory rename/delete negative cases, batch move validation, retry validation, and field assertions.
- Modify: `tests/api-contract/knowledge-qa.test.ts`  
  Update search path to owner-aware route.
- Modify: `tests/api-contract/API_CONTRACT_TEST_REPORT.md`  
  Update covered route list after tests are changed.
- Modify: `docs/documentation-task-board.md`  
  Record this implementation and verification status.

---

### Task 1: 二次 Diff 和变更门槛

**Files:**

- Read: `docs/API设计.md`
- Read: `src/api/knowledge.ts`
- Read: `src/api/knowledgeSearch.ts`
- Read: `src/types/knowledge.ts`
- Read: `src/types/skill.ts`
- Read: `src/mocks/handlers/knowledge.ts`
- Read: `src/mocks/handlers/knowledgeSearch.ts`
- Read: `src/mocks/data/knowledge.ts`
- Read: `src/mocks/data/knowledgeCards.ts`
- Read: `tests/api-contract/knowledge.test.ts`
- Read: `tests/api-contract/knowledge-qa.test.ts`

- [ ] **Step 1: 重新检查目标接口是否已接入**

Run:

```bash
rg -n "renameDirectory|deleteDirectory|batchMoveFiles|retryFileIndexingTask|directories/.*/rename|files/batch/move|indexing-tasks/.*/retry" src tests -S
```

Expected:

- 若无业务封装和页面调用，继续 Task 2-4。
- 若某项已完整接入，只在计划执行记录中标注“已对齐”，不要重复实现。

- [ ] **Step 2: 重新检查 mock 后端是否已对齐**

Run:

```bash
rg -n "directories/.*/rename|files/batch/move|indexing-tasks/.*/retry|knowledge-qa/.*/search|/knowledge-qa/search|indexing_task_id|audit_reject_reason" src/mocks -S
```

Expected:

- 真实接口路径在 mock 中缺失时，执行 Task 6。
- 旧 `/knowledge-qa/search` 在 mock 中仍存在时，执行 Task 6。
- mock 响应缺少 `indexing_task_id` / `audit_reject_reason` 时，执行 Task 6。

- [ ] **Step 3: 重新检查旧搜索接口**

Run:

```bash
rg -n "/knowledge-qa/search|knowledge-qa/.*/search|knowledgeSearchApi\\.search|createSession\\(" src tests -S
```

Expected:

- 旧 `POST /knowledge-qa/search` 仍存在时，执行 Task 5。
- 若已全部变为 owner-aware path，只补测试/文档遗漏。

- [ ] **Step 4: 重新检查参数和返回字段差异**

Run:

```bash
rg -n "indexing_task_id|audit_reject_reason|source_file_ids|md_content|json_content|card_id|KnowledgeCardPayload|FileListItem|FileCard|SkillCitation" src tests -S
```

Required alignment checklist:

- `FileListItem` includes `indexing_task_id?: string | null`.
- `FileStatusResponse` includes `indexing_task_id?: string | null` if docs mention status response returns it.
- `FileCard` includes `audit_status?: AuditStatus`, `audit_reject_reason?: string | null`, and `sources?`.
- `KnowledgeCard` includes `audit_reject_reason?: string | null`.
- `KnowledgeCardPayload` create request uses `md_content`, not `content`.
- `updateKnowledgeCard` payload allows `type` because API 4.1.10 request body includes it.
- `saveKnowledgeCard` does not assume create response is a full `KnowledgeCard` when API returns `{ card_id }`.
- `tests/api-contract/knowledge.test.ts` no longer creates cards with old `content` field.

- [ ] **Step 5: Write down actual deltas before editing**

Add a short implementation note in the task runner output:

```text
Second diff result:
- Missing API functions: ...
- Missing mock routes/fields: ...
- Old search endpoint remains in: ...
- Field mismatches: ...
- Already aligned, no change: ...
```

Only implement items listed under “Missing” or “Field mismatches”.

---

### Task 2: API 和类型层补齐

**Files:**

- Modify: `src/types/knowledge.ts`
- Modify: `src/api/knowledge.ts`

- [ ] **Step 1: Add missing KnowledgeBase types only if Task 1 confirms they are missing**

Patch `src/types/knowledge.ts` with the following shapes, merging with existing local names if equivalent types already exist:

```typescript
export interface FileSource {
  id?: string
  name?: string
  file_name?: string
  file_type?: string
  file_size?: number
  storage_url?: string | null
  parsed_file_url?: string | null
  page_hint?: string | null
}

export interface RenameDirectoryPayload {
  name: string
}

export interface BatchMoveFilesPayload {
  file_ids: string[]
  target_dir_id: string | null
}

export interface BatchMoveFilesResult {
  moved_count: number
}

export interface FileIndexingRetryResult {
  task_id: string
  file_id: string
}

export interface CreateKnowledgeCardResult {
  card_id: string
}
```

Then update existing interfaces only where missing:

```typescript
export interface FileListItem {
  // existing fields...
  indexing_task_id?: string | null
}

export interface FileStatusResponse {
  // existing fields...
  indexing_task_id?: string | null
}

export interface FileCard {
  // existing fields...
  audit_status?: AuditStatus
  audit_reject_reason?: string | null
  sources?: FileSource[]
}

export interface KnowledgeCard {
  // existing fields...
  audit_reject_reason?: string | null
}
```

- [ ] **Step 2: Add the new API functions**

Patch `src/api/knowledge.ts` imports to include the new types, then add these functions near the existing directory/file operations:

```typescript
export function renameDirectory(
  ownerType: OwnerType,
  ownerId: string,
  directoryId: string,
  payload: RenameDirectoryPayload
) {
  return request.patch<DirectoryNode>(
    `${BASE_URL}/${ownerType}/${ownerId}/directories/${directoryId}/rename`,
    payload
  )
}

export function deleteDirectory(ownerType: OwnerType, ownerId: string, directoryId: string) {
  return request.delete<string>(`${BASE_URL}/${ownerType}/${ownerId}/directories/${directoryId}`)
}

export function batchMoveFiles(
  ownerType: OwnerType,
  ownerId: string,
  payload: BatchMoveFilesPayload
) {
  return request.post<BatchMoveFilesResult>(
    `${BASE_URL}/${ownerType}/${ownerId}/files/batch/move`,
    payload
  )
}

export function retryFileIndexingTask(ownerType: OwnerType, ownerId: string, taskId: string) {
  return request.post<FileIndexingRetryResult>(
    `${BASE_URL}/${ownerType}/${ownerId}/files/indexing-tasks/${taskId}/retry`
  )
}
```

- [ ] **Step 3: Fix create/update contracts only if still mismatched**

If Task 1 confirms `saveKnowledgeCard` still normalizes a `{ card_id }` response as full card, change it to:

```typescript
export function saveKnowledgeCard(
  ownerType: OwnerType,
  ownerId: string,
  payload: KnowledgeCardPayload
): Promise<CreateKnowledgeCardResult> {
  return request.post<CreateKnowledgeCardResult>(
    `${BASE_URL}/${ownerType}/${ownerId}/cards`,
    payload
  )
}
```

If Task 1 confirms `updateKnowledgeCard` still rejects `type`, change the payload type to:

```typescript
payload: Partial<
  Pick<KnowledgeCardPayload, 'title' | 'type' | 'md_content' | 'tags'> & {
    change_summary?: string
  }
>
```

- [ ] **Step 4: Verify type layer**

Run:

```bash
pnpm exec vue-tsc --noEmit -p tsconfig.app.json
```

Expected: no TypeScript errors from the changed API/types.

- [ ] **Step 5: Commit**

```bash
git add src/types/knowledge.ts src/api/knowledge.ts
git commit -m "feat(knowledge): 对齐目录和文件操作接口封装"
```

---

### Task 3: 目录重命名和删除前端交互

**Files:**

- Modify: `src/components/DirectoryTree/types.ts`
- Modify: `src/components/DirectoryTree/DirectoryTreeItem.vue`
- Modify: `src/components/DirectoryTree/index.vue`
- Modify: `src/views/shared/KnowledgeFiles.vue`
- Modify: `src/i18n/locales/zh-CN.ts`
- Modify: `src/i18n/locales/en-US.ts`

- [ ] **Step 1: Add DirectoryTree events**

In `src/components/DirectoryTree/index.vue`, extend emits:

```typescript
const emit = defineEmits<{
  (e: 'node-click', payload: DirectoryTreeClickPayload): void
  (e: 'create-dir', parentId: string | null, name: string): Promise<void>
  (e: 'rename-dir', directoryId: string, name: string): Promise<void>
  (e: 'delete-dir', directoryId: string): Promise<void>
}>()
```

- [ ] **Step 2: Add item actions for non-default real directories**

In `DirectoryTreeItem.vue`, add edit/delete icons next to the existing add icon. Do not show them when `node.is_default` is true.

Use Ant Design icons already available in the project:

```typescript
import {
  FolderOutlined,
  FolderOpenOutlined,
  CaretRightOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
```

Add emits:

```typescript
defineEmits<{
  (e: 'node-click', node: DirectoryTreeNode): void
  (e: 'add-click', node: DirectoryTreeNode): void
  (e: 'rename-click', node: DirectoryTreeNode): void
  (e: 'delete-click', node: DirectoryTreeNode): void
}>()
```

The template action block should include:

```vue
<a-tooltip :title="t('knowledge.renameDirectory')">
  <EditOutlined
    v-if="!node.is_default"
    class="text-[14px] text-slate-400 hover:text-primary transition-colors p-1"
    @click.stop="$emit('rename-click', node)"
  />
</a-tooltip>
<a-tooltip :title="t('knowledge.deleteDirectory')">
  <DeleteOutlined
    v-if="!node.is_default"
    class="text-[14px] text-slate-400 hover:text-red-500 transition-colors p-1"
    @click.stop="$emit('delete-click', node)"
  />
</a-tooltip>
```

Forward both events through recursive `DirectoryTreeItem` children.

- [ ] **Step 3: Add rename modal in DirectoryTree**

In `DirectoryTree/index.vue`, add state:

```typescript
const renameModalVisible = ref(false)
const renameLoading = ref(false)
const renamingNode = ref<DirectoryTreeNode | null>(null)
const renameDirName = ref('')
```

Add handlers:

```typescript
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
```

Add modal:

```vue
<a-modal
  v-model:open="renameModalVisible"
  :title="t('knowledge.renameDirectory')"
  :confirm-loading="renameLoading"
  @ok="handleRenameDirectory"
>
  <a-form layout="vertical">
    <a-form-item :label="t('knowledge.directoryName')" required>
      <a-input v-model:value="renameDirName" :placeholder="t('knowledge.directoryNamePlaceholder')" />
    </a-form-item>
  </a-form>
</a-modal>
```

- [ ] **Step 4: Wire KnowledgeFiles API calls**

In `src/views/shared/KnowledgeFiles.vue`, import:

```typescript
import {
  getDirectoryTree,
  createDirectory,
  renameDirectory,
  deleteDirectory,
  getFileList,
  deleteFile,
} from '@/api/knowledge'
```

Add template listeners:

```vue
@rename-dir="handleRenameDir" @delete-dir="handleDeleteDir"
```

Add handlers:

```typescript
async function handleRenameDir(directoryId: string, name: string) {
  try {
    await renameDirectory(props.ownerType, props.ownerId, directoryId, { name })
    message.success(t('common.success'))
    await loadTree()
    await loadData()
  } catch {
    // error shown by api interceptor
  }
}

async function handleDeleteDir(directoryId: string) {
  confirmDelete({
    title: t('knowledge.deleteDirectory'),
    content: t('knowledge.deleteDirectoryConfirm'),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      await deleteDirectory(props.ownerType, props.ownerId, directoryId)
      if (selectedDirId.value === directoryId) {
        selectedDirId.value = '__all__'
      }
      message.success(t('common.success'))
      await loadTree()
      await loadData()
    },
  })
}
```

- [ ] **Step 5: Add i18n keys**

Add Chinese keys under `knowledge`:

```typescript
renameDirectory: '重命名目录',
deleteDirectory: '删除目录',
deleteDirectoryConfirm: '确定要删除该目录吗？仅空的非默认目录可以删除。',
```

Add English keys under `knowledge`:

```typescript
renameDirectory: 'Rename directory',
deleteDirectory: 'Delete directory',
deleteDirectoryConfirm: 'Delete this directory? Only empty non-default directories can be deleted.',
```

- [ ] **Step 6: Verify**

Run:

```bash
pnpm exec vue-tsc --noEmit -p tsconfig.app.json
```

Expected: no component event/type errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/DirectoryTree src/views/shared/KnowledgeFiles.vue src/i18n/locales/zh-CN.ts src/i18n/locales/en-US.ts
git commit -m "feat(knowledge): 支持非默认目录重命名和删除"
```

---

### Task 4: 批量移动文件和失败索引重试

**Files:**

- Modify: `src/views/shared/KnowledgeFiles.vue`
- Modify: `src/i18n/locales/zh-CN.ts`
- Modify: `src/i18n/locales/en-US.ts`

- [ ] **Step 1: Import APIs and icons**

In `src/views/shared/KnowledgeFiles.vue`, add:

```typescript
import { batchMoveFiles, retryFileIndexingTask } from '@/api/knowledge'
```

If not already imported, add:

```typescript
import { SwapOutlined } from '@ant-design/icons-vue'
```

- [ ] **Step 2: Add selection column and batch action**

Add a selection column at the start of `tableColumns`:

```typescript
{
  type: 'selection',
  width: 48,
  fixed: 'left',
},
```

Add computed selected files:

```typescript
const selectedFiles = computed(
  () => (pageTableRef.value?.multipleSelection ?? []) as FileListItem[]
)
const selectedFileIds = computed(() => selectedFiles.value.map((item) => item.id))
```

Add a header button after upload:

```typescript
{
  text: t('knowledge.batchMoveFiles'),
  icon: SwapOutlined,
  show: true,
  handle: openBatchMoveModal,
}
```

The handler should warn when nothing is selected:

```typescript
function openBatchMoveModal() {
  if (selectedFileIds.value.length === 0) {
    message.warning(t('knowledge.batchMoveNoSelection'))
    return
  }
  batchMoveTargetDirId.value = null
  batchMoveModalVisible.value = true
}
```

- [ ] **Step 3: Add batch move modal**

Add state:

```typescript
const batchMoveModalVisible = ref(false)
const batchMoveLoading = ref(false)
const batchMoveTargetDirId = ref<string | null>(null)
```

Use existing `treeData` to build TreeSelect options:

```typescript
const directoryTreeSelectData = computed(() => {
  const map = (
    nodes: DirectoryNode[]
  ): Array<{ key: string; value: string; title: string; children?: any[] }> =>
    nodes.map((n) => ({
      key: n.id,
      value: n.id,
      title: n.name,
      children: n.children?.length ? map(n.children) : undefined,
    }))
  return map(treeData.value)
})
```

Add modal template near the upload modal:

```vue
<a-modal
  v-model:open="batchMoveModalVisible"
  :title="t('knowledge.batchMoveFiles')"
  :confirm-loading="batchMoveLoading"
  @ok="handleBatchMove"
>
  <a-form layout="vertical">
    <a-form-item :label="t('knowledge.targetDirectory')">
      <a-tree-select
        v-model:value="batchMoveTargetDirId"
        :tree-data="directoryTreeSelectData"
        allow-clear
        tree-default-expand-all
        class="w-full"
        :placeholder="t('knowledge.selectDirectory')"
        :field-names="{ label: 'title', value: 'value' }"
      />
    </a-form-item>
  </a-form>
</a-modal>
```

Implement:

```typescript
async function handleBatchMove() {
  if (selectedFileIds.value.length === 0) {
    message.warning(t('knowledge.batchMoveNoSelection'))
    return
  }
  batchMoveLoading.value = true
  try {
    const result = await batchMoveFiles(props.ownerType, props.ownerId, {
      file_ids: selectedFileIds.value,
      target_dir_id: batchMoveTargetDirId.value,
    })
    message.success(t('knowledge.batchMoveSuccess', { count: result.moved_count }))
    batchMoveModalVisible.value = false
    pageTableRef.value?.clearSelection()
    await loadTree()
    await loadData()
  } finally {
    batchMoveLoading.value = false
  }
}
```

- [ ] **Step 4: Replace failed upload retry behavior**

Current `handleRetry()` opens the upload modal. Replace it with backend indexing retry:

```typescript
async function handleRetry(record: FileListItem) {
  const taskId = record.indexing_task_id
  if (!taskId) {
    message.warning(t('knowledge.retryTaskMissing'))
    return
  }
  await retryFileIndexingTask(props.ownerType, props.ownerId, taskId)
  message.success(t('knowledge.retryTaskSubmitted'))
  await loadData()
  startPoll()
}
```

Update the operation button handle:

```typescript
handle: (row: Record<string, unknown>) => handleRetry(row as unknown as FileListItem),
```

Keep `btnIsShow` tied to `row.status === 'failed'`; use the warning above for missing `indexing_task_id`.

- [ ] **Step 5: Add i18n keys**

Chinese:

```typescript
batchMoveFiles: '批量移动',
batchMoveNoSelection: '请先选择文件',
batchMoveSuccess: '已移动 {count} 个文件',
targetDirectory: '目标目录',
retryTaskMissing: '当前文件缺少重试任务 ID',
retryTaskSubmitted: '已提交重试任务',
```

English:

```typescript
batchMoveFiles: 'Move files',
batchMoveNoSelection: 'Select files first',
batchMoveSuccess: 'Moved {count} files',
targetDirectory: 'Target directory',
retryTaskMissing: 'This file has no retry task ID',
retryTaskSubmitted: 'Retry task submitted',
```

- [ ] **Step 6: Verify**

Run:

```bash
pnpm exec vue-tsc --noEmit -p tsconfig.app.json
```

Expected: no type errors from `multipleSelection`, TreeSelect data, or retry handler.

- [ ] **Step 7: Commit**

```bash
git add src/views/shared/KnowledgeFiles.vue src/i18n/locales/zh-CN.ts src/i18n/locales/en-US.ts
git commit -m "feat(knowledge): 支持文件批量移动和索引重试"
```

---

### Task 5: 搜索接口改为 owner 隔离新路径

**Files:**

- Modify: `src/api/knowledgeSearch.ts`
- Modify: `src/stores/knowledgeSearch.ts`
- Modify: `src/views/knowledge-base/Search.vue` only if needed
- Modify: `src/i18n/locales/zh-CN.ts`
- Modify: `src/i18n/locales/en-US.ts`

- [ ] **Step 1: Change API signature**

In `src/api/knowledgeSearch.ts`, import `OwnerType`:

```typescript
import type { OwnerType } from '@/types/knowledge'
```

Change `search`:

```typescript
search: (
  ownerType: Exclude<OwnerType, 'avatar'>,
  ownerId: string,
  data: { query: string; top_k?: number }
) => {
  return request.post<SearchResponse>(`/knowledge-qa/${ownerType}/${ownerId}/search`, data)
},
```

Do not change `followUp` or `getHistory` unless backend design also changes them later.

- [ ] **Step 2: Resolve owner in store**

In `src/stores/knowledgeSearch.ts`, import:

```typescript
import { useAuthStore } from '@/stores/auth'
import { resolveKnowledgeOwnerFromUser } from '@/utils/skillArgs'
```

Inside `createSession`, before calling search:

```typescript
const authStore = useAuthStore()
const owner = resolveKnowledgeOwnerFromUser(authStore.user)
if (!owner) {
  throw new Error('knowledge search owner missing')
}
const res = await knowledgeSearchApi.search(owner.owner_type, owner.owner_id, { query })
```

If the thrown error needs user-facing text, map it where the page currently catches the error.

- [ ] **Step 3: Add owner missing i18n only if surfaced in UI**

Chinese:

```typescript
ownerMissing: '当前账号缺少知识库归属信息',
```

English:

```typescript
ownerMissing: 'Knowledge owner is missing for the current account',
```

- [ ] **Step 4: Verify old endpoint is gone from non-mock code**

Run:

```bash
rg -n "/knowledge-qa/search|POST /knowledge-qa/search" src tests -S
```

Expected:

- No hits in `src/api/knowledgeSearch.ts`, `src/stores/knowledgeSearch.ts`, `tests/api-contract/knowledge-qa.test.ts`.
- Hits under `src/mocks/**` are not acceptable after Task 6; if Task 6 has not run yet, record them as pending mock alignment.

- [ ] **Step 5: Commit**

```bash
git add src/api/knowledgeSearch.ts src/stores/knowledgeSearch.ts src/views/knowledge-base/Search.vue src/i18n/locales/zh-CN.ts src/i18n/locales/en-US.ts
git commit -m "fix(knowledge-qa): 搜索接口改为 owner 隔离路径"
```

---

### Task 6: Mock 后端对齐真实接口

**Files:**

- Modify: `src/mocks/handlers/knowledge.ts`
- Modify: `src/mocks/handlers/knowledgeSearch.ts`
- Modify: `src/mocks/data/knowledge.ts`
- Modify: `src/mocks/data/knowledgeCards.ts`

- [ ] **Step 1: Add missing response fields to mock data**

In `src/mocks/data/knowledge.ts`, ensure each file item includes an `indexing_task_id`. Use stable mock IDs, not random values, so UI retry behavior is deterministic:

```typescript
indexing_task_id: 'task_file_001',
```

Failed files must also include `indexing_task_id`, because the retry button depends on it:

```typescript
status: 'failed',
error_msg: '解析失败，请重试',
indexing_task_id: 'task_file_failed_001',
```

In `src/mocks/data/knowledgeCards.ts`, ensure each card includes:

```typescript
audit_reject_reason: '',
```

For rejected examples, use a non-empty reason:

```typescript
audit_status: 'rejected',
audit_reject_reason: '内容证据不足',
```

- [ ] **Step 2: Add directory rename route**

In `src/mocks/handlers/knowledge.ts`, add this handler near directory create:

```typescript
http.patch(
  `${API_BASE}/knowledge/:ownerType/:ownerId/directories/:directoryId/rename`,
  async ({ params, request }) => {
    const directoryId = String(params.directoryId)
    const payload = (await request.json()) as { name?: string }
    const nextName = payload.name?.trim()
    if (!nextName) {
      return HttpResponse.json(
        { code: 400, message: 'name is required', data: null },
        { status: 400 }
      )
    }

    const findDir = (nodes: DirectoryNode[]): DirectoryNode | null => {
      for (const node of nodes) {
        if (node.id === directoryId) return node
        const child = node.children?.length ? findDir(node.children) : null
        if (child) return child
      }
      return null
    }

    const dir = findDir(mutableDirectories)
    if (!dir) {
      return HttpResponse.json(
        { code: 404, message: 'Directory not found', data: null },
        { status: 404 }
      )
    }
    if (dir.is_default) {
      return HttpResponse.json(
        { code: 400, message: 'Default directory cannot be renamed', data: null },
        { status: 400 }
      )
    }

    dir.name = nextName
    return HttpResponse.json({ code: 0, message: 'ok', data: dir })
  }
)
```

- [ ] **Step 3: Add directory delete route**

Add this handler near directory routes:

```typescript
http.delete(
  `${API_BASE}/knowledge/:ownerType/:ownerId/directories/:directoryId`,
  async ({ params }) => {
    const directoryId = String(params.directoryId)

    const removeDir = (nodes: DirectoryNode[]): DirectoryNode | null => {
      const index = nodes.findIndex((node) => node.id === directoryId)
      if (index >= 0) {
        const dir = nodes[index]!
        if (dir.is_default) return dir
        if (
          dir.children?.length ||
          dir.file_count > 0 ||
          mutableFiles.some((file) => file.dir_id === directoryId)
        ) {
          return dir
        }
        nodes.splice(index, 1)
        return null
      }
      for (const node of nodes) {
        if (node.children?.length) {
          const result = removeDir(node.children)
          if (result !== undefined) return result
        }
      }
      return undefined as unknown as DirectoryNode | null
    }

    const result = removeDir(mutableDirectories)
    if (result === undefined) {
      return HttpResponse.json(
        { code: 404, message: 'Directory not found', data: null },
        { status: 404 }
      )
    }
    if (result) {
      return HttpResponse.json(
        { code: 400, message: 'Directory cannot be deleted', data: null },
        { status: 400 }
      )
    }
    return HttpResponse.json({ code: 0, message: 'ok', data: 'deleted' })
  }
)
```

Implementation note: if TypeScript dislikes the sentinel return above, use a local `let found = false` and `let blocked: DirectoryNode | null = null` instead of returning `undefined`. Keep behavior identical.

- [ ] **Step 4: Add batch move route**

Add this handler near file routes:

```typescript
http.post(`${API_BASE}/knowledge/:ownerType/:ownerId/files/batch/move`, async ({ request }) => {
  const payload = (await request.json()) as { file_ids?: string[]; target_dir_id?: string | null }
  const fileIds = Array.isArray(payload.file_ids) ? payload.file_ids : []
  if (fileIds.length === 0) {
    return HttpResponse.json(
      { code: 400, message: 'file_ids is required', data: null },
      { status: 400 }
    )
  }

  const targetDirId = payload.target_dir_id ?? null
  const targetDirName =
    targetDirId == null
      ? '未分类'
      : (findDirectoryName(mutableDirectories, targetDirId) ?? '未分类')

  let movedCount = 0
  for (const file of mutableFiles) {
    if (!fileIds.includes(file.id)) continue
    file.dir_id = targetDirId ?? ''
    file.dir_name = targetDirName
    file.updated_at = new Date().toISOString()
    movedCount++
  }

  return HttpResponse.json({ code: 0, message: 'ok', data: { moved_count: movedCount } })
})
```

Add a small helper above handlers if one does not already exist:

```typescript
function findDirectoryName(nodes: DirectoryNode[], id: string): string | null {
  for (const node of nodes) {
    if (node.id === id) return node.name
    const child = node.children?.length ? findDirectoryName(node.children, id) : null
    if (child) return child
  }
  return null
}
```

- [ ] **Step 5: Add indexing retry route**

Add this handler near file status route:

```typescript
http.post(
  `${API_BASE}/knowledge/:ownerType/:ownerId/files/indexing-tasks/:taskId/retry`,
  async ({ params }) => {
    const taskId = String(params.taskId)
    const file = mutableFiles.find((item) => item.indexing_task_id === taskId)
    if (!file) {
      return HttpResponse.json(
        { code: 404, message: 'Task not found', data: null },
        { status: 404 }
      )
    }
    file.status = 'indexing'
    file.error_msg = null
    file.updated_at = new Date().toISOString()
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        task_id: taskId,
        file_id: file.id,
      },
    })
  }
)
```

Update file status response to include `indexing_task_id`:

```typescript
data: {
  id: fileId,
  status: file.status,
  indexing_task_id: file.indexing_task_id,
  progress: {
    current_step: file.status,
    steps: FILE_STATUS_STEPS,
    step_index: stepIndex,
  },
  error_msg: file.error_msg,
}
```

- [ ] **Step 6: Change Knowledge QA mock search route**

In `src/mocks/handlers/knowledgeSearch.ts`, replace:

```typescript
http.post(`${API_BASE}/knowledge-qa/search`, async ({ request }) => {
```

with:

```typescript
http.post(`${API_BASE}/knowledge-qa/:ownerType/:ownerId/search`, async ({ request, params }) => {
```

Validate path params are present:

```typescript
const ownerType = String(params.ownerType ?? '')
const ownerId = String(params.ownerId ?? '')
if (!ownerType || !ownerId) {
  return HttpResponse.json({ code: 400, message: 'owner is required', data: null }, { status: 400 })
}
```

Keep response shape unchanged unless Task 1 finds field mismatches.

- [ ] **Step 7: Verify old mock route is gone**

Run:

```bash
rg -n "/knowledge-qa/search|directories/.*/rename|files/batch/move|indexing-tasks/.*/retry|indexing_task_id|audit_reject_reason" src/mocks -S
```

Expected:

- No `/knowledge-qa/search` hit.
- Hits exist for `directories/:directoryId/rename`, `files/batch/move`, `indexing-tasks/:taskId/retry`, `indexing_task_id`, and `audit_reject_reason`.

- [ ] **Step 8: Verify TypeScript**

Run:

```bash
pnpm exec vue-tsc --noEmit -p tsconfig.app.json
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/mocks/handlers/knowledge.ts src/mocks/handlers/knowledgeSearch.ts src/mocks/data/knowledge.ts src/mocks/data/knowledgeCards.ts
git commit -m "fix(mock): 对齐知识库真实接口合同"
```

---

### Task 7: API Contract Tests

**Files:**

- Modify: `tests/api-contract/knowledge.test.ts`
- Modify: `tests/api-contract/knowledge-qa.test.ts`
- Modify: `tests/api-contract/API_CONTRACT_TEST_REPORT.md`

- [ ] **Step 1: Update Knowledge QA search test path**

In `tests/api-contract/knowledge-qa.test.ts`, reuse the same owner resolution strategy from `knowledge.test.ts` or extract a small helper in the test file. Change:

```typescript
const res = await authedPost('/knowledge-qa/search', { query: '测试查询' })
```

to:

```typescript
const res = await authedPost(`/knowledge-qa/${owner.ownerType}/${owner.ownerId}/search`, {
  query: '测试查询',
})
```

Also update unauth and missing query cases to the same owner-aware path.

- [ ] **Step 2: Update create-card payload**

In `tests/api-contract/knowledge.test.ts`, change old card creation payload:

```typescript
{
  title: `vitest-delete-${Date.now()}`,
  type: 'rule',
  content: '临时删除测试卡片',
  tags: ['vitest'],
}
```

to:

```typescript
{
  title: `vitest-delete-${Date.now()}`,
  type: 'rule',
  md_content: '临时删除测试卡片',
  tags: ['vitest'],
}
```

Then read `cardId` from either `data.card_id` or `data.id` to support the current API design:

```typescript
const created = (createRes.data as any).data
const cardId = created.card_id ?? created.id
```

- [ ] **Step 3: Add field assertions for still-missing response fields**

In the file list test, if an item exists:

```typescript
expect('indexing_task_id' in file).toBe(true)
```

In card list/detail tests, if an item exists:

```typescript
expect('audit_reject_reason' in card).toBe(true)
```

In file-cards test, add coverage for `audit_status`, `audit_reject_reason`, and `sources` if test data exists.

- [ ] **Step 4: Add validation tests for new operations without destructive real-data assumptions**

Use invalid IDs to verify route existence and validation behavior without renaming/deleting real directories:

```typescript
const fakeId = '00000000-0000-0000-0000-000000000000'

const renameRes = await authedPatch(`${basePath()}/directories/${fakeId}/rename`, {
  name: 'vitest-rename',
})
expect([400, 404]).toContain(renameRes.status)

const deleteRes = await authedDelete(`${basePath()}/directories/${fakeId}`)
expect([400, 404]).toContain(deleteRes.status)

const moveRes = await authedPost(`${basePath()}/files/batch/move`, {
  file_ids: [fakeId],
  target_dir_id: null,
})
expect([400, 404]).toContain(moveRes.status)

const retryRes = await authedPost(`${basePath()}/files/indexing-tasks/${fakeId}/retry`)
expect([400, 404]).toContain(retryRes.status)
```

- [ ] **Step 5: Run contract tests when environment allows**

Run only if `.env.api-test` exists and network is available:

```bash
pnpm test:api
```

Expected:

- If environment is unavailable, record the exact reason in final delivery.
- If route/schema failures occur, capture exact failed route and response.

- [ ] **Step 6: Update API contract report**

Update `tests/api-contract/API_CONTRACT_TEST_REPORT.md` route list and result notes to include:

- owner-aware `POST /knowledge-qa/{owner_type}/{owner_id}/search`
- directory rename/delete validation coverage
- file batch move validation coverage
- indexing retry validation coverage
- fields checked: `indexing_task_id`, `audit_reject_reason`

- [ ] **Step 7: Commit**

```bash
git add tests/api-contract/knowledge.test.ts tests/api-contract/knowledge-qa.test.ts tests/api-contract/API_CONTRACT_TEST_REPORT.md
git commit -m "test(api): 更新知识库接口合同覆盖"
```

---

### Task 8: Final Verification and Docs

**Files:**

- Modify: `docs/documentation-task-board.md`

- [ ] **Step 1: Update documentation task board**

Add one recent sync record:

```markdown
- 知识库 API 合同对齐：接入非默认目录重命名/删除、文件批量移动、失败索引任务重试，知识库搜索改为 owner 隔离路径，mock 后端同步真实接口，并按二次 diff 补齐仍缺失的字段合同。
```

- [ ] **Step 2: Run docs freshness check**

Run:

```bash
pnpm check:docs
```

Expected: PASS.

- [ ] **Step 3: Run full verification**

Run:

```bash
pnpm verify
```

Expected: PASS.

- [ ] **Step 4: Confirm mock files are intentionally aligned**

Run:

```bash
rg -n "/knowledge-qa/search" src/mocks -S
```

Expected: no output.

Run:

```bash
rg -n "directories/.*/rename|files/batch/move|indexing-tasks/.*/retry|indexing_task_id|audit_reject_reason" src/mocks -S
```

Expected: hits for every target route/field.

- [ ] **Step 5: Commit docs**

```bash
git add docs/documentation-task-board.md
git commit -m "docs: 记录知识库 API 合同对齐状态"
```

---

## Review Checklist

- [ ] `src/mocks/**` changes are limited to真实接口路径、请求体、响应字段和本地状态变更逻辑。
- [ ] `public/mockServiceWorker.js` is not changed.
- [ ] Directory rename/delete only appears for non-default directories.
- [ ] Batch move can send `target_dir_id: null`.
- [ ] Failed file retry uses `indexing_task_id`, not re-upload modal.
- [ ] `POST /knowledge-qa/search` is gone from runtime code, mock handlers, and tests.
- [ ] `POST /knowledge-qa/{owner_type}/{owner_id}/search` receives owner from current user.
- [ ] Mock `POST /knowledge-qa/{owner_type}/{owner_id}/search` validates owner path params.
- [ ] Mock directory rename/delete, batch move, and indexing retry routes mutate local MSW state consistently.
- [ ] Create card requests use `md_content`.
- [ ] Create card response no longer assumes a full `KnowledgeCard` if backend returns `{ card_id }`.
- [ ] `indexing_task_id` and `audit_reject_reason` are typed and returned by mock data when applicable.
- [ ] `pnpm check:docs` passes.
- [ ] `pnpm verify` passes.
- [ ] `pnpm test:api` is run when `.env.api-test` and network are available; otherwise the reason is reported.
