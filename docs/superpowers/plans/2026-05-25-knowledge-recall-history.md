# 知识卡召回历史模块实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有知识卡召回测试页面内增加召回历史入口，用户从弹窗选择历史记录后，用召回记录详情重新渲染当前召回测试结果区，并继续支持点击召回知识卡查看详情。

**Architecture:** 不新增独立召回历史页面、不新增路由、不新增 owner wrapper。历史能力全部收敛在 `src/views/shared/KnowledgeRecallTest.vue`：页面顶部增加“召回历史”按钮，按钮打开历史列表弹窗；选中历史记录后调用 4.4.2 详情接口，经 ViewModel 适配后写入现有 `result`，复用当前最终回答、召回知识卡列表和知识卡详情弹窗。

**Tech Stack:** Vue 3 + TypeScript, Ant Design Vue, Vue i18n, MSW, Vitest, OpenAPI contract snapshot

---

## 验收标准

- 不新增 `/recall-history` 页面、路由、菜单或 wrapper 文件。
- 个人、科室、机构三个现有召回测试页仍使用 `src/views/shared/KnowledgeRecallTest.vue`。
- 召回测试页顶部新增“召回历史”入口，点击后以弹窗展示当前 owner 的历史记录。
- 历史列表调用 `GET /knowledge-recall/{owner_type}/{owner_id}/history`，支持分页、知识卡类型筛选、召回状态筛选。
- 历史列表展示最小字段：问题 `query`、知识卡类型 `card_type`、Top-K `topk`、召回数量 `card_count`、状态 `recall_status`、耗时 `latency`、错误 `error`、创建时间 `created_at`。
- 用户选中某条历史记录后调用 `GET /knowledge-recall/sessions/{session_id}`。
- 4.4.2 详情返回后必须重新渲染召回测试页面的现有结果区：`query` 输入框、`topK`、卡类型选择、最终回答、召回知识卡列表、耗时、命中数。
- 4.4.2 与 4.4.5 字段差异必须通过 ViewModel 适配层处理，模板不直接混用两套原始字段。
- 选中历史后关闭历史弹窗，保留当前召回测试页位置和现有知识卡详情弹窗能力。
- 点击历史详情渲染出的召回知识卡，直接使用 4.4.2 `retrieved_sources[].md_content/json_content` 展示详情；不二次请求知识卡详情接口。
- 若 `card_id` 为空，知识卡详情弹窗仍展示标题、正文和来源文件，但 ID 显示为 `-`。
- MSW mock、OpenAPI 合同快照、API contract 测试与 `docs/documentation-task-board.md` 同步更新。
- 不实现删除单条历史、清空 owner 历史、清空全部历史。

## 文件结构

- Modify: `src/types/knowledgeRecall.ts`  
  补齐 4.4.1 / 4.4.2 类型、历史筛选参数、统一 ViewModel 类型。
- Modify: `src/api/knowledgeRecall.ts`  
  新增历史列表、历史详情 API 封装。
- Modify: `src/utils/knowledgeRecall.ts`  
  新增 4.4.5 执行结果和 4.4.2 历史详情到统一 ViewModel 的适配函数。
- Modify: `tests/unit/knowledgeRecall.test.ts`  
  覆盖历史详情适配、页面回填字段、空 `card_id` 边界。
- Modify: `tests/api-contract/knowledge-recall.test.ts`  
  断言 4.4.2 `retrieved_sources[]` 可包含 `md_content/json_content`。
- Modify: `src/mocks/handlers/knowledgeRecall.ts`  
  补 history/detail mock，补 `md_content/json_content`。
- Modify: `../mediverse-management-mock-backend/app/contracts/openapi.json`  
  同步 `KnowledgeRecallRetrievedSourceOut` 的 `md_content/json_content`。
- Modify: `src/views/shared/KnowledgeRecallTest.vue`  
  增加历史入口弹窗、历史列表、选中历史回填现有结果区。
- Modify: `src/i18n/locales/zh-CN.ts`  
  新增中文文案。
- Modify: `src/i18n/locales/en-US.ts`  
  新增英文文案。
- Modify: `docs/documentation-task-board.md`  
  记录召回历史弹窗与合同快照同步。

## Task 1: 合同快照和类型补齐

**Files:**
- Modify: `../mediverse-management-mock-backend/app/contracts/openapi.json`
- Modify: `src/types/knowledgeRecall.ts`
- Modify: `tests/api-contract/knowledge-recall.test.ts`

- [ ] **Step 1: 同步 OpenAPI 合同快照**

在 `../mediverse-management-mock-backend/app/contracts/openapi.json` 的 `KnowledgeRecallRetrievedSourceOut.properties` 中补充：

```json
"json_content": {
  "anyOf": [{ "type": "string" }, { "type": "null" }],
  "title": "Json Content"
},
"md_content": {
  "anyOf": [{ "type": "string" }, { "type": "null" }],
  "title": "Md Content"
}
```

Run:

```bash
jq '.components.schemas.KnowledgeRecallRetrievedSourceOut.properties | keys' ../mediverse-management-mock-backend/app/contracts/openapi.json
```

Expected: 输出包含 `json_content` 和 `md_content`。

- [ ] **Step 2: 补齐召回历史类型**

在 `src/types/knowledgeRecall.ts` 保留现有 `KnowledgeRecallFormState`、`KnowledgeRecallRequest`、`KnowledgeRecallSource`、`KnowledgeRecallResult`，新增：

```ts
export type KnowledgeRecallStatus = 'success' | 'failed' | 'timeout' | 'error' | string

export interface KnowledgeRecallHistoryParams {
  card_type?: CardType
  recall_status?: KnowledgeRecallStatus
  page?: number
  page_size?: number
}

export interface KnowledgeRecallSessionItem {
  id: string
  owner_type: KnowledgeRecallOwnerType
  owner_id: string
  query: string
  card_type?: CardType | null
  topk?: number | null
  final_answer?: string | null
  card_count: number
  latency?: number | null
  token?: number | null
  error?: string | null
  recall_status: KnowledgeRecallStatus
  created_at: string
  updated_at: string
}

export interface KnowledgeRecallHistoryResponse {
  total: number
  page: number
  page_size: number
  items: KnowledgeRecallSessionItem[]
}

export interface KnowledgeRecallRetrievedSource {
  card_id?: string | null
  recall_score?: number | null
  card_title?: string | null
  card_type?: CardType | null
  card_preview_content?: string | null
  json_content?: string | null
  md_content?: string | null
  source_files?: FileSource[]
  tags?: string[]
  online_status?: string | null
  audit_status?: string | null
  audit_reject_reason?: string | null
  reference_count?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export interface KnowledgeRecallCitation {
  index: number
  card_id?: string | null
  card_title?: string | null
  card_type?: CardType | null
  relevance_score?: number | null
  content_preview?: string | null
  audit_status?: string | null
  audit_reject_reason?: string | null
  online_status?: string | null
  sources?: FileSource[]
  raw?: Record<string, unknown> | null
}

export interface KnowledgeRecallDownstream {
  url?: string | null
  http_status?: number | null
  sync_code?: string | null
  latency_ms?: number | null
  message?: string | null
}

export interface KnowledgeRecallSessionDetail extends KnowledgeRecallSessionItem {
  retrieved_sources?: KnowledgeRecallRetrievedSource[]
  citations?: KnowledgeRecallCitation[]
  downstream?: KnowledgeRecallDownstream | null
  latency_ms?: number | null
}

export interface KnowledgeRecallViewSource {
  id: string
  cardId: string | null
  title: string
  cardType: CardType | ''
  excerpt: string
  score: number | null
  mdContent: string
  jsonContent: string
  sourceFiles: FileSource[]
  tags: string[]
  onlineStatus: string | null
  auditStatus: string | null
  auditRejectReason: string | null
  referenceCount: number | null
  createdAt: string | null
  updatedAt: string | null
}

export interface KnowledgeRecallViewModel {
  sessionId?: string
  query: string
  answer: string
  cardType: CardType | ''
  topK: number | null
  count: number
  status?: KnowledgeRecallStatus
  error?: string | null
  token?: number | null
  queryTimeMs?: number | null
  confidence?: number
  createdAt?: string
  updatedAt?: string
  sources: KnowledgeRecallViewSource[]
  citations: KnowledgeRecallCitation[]
  downstream?: KnowledgeRecallDownstream | null
}
```

- [ ] **Step 3: 补 API 合同测试字段断言**

在 `tests/api-contract/knowledge-recall.test.ts` 的 session detail 测试中，在 schema 断言之后追加：

```ts
const sources = (detail.data as any).data.retrieved_sources ?? []
if (sources.length > 0) {
  expect('md_content' in sources[0]).toBe(true)
  expect('json_content' in sources[0]).toBe(true)
}
```

- [ ] **Step 4: 运行合同测试**

Run:

```bash
cd mediverse-management-frontend && pnpm test:api -- tests/api-contract/knowledge-recall.test.ts
```

Expected: 有 `.env.api-test` 和网络时测试通过；如果不具备真实 API 条件，在交付说明记录未运行原因。

## Task 2: API 封装和 ViewModel 适配

**Files:**
- Modify: `src/api/knowledgeRecall.ts`
- Modify: `src/utils/knowledgeRecall.ts`
- Modify: `tests/unit/knowledgeRecall.test.ts`

- [ ] **Step 1: 写失败单测**

在 `tests/unit/knowledgeRecall.test.ts` 追加：

```ts
import {
  normalizeKnowledgeRecallResult,
  normalizeKnowledgeRecallSessionDetail,
} from '../../src/utils/knowledgeRecall'

describe('knowledge recall view model', () => {
  it('normalizes agentic recall result', () => {
    const view = normalizeKnowledgeRecallResult(
      {
        query: '高血压如何诊断？',
        answer: '最终答案',
        confidence: 0.8,
        query_time_ms: 123,
        count: 1,
        sources: [
          {
            id: 'card-1',
            card_type: 'rule',
            title: '诊断标准',
            excerpt: '摘要',
            relevance_score: 0.91,
            md_content: '## 正文',
            json_content: '{"a":1}',
            sources: [],
          },
        ],
      },
      { topK: 5, cardTypes: ['rule'] }
    )

    expect(view).toMatchObject({
      query: '高血压如何诊断？',
      answer: '最终答案',
      cardType: 'rule',
      topK: 5,
      count: 1,
      queryTimeMs: 123,
      confidence: 0.8,
      sources: [
        {
          id: 'card-1',
          cardId: 'card-1',
          title: '诊断标准',
          excerpt: '摘要',
          score: 0.91,
          mdContent: '## 正文',
          jsonContent: '{"a":1}',
        },
      ],
    })
  })

  it('normalizes session detail with retrieved source content', () => {
    const view = normalizeKnowledgeRecallSessionDetail({
      id: 'session-1',
      owner_type: 'org',
      owner_id: 'owner-1',
      query: '高血压如何诊断？',
      card_type: 'rule',
      topk: 8,
      final_answer: '历史答案',
      card_count: 1,
      latency: 456,
      recall_status: 'success',
      created_at: '2026-05-25T10:00:00Z',
      updated_at: '2026-05-25T10:00:00Z',
      retrieved_sources: [
        {
          card_id: 'card-1',
          card_title: '诊断标准',
          card_type: 'rule',
          card_preview_content: '历史摘要',
          recall_score: 0.88,
          md_content: '## 历史正文',
          json_content: '{"b":2}',
          source_files: [],
        },
      ],
      citations: [],
      downstream: { http_status: 200, latency_ms: 456 },
      latency_ms: 456,
    })

    expect(view).toMatchObject({
      sessionId: 'session-1',
      query: '高血压如何诊断？',
      answer: '历史答案',
      cardType: 'rule',
      topK: 8,
      count: 1,
      status: 'success',
      queryTimeMs: 456,
      sources: [
        {
          id: 'card-1',
          cardId: 'card-1',
          title: '诊断标准',
          excerpt: '历史摘要',
          score: 0.88,
          mdContent: '## 历史正文',
          jsonContent: '{"b":2}',
        },
      ],
    })
  })

  it('keeps a source displayable when card_id is null', () => {
    const view = normalizeKnowledgeRecallSessionDetail({
      id: 'session-1',
      owner_type: 'org',
      owner_id: 'owner-1',
      query: '问题',
      card_count: 1,
      recall_status: 'success',
      created_at: '2026-05-25T10:00:00Z',
      updated_at: '2026-05-25T10:00:00Z',
      retrieved_sources: [
        {
          card_id: null,
          card_title: '无 ID 卡片',
          card_preview_content: '摘要',
          md_content: '正文',
        },
      ],
    })

    expect(view.sources[0]).toMatchObject({
      cardId: null,
      title: '无 ID 卡片',
      mdContent: '正文',
    })
    expect(view.sources[0].id).toBe('session-1-source-0')
  })
})
```

- [ ] **Step 2: 运行单测确认失败**

Run:

```bash
cd mediverse-management-frontend && pnpm exec vitest run tests/unit/knowledgeRecall.test.ts
```

Expected: FAIL，原因是适配函数尚未实现。

- [ ] **Step 3: 实现 API 封装**

在 `src/api/knowledgeRecall.ts` 补充 import：

```ts
  KnowledgeRecallHistoryParams,
  KnowledgeRecallHistoryResponse,
  KnowledgeRecallSessionDetail,
```

新增函数：

```ts
export function getKnowledgeRecallHistory(
  ownerType: KnowledgeRecallOwnerType,
  ownerId: string,
  params: KnowledgeRecallHistoryParams
) {
  return request.get<KnowledgeRecallHistoryResponse>(
    `/knowledge-recall/${ownerType}/${ownerId}/history`,
    { params }
  )
}

export function getKnowledgeRecallSessionDetail(sessionId: string) {
  return request.get<KnowledgeRecallSessionDetail>(`/knowledge-recall/sessions/${sessionId}`)
}
```

- [ ] **Step 4: 实现 ViewModel 适配**

在 `src/utils/knowledgeRecall.ts` 补充 type import：

```ts
  KnowledgeRecallResult,
  KnowledgeRecallSessionDetail,
  KnowledgeRecallViewModel,
```

新增：

```ts
interface NormalizeRecallResultContext {
  topK: number
  cardTypes: CardType[]
}

function resolveSingleCardType(types: CardType[]): CardType | '' {
  return types.length === 1 ? types[0] : ''
}

export function normalizeKnowledgeRecallResult(
  result: KnowledgeRecallResult,
  context: NormalizeRecallResultContext
): KnowledgeRecallViewModel {
  return {
    query: result.query,
    answer: result.answer ?? '',
    cardType: resolveSingleCardType(context.cardTypes),
    topK: context.topK,
    count: result.count ?? result.sources.length,
    queryTimeMs: result.query_time_ms,
    confidence: result.confidence,
    sources: result.sources.map((source) => ({
      id: source.id,
      cardId: source.id || null,
      title: source.title || '-',
      cardType: source.card_type || '',
      excerpt: source.excerpt || '',
      score: source.recall_score ?? source.relevance_score ?? null,
      mdContent: source.md_content ?? '',
      jsonContent: source.json_content ?? '',
      sourceFiles: source.source_files ?? source.sources ?? [],
      tags: [],
      onlineStatus: null,
      auditStatus: null,
      auditRejectReason: null,
      referenceCount: null,
      createdAt: source.created_at ?? null,
      updatedAt: source.updated_at ?? null,
    })),
    citations: [],
    downstream: null,
  }
}

export function normalizeKnowledgeRecallSessionDetail(
  detail: KnowledgeRecallSessionDetail
): KnowledgeRecallViewModel {
  const sources = detail.retrieved_sources ?? []

  return {
    sessionId: detail.id,
    query: detail.query,
    answer: detail.final_answer ?? '',
    cardType: detail.card_type ?? '',
    topK: detail.topk ?? null,
    count: detail.card_count ?? sources.length,
    status: detail.recall_status,
    error: detail.error,
    token: detail.token,
    queryTimeMs: detail.latency_ms ?? detail.latency ?? null,
    createdAt: detail.created_at,
    updatedAt: detail.updated_at,
    sources: sources.map((source, index) => {
      const cardId = source.card_id ?? null
      return {
        id: cardId ?? `${detail.id}-source-${index}`,
        cardId,
        title: source.card_title || '-',
        cardType: source.card_type || '',
        excerpt: source.card_preview_content || '',
        score: source.recall_score ?? null,
        mdContent: source.md_content ?? '',
        jsonContent: source.json_content ?? '',
        sourceFiles: source.source_files ?? [],
        tags: source.tags ?? [],
        onlineStatus: source.online_status ?? null,
        auditStatus: source.audit_status ?? null,
        auditRejectReason: source.audit_reject_reason ?? null,
        referenceCount: source.reference_count ?? null,
        createdAt: source.created_at ?? null,
        updatedAt: source.updated_at ?? null,
      }
    }),
    citations: detail.citations ?? [],
    downstream: detail.downstream ?? null,
  }
}
```

- [ ] **Step 5: 运行单测确认通过**

Run:

```bash
cd mediverse-management-frontend && pnpm exec vitest run tests/unit/knowledgeRecall.test.ts
```

Expected: PASS。

## Task 3: MSW mock 补历史列表和详情

**Files:**
- Modify: `src/mocks/handlers/knowledgeRecall.ts`

- [ ] **Step 1: 补召回源正文 mock**

确认 `recallSources` 每条数据包含 `md_content`；给至少一条补充 `json_content`：

```ts
json_content: '{"title":"高血压诊断标准","threshold":"140/90mmHg"}',
```

- [ ] **Step 2: 补历史 session mock 数据**

在 `recallSources` 后追加：

```ts
const recallHistorySessions = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    owner_type: 'org',
    owner_id: '22222222-2222-4222-8222-222222222222',
    query: '高血压患者如何进行诊断？',
    card_type: 'disease_overview',
    topk: 5,
    final_answer: '历史记录显示，本次召回命中了高血压诊断标准等知识卡。',
    card_count: 2,
    latency: 420,
    token: 1024,
    error: null,
    recall_status: 'success',
    created_at: '2026-05-25T08:00:00Z',
    updated_at: '2026-05-25T08:00:00Z',
    retrieved_sources: recallSources.slice(0, 2).map((source) => ({
      card_id: source.id,
      recall_score: source.recall_score,
      card_title: source.title,
      card_type: source.card_type,
      card_preview_content: source.excerpt,
      json_content: source.json_content ?? '',
      md_content: source.md_content ?? '',
      source_files: source.sources,
      tags: ['mock'],
      online_status: 'online',
      audit_status: 'approved',
      audit_reject_reason: null,
      reference_count: 3,
      created_at: source.updated_at,
      updated_at: source.updated_at,
    })),
    citations: [],
    downstream: {
      url: 'mock://knowledge-recall/agentic-search',
      http_status: 200,
      sync_code: 'ok',
      latency_ms: 420,
      message: 'ok',
    },
    latency_ms: 420,
  },
]
```

- [ ] **Step 3: 补 history handler**

在 `knowledgeRecallHandlers` 中追加：

```ts
http.get(`${API_BASE}/knowledge-recall/:ownerType/:ownerId/history`, ({ request }) => {
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('page_size')) || 20))
  const cardType = url.searchParams.get('card_type')
  const recallStatus = url.searchParams.get('recall_status')
  const filtered = recallHistorySessions.filter((item) => {
    if (cardType && item.card_type !== cardType) return false
    if (recallStatus && item.recall_status !== recallStatus) return false
    return true
  })
  const start = (page - 1) * pageSize

  return HttpResponse.json({
    code: 0,
    message: 'ok',
    data: {
      total: filtered.length,
      page,
      page_size: pageSize,
      items: filtered.slice(start, start + pageSize).map(({ retrieved_sources, citations, downstream, latency_ms, ...item }) => item),
    },
  })
})
```

- [ ] **Step 4: 补 session detail handler**

在 `knowledgeRecallHandlers` 中追加：

```ts
http.get(`${API_BASE}/knowledge-recall/sessions/:sessionId`, ({ params }) => {
  const session = recallHistorySessions.find((item) => item.id === params.sessionId)
  if (!session) {
    return HttpResponse.json({ code: 404, message: 'session not found', data: null }, { status: 404 })
  }

  return HttpResponse.json({
    code: 0,
    message: 'ok',
    data: session,
  })
})
```

- [ ] **Step 5: 运行单测**

Run:

```bash
cd mediverse-management-frontend && pnpm exec vitest run tests/unit/knowledgeRecall.test.ts
```

Expected: PASS。

## Task 4: 在召回测试页增加历史弹窗

**Files:**
- Modify: `src/views/shared/KnowledgeRecallTest.vue`

- [ ] **Step 1: 将现有结果改为 ViewModel**

在 `src/views/shared/KnowledgeRecallTest.vue` 中：

```ts
import {
  normalizeKnowledgeRecallResult,
  normalizeKnowledgeRecallSessionDetail,
} from '@/utils/knowledgeRecall'
import type {
  KnowledgeRecallHistoryParams,
  KnowledgeRecallSessionItem,
  KnowledgeRecallViewModel,
  KnowledgeRecallViewSource,
} from '@/types/knowledgeRecall'
```

将：

```ts
const result = ref<KnowledgeRecallResult | null>(null)
const selectedSource = ref<KnowledgeRecallSource | null>(null)
```

改为：

```ts
const result = ref<KnowledgeRecallViewModel | null>(null)
const selectedSource = ref<KnowledgeRecallViewSource | null>(null)
```

- [ ] **Step 2: 执行召回时写入统一 ViewModel**

将 `handleRecall` 成功赋值改为：

```ts
const data = await recallKnowledgeCards(props.ownerType, props.ownerId, {
  query: text,
  topK: normalizedTopK.value,
  cardTypes: selectedCardTypes.value,
  availableCardTypes: availableCardTypes.value,
})
result.value = normalizeKnowledgeRecallResult(data, {
  topK: normalizedTopK.value,
  cardTypes: selectedCardTypes.value,
})
```

模板字段同步调整：

```ts
source.score
source.mdContent
source.jsonContent
source.sourceFiles
source.cardId
```

- [ ] **Step 3: 增加历史按钮**

在页面 header 操作区的“重置”和“执行测试”按钮旁新增：

```vue
<a-button :loading="historyLoading" @click="openHistoryModal">
  {{ t('knowledge.recall.historyEntry') }}
</a-button>
```

- [ ] **Step 4: 增加历史弹窗状态**

在 script 中新增：

```ts
const historyOpen = ref(false)
const historyLoading = ref(false)
const historyDetailLoading = ref(false)
const historyRows = ref<KnowledgeRecallSessionItem[]>([])
const historyTotal = ref(0)
const historyPage = ref(1)
const historyPageSize = ref(10)
const historyFilters = ref<KnowledgeRecallHistoryParams>({})

const historyPagination = computed(() => ({
  current: historyPage.value,
  pageSize: historyPageSize.value,
  total: historyTotal.value,
  showSizeChanger: true,
}))
```

- [ ] **Step 5: 增加历史列表加载函数**

在 script 中新增：

```ts
import {
  getKnowledgeRecallHistory,
  getKnowledgeRecallSessionDetail,
} from '@/api/knowledgeRecall'

async function fetchHistory() {
  if (!props.ownerId) return
  historyLoading.value = true
  try {
    const data = await getKnowledgeRecallHistory(props.ownerType, props.ownerId, {
      ...historyFilters.value,
      page: historyPage.value,
      page_size: historyPageSize.value,
    })
    historyRows.value = data.items
    historyTotal.value = data.total
  } finally {
    historyLoading.value = false
  }
}

function openHistoryModal() {
  historyOpen.value = true
  fetchHistory()
}

function handleHistorySearch() {
  historyPage.value = 1
  fetchHistory()
}
```

- [ ] **Step 6: 增加选中历史回填函数**

在 script 中新增：

```ts
async function handleSelectHistory(row: KnowledgeRecallSessionItem) {
  historyDetailLoading.value = true
  try {
    const detail = await getKnowledgeRecallSessionDetail(row.id)
    const view = normalizeKnowledgeRecallSessionDetail(detail)
    result.value = view
    query.value = view.query
    topK.value = view.topK ?? 5
    if (view.cardType) {
      selectedAllCardTypes.value = false
      selectedCardTypes.value = [view.cardType]
    } else {
      selectedAllCardTypes.value = true
      selectedCardTypes.value = [...availableCardTypes.value]
    }
    selectedSource.value = null
    detailOpen.value = false
    historyOpen.value = false
  } finally {
    historyDetailLoading.value = false
  }
}
```

- [ ] **Step 7: 增加历史列表弹窗模板**

在现有知识卡详情 `a-modal` 前追加：

```vue
<a-modal
  v-model:open="historyOpen"
  width="min(960px, calc(100vw - 48px))"
  :title="t('knowledge.recall.historyTitle')"
  destroy-on-close
>
  <div class="space-y-4">
    <div class="flex flex-wrap items-end gap-3">
      <a-form-item class="mb-0" :label="t('knowledge.recall.cardTypeLabel')">
        <a-select
          v-model:value="historyFilters.card_type"
          allow-clear
          class="w-48"
          :placeholder="t('knowledge.recall.allTypes')"
          :options="historyCardTypeOptions"
        />
      </a-form-item>
      <a-form-item class="mb-0" :label="t('knowledge.recall.statusLabel')">
        <a-select
          v-model:value="historyFilters.recall_status"
          allow-clear
          class="w-40"
          :placeholder="t('common.all')"
          :options="historyStatusOptions"
        />
      </a-form-item>
      <a-button type="primary" :loading="historyLoading" @click="handleHistorySearch">
        {{ t('common.search') }}
      </a-button>
    </div>

    <a-table
      row-key="id"
      size="middle"
      :columns="historyColumns"
      :data-source="historyRows"
      :loading="historyLoading || historyDetailLoading"
      :pagination="historyPagination"
      @change="handleHistoryTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="handleSelectHistory(record)">
            {{ t('common.view') }}
          </a-button>
        </template>
      </template>
    </a-table>
  </div>

  <template #footer>
    <a-button @click="historyOpen = false">{{ t('common.close') }}</a-button>
  </template>
</a-modal>
```

在 script 中补：

```ts
const historyStatusOptions = computed(() => [
  { label: t('knowledge.recall.statusSuccess'), value: 'success' },
  { label: t('knowledge.recall.statusFailed'), value: 'failed' },
  { label: t('knowledge.recall.statusTimeout'), value: 'timeout' },
  { label: t('knowledge.recall.statusError'), value: 'error' },
])

const historyCardTypeOptions = computed(() =>
  cardTypes.value.map((item) => ({
    label: getCardTypeOptionLabel(item, translateKnowledgeConfig),
    value: item.code,
  }))
)

const historyColumns = computed(() => [
  { title: t('knowledge.recall.queryColumn'), dataIndex: 'query', key: 'query', ellipsis: true },
  { title: t('knowledge.recall.cardTypeLabel'), dataIndex: 'card_type', key: 'card_type', width: 140 },
  { title: 'Top-K', dataIndex: 'topk', key: 'topk', width: 90 },
  { title: t('knowledge.recall.cardCount'), dataIndex: 'card_count', key: 'card_count', width: 110 },
  { title: t('knowledge.recall.statusLabel'), dataIndex: 'recall_status', key: 'recall_status', width: 120 },
  { title: t('knowledge.recall.latency'), dataIndex: 'latency', key: 'latency', width: 100 },
  { title: t('common.createdAt'), dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: t('common.action'), key: 'action', width: 90, fixed: 'right' },
])

function handleHistoryTableChange(pager: { current?: number; pageSize?: number }) {
  historyPage.value = pager.current ?? 1
  historyPageSize.value = pager.pageSize ?? 10
  fetchHistory()
}
```

## Task 5: 知识卡详情弹窗复用历史详情字段

**Files:**
- Modify: `src/views/shared/KnowledgeRecallTest.vue`

- [ ] **Step 1: 调整详情字段计算**

将详情计算字段改为消费 ViewModel source：

```ts
const detailTitle = computed(() => selectedSource.value?.title || '-')
const detailCardId = computed(() => selectedSource.value?.cardId || '-')
const detailCardType = computed(() => selectedSource.value?.cardType || 'rule')
const detailUpdatedAt = computed(() => {
  const raw = selectedSource.value?.updatedAt
  if (!raw) return '-'
  const value = dayjs(raw)
  return value.isValid() ? value.format('YYYY-MM-DD HH:mm:ss') : raw
})
const detailMarkdown = computed(() => selectedSource.value?.mdContent ?? '')
const detailJsonContent = computed(() => selectedSource.value?.jsonContent ?? '')
const detailSourceFiles = computed<FileSource[]>(() => selectedSource.value?.sourceFiles ?? [])
```

- [ ] **Step 2: 保留 Markdown 正文展示**

现有左侧 Markdown 正文继续使用：

```ts
const hasDetailMarkdown = computed(() => detailMarkdown.value.trim() !== '')
const detailMarkdownHtml = computed(() => renderMarkdownSafe(detailMarkdown.value))
```

- [ ] **Step 3: 补 JSON 内容展示**

如果当前详情弹窗只展示 Markdown，在右侧“召回表现”和“关联文件”之间增加 JSON 内容区：

```vue
<section v-if="detailJsonContent" class="knowledge-recall-detail__panel">
  <div class="mb-3 flex items-center gap-2 text-sm font-semibold">
    <FileTextOutlined class="text-primary" />
    <span>{{ t('knowledge.card.jsonPane') }}</span>
  </div>
  <pre class="max-h-48 overflow-auto rounded-md border border-(--color-border) bg-white p-3 text-xs dark:bg-slate-900">{{ detailJsonContent }}</pre>
</section>
```

- [ ] **Step 4: 确认点击历史卡片仍能打开详情**

Run:

```bash
cd mediverse-management-frontend && pnpm exec vitest run tests/unit/knowledgeRecall.test.ts
```

Expected: PASS。

## Task 6: i18n 和文档同步

**Files:**
- Modify: `src/i18n/locales/zh-CN.ts`
- Modify: `src/i18n/locales/en-US.ts`
- Modify: `docs/documentation-task-board.md`

- [ ] **Step 1: 补中文文案**

在 `src/i18n/locales/zh-CN.ts` 的 `knowledge.recall` 下新增：

```ts
historyEntry: '召回历史',
historyTitle: '召回历史',
historySubtitle: '查看历史召回记录、答案和命中的知识卡。',
statusLabel: '状态',
statusSuccess: '成功',
statusFailed: '失败',
statusTimeout: '超时',
statusError: '错误',
queryColumn: '问题',
cardCount: '召回数量',
latency: '耗时',
```

- [ ] **Step 2: 补英文文案**

在 `src/i18n/locales/en-US.ts` 的 `knowledge.recall` 下新增：

```ts
historyEntry: 'Recall History',
historyTitle: 'Recall History',
historySubtitle: 'Review previous recall sessions, answers, and retrieved knowledge cards.',
statusLabel: 'Status',
statusSuccess: 'Success',
statusFailed: 'Failed',
statusTimeout: 'Timeout',
statusError: 'Error',
queryColumn: 'Query',
cardCount: 'Retrieved',
latency: 'Latency',
```

- [ ] **Step 3: 更新文档看板**

在 `docs/documentation-task-board.md` 的“近期同步记录”顶部追加：

```md
- 知识卡召回测试页新增召回历史弹窗：列表对接 §4.4.1，选中记录后调用 §4.4.2 并通过统一 ViewModel 回填现有召回测试结果区；点击召回知识卡详情直接使用 `retrieved_sources[].md_content/json_content`。
```

## Task 7: 验证

**Files:**
- No code changes.

- [ ] **Step 1: 运行单测**

Run:

```bash
cd mediverse-management-frontend && pnpm exec vitest run tests/unit/knowledgeRecall.test.ts
```

Expected: PASS。

- [ ] **Step 2: 运行文档检查**

Run:

```bash
cd mediverse-management-frontend && pnpm check:docs
```

Expected: PASS。

- [ ] **Step 3: 运行前端聚合验证**

Run:

```bash
cd mediverse-management-frontend && pnpm verify
```

Expected: PASS。

- [ ] **Step 4: mock 后端验证**

如果修改了 `../mediverse-management-mock-backend/app/contracts/openapi.json` 且 Python 依赖可用，运行：

```bash
cd ../mediverse-management-mock-backend && pytest -q && ruff check .
```

Expected: PASS。若当前环境缺 Python 依赖，在交付说明写明未运行原因。

## Task 8: 浏览器验收

**Files:**
- No code changes.

- [ ] **Step 1: 启动前端开发服务**

Run:

```bash
cd mediverse-management-frontend && pnpm dev
```

Expected: Vite dev server starts and prints a localhost URL.

- [ ] **Step 2: 验收召回历史弹窗**

验收路径：

```text
1. 登录后进入个人/科室/机构任一知识卡管理页。
2. 点击“召回测试”进入现有召回测试页。
3. 点击“召回历史”。
4. 确认历史列表以弹窗展示，当前 URL 不变化。
5. 使用状态或卡类型筛选后列表重新加载。
6. 点击一条历史记录的“查看”。
7. 确认弹窗关闭，召回测试页输入框、Top-K、卡类型选择和结果区被历史详情数据回填。
8. 确认最终回答、召回知识卡、耗时和命中数来自历史详情。
9. 点击召回知识卡，确认详情弹窗展示 Markdown 和 JSON 正文。
10. 对空 `card_id` 的历史卡片确认详情仍可展示，ID 显示为 `-`。
```

Expected: 全部通过，无新增菜单、无新增历史页、无控制台错误。

## Commit 建议

- `feat: add recall history adapters`
  - OpenAPI 快照补 `md_content/json_content`
  - 召回历史类型、API 和 ViewModel 适配
  - 单元测试与 API contract 断言
- `feat: show recall history in recall test`
  - 召回测试页新增历史入口弹窗
  - 选中历史后回填现有结果区
  - 召回知识卡详情弹窗消费历史详情正文
- `docs: update recall history documentation status`
  - 更新文档看板
  - 记录召回历史弹窗与合同同步

## 自查清单

- [ ] 没有新增 `KnowledgeRecallHistory.vue`、`/recall-history` 路由或菜单。
- [ ] 4.4.2 原始字段没有直接散落在模板中，页面消费统一 ViewModel。
- [ ] `md_content/json_content` 同步到 API 文档、OpenAPI 快照、类型、mock、测试。
- [ ] 选中历史记录后会回填 `query`、`topK`、卡类型选择和 `result`。
- [ ] `card_id` 为空时不阻断知识卡详情展示。
- [ ] 没有实现删除/清空历史等未要求能力。
- [ ] `pnpm check:docs`、`pnpm verify` 已执行或说明原因。
