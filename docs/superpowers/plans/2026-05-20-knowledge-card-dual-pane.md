# 知识卡 Markdown + JSON 双栏展示实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将知识卡详情改为 JSON + Markdown 双栏展示，编辑器从 Tiptap(HTML) 替换为 md-editor-v3(Markdown)，数据层对齐 API 设计的 `json_content` + `md_content` 双字段。

**Architecture:** 数据层新增 `json_content` / `md_content` 字段并在 `normalizeKnowledgeCard` 中做旧数据兼容；UI 层在 Viewer 的 content tab 中用 CSS grid 实现左右分栏（左 vue-json-pretty、右 marked 渲染）；Editor 替换为 md-editor-v3 直接输出 Markdown。

**Tech Stack:** Vue 3 + TypeScript, Ant Design Vue, vue-json-pretty, md-editor-v3, marked, DOMPurify, MSW (mock)

**Spec:** `docs/superpowers/specs/2026-05-20-knowledge-card-dual-pane-design.md`

---

### Task 1: 安装新依赖、移除 Tiptap 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 vue-json-pretty 和 md-editor-v3**

```bash
pnpm add vue-json-pretty md-editor-v3
```

- [ ] **Step 2: 移除 Tiptap 依赖**

```bash
pnpm remove @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-placeholder
```

- [ ] **Step 3: 验证依赖安装成功**

```bash
pnpm build
```

此步预期会失败（因为 TiptapEditor.vue 引用了已移除的 tiptap 包），确认错误仅来自 tiptap 引用即可，后续 Task 会修复。

- [ ] **Step 4: 提交**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): 新增 vue-json-pretty、md-editor-v3，移除 tiptap 依赖"
```

---

### Task 2: 数据层 — 类型定义改造

**Files:**
- Modify: `src/types/knowledge.ts:83-110` (KnowledgeCard 接口)
- Modify: `src/types/knowledge.ts:208-217` (KnowledgeCardPayload 接口)

- [ ] **Step 1: KnowledgeCard 接口新增 json_content 和 md_content**

在 `src/types/knowledge.ts` 的 `KnowledgeCard` 接口中，在 `content: string` 之后新增两个字段：

```typescript
export interface KnowledgeCard {
  id: string
  title: string
  content: string
  json_content: string
  md_content: string
  type: CardType
  // ...rest stays the same
}
```

- [ ] **Step 2: KnowledgeCardPayload 接口替换 content 为 md_content**

将 `KnowledgeCardPayload` 的 `content` 字段替换为 `md_content`，创建请求不传 `json_content`：

```typescript
export interface KnowledgeCardPayload {
  id?: string
  title: string
  md_content: string
  type: CardType
  tags: string[]
  source_file_ids?: string[]
}
```

- [ ] **Step 3: 提交**

```bash
git add src/types/knowledge.ts
git commit -m "feat(knowledge): 类型定义新增 json_content、md_content 字段"
```

---

### Task 3: 数据层 — API 归一化和调用改造

**Files:**
- Modify: `src/api/knowledge.ts:40-87` (normalizeKnowledgeCard)
- Modify: `src/api/knowledge.ts:248-272` (saveKnowledgeCard, updateKnowledgeCard)

- [ ] **Step 1: 修改 normalizeKnowledgeCard 增加双字段兼容**

在 `src/api/knowledge.ts` 的 `normalizeKnowledgeCard` 函数中，在 `return { ...base, source_files, version, current_version }` 之前，增加 `json_content` 和 `md_content` 归一化逻辑：

```typescript
function normalizeKnowledgeCard(data: unknown): KnowledgeCard {
  // ...existing code until the return statement...

  const json_content =
    typeof raw.json_content === 'string' ? raw.json_content : ''
  const md_content =
    typeof raw.md_content === 'string' && raw.md_content !== ''
      ? raw.md_content
      : typeof base.content === 'string'
        ? base.content
        : ''
  const content = md_content || (typeof base.content === 'string' ? base.content : '')

  return {
    ...base,
    source_files,
    version,
    current_version:
      typeof cv === 'number' || (typeof cv === 'string' && cv !== '') ? cv : base.current_version,
    json_content,
    md_content,
    content,
  }
}
```

- [ ] **Step 2: 修改 saveKnowledgeCard 的 payload 类型签名**

`saveKnowledgeCard` 函数已经接收 `KnowledgeCardPayload` 类型，Task 2 已经把 payload 改为 `md_content`，这里无需改动函数签名。调用方会在 Task 5 中调整传入的字段。

- [ ] **Step 3: 修改 updateKnowledgeCard 的 payload 类型**

将 `updateKnowledgeCard` 的 payload 类型中 `content` 改为 `md_content`：

```typescript
export function updateKnowledgeCard(
  ownerType: OwnerType,
  ownerId: string,
  cardId: string,
  payload: Partial<
    Pick<KnowledgeCardPayload, 'title' | 'md_content' | 'tags'> & { change_summary?: string }
  >
) {
  return request
    .put<KnowledgeCard>(`${BASE_URL}/${ownerType}/${ownerId}/cards/${cardId}`, payload)
    .then(normalizeKnowledgeCard)
}
```

- [ ] **Step 4: 更新 import 列表**

确认 `src/api/knowledge.ts` 顶部的 import 中包含了新的类型（`KnowledgeCardPayload` 已经在 import 中，无需改动）。

- [ ] **Step 5: 提交**

```bash
git add src/api/knowledge.ts
git commit -m "feat(knowledge): API 层适配 json_content/md_content 双字段"
```

---

### Task 4: 新建 MarkdownEditor 组件（替换 TiptapEditor）

**Files:**
- Create: `src/components/KnowledgeCardEditor/MarkdownEditor.vue`
- Delete: `src/components/KnowledgeCardEditor/TiptapEditor.vue`

- [ ] **Step 1: 创建 MarkdownEditor.vue**

创建 `src/components/KnowledgeCardEditor/MarkdownEditor.vue`：

```vue
<template>
  <MdEditor
    v-model="content"
    :language="locale === 'zh-CN' ? 'zh-CN' : 'en-US'"
    :placeholder="placeholder"
    :style="{ height: '400px' }"
    :preview="false"
    :toolbars="toolbars"
  />
</template>

<script setup lang="ts">
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

defineProps<{
  placeholder?: string
}>()

const content = defineModel<string>({ default: '' })

const toolbars = [
  'bold',
  'italic',
  'strikeThrough',
  '-',
  'title',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'quote',
  '-',
  'table',
  'link',
] as const
</script>
```

- [ ] **Step 2: 删除 TiptapEditor.vue**

```bash
rm src/components/KnowledgeCardEditor/TiptapEditor.vue
```

- [ ] **Step 3: 提交**

```bash
git add src/components/KnowledgeCardEditor/MarkdownEditor.vue
git rm src/components/KnowledgeCardEditor/TiptapEditor.vue
git commit -m "feat(knowledge): 用 md-editor-v3 替换 TiptapEditor"
```

---

### Task 5: 改造 KnowledgeCardEditor/index.vue

**Files:**
- Modify: `src/components/KnowledgeCardEditor/index.vue`

- [ ] **Step 1: 替换 TiptapEditor 引用为 MarkdownEditor**

在 `<script setup>` 中将：

```typescript
import TiptapEditor from './TiptapEditor.vue'
```

替换为：

```typescript
import MarkdownEditor from './MarkdownEditor.vue'
```

- [ ] **Step 2: 替换 template 中的编辑器组件**

将 template 中的：

```vue
<a-form-item
  name="content"
  :label="t('knowledge.card.contentLabel')"
  :rules="[{ required: true, message: t('knowledge.card.contentRequired') }]"
>
  <TiptapEditor
    :model-value="formState.content"
    :placeholder="t('knowledge.card.contentPlaceholder')"
    @update:model-value="(val) => (formState.content = val)"
  />
</a-form-item>
```

替换为：

```vue
<a-form-item
  name="md_content"
  :label="t('knowledge.card.contentLabel')"
  :rules="[{ required: true, message: t('knowledge.card.contentRequired') }]"
>
  <MarkdownEditor
    v-model="formState.md_content"
    :placeholder="t('knowledge.card.contentPlaceholder')"
  />
</a-form-item>
```

- [ ] **Step 3: 修改 formState 中的字段名**

将 `formState` reactive 对象中的 `content` 改为 `md_content`：

```typescript
const formState = reactive({
  title: '',
  type: '' as CardType,
  md_content: '',
  tags: [] as string[],
  source_file_ids: [] as string[],
  change_summary: '',
})
```

- [ ] **Step 4: 修改 watch 中的字段引用**

在 `watch(() => props.open, ...)` 中，将所有 `formState.content` 替换为 `formState.md_content`，将读取源从 `props.card.content` 改为 `props.card.md_content`（兼容回退到 `props.card.content`）：

```typescript
watch(
  () => props.open,
  async (val) => {
    if (!val) {
      editorLoadGeneration++
      return
    }
    if (props.card) {
      const loadGen = editorLoadGeneration
      formState.title = props.card.title
      formState.type = props.card.type
      formState.tags = [...props.card.tags]
      formState.source_file_ids = []
      formState.change_summary = ''

      const mdSource = props.card.md_content || props.card.content
      const fromList = typeof mdSource === 'string' && mdSource.trim().length > 0
      if (fromList) {
        formState.md_content = mdSource
      } else if (props.card.id) {
        contentResolving.value = true
        try {
          const detail = await getKnowledgeCardDetail(props.ownerType, props.ownerId, props.card.id)
          if (loadGen !== editorLoadGeneration) return
          formState.md_content = detail.md_content || detail.content || ''
        } catch {
          if (loadGen !== editorLoadGeneration) return
          formState.md_content = ''
          message.error(t('knowledge.card.fetchDetailFailed'))
        } finally {
          if (loadGen === editorLoadGeneration) contentResolving.value = false
        }
      } else {
        formState.md_content = ''
      }
    } else {
      formState.title = ''
      formState.type = props.cardTypes?.[0]?.code ?? ('' as CardType)
      formState.md_content = ''
      formState.tags = []
      formState.source_file_ids = []
      formState.change_summary = ''
      loadEditorSourceFiles()
    }
  }
)
```

- [ ] **Step 5: 修改 handleOk 中的提交字段**

将 `handleOk` 中提交的字段从 `content` 改为 `md_content`：

```typescript
const handleOk = async () => {
  try {
    await formRef.value.validate()
    loading.value = true

    if (props.card?.id) {
      await updateKnowledgeCard(props.ownerType, props.ownerId, props.card.id, {
        title: formState.title,
        md_content: formState.md_content,
        tags: formState.tags,
        change_summary: formState.change_summary || undefined,
      })
    } else {
      await saveKnowledgeCard(props.ownerType, props.ownerId, {
        title: formState.title,
        md_content: formState.md_content,
        type: formState.type,
        tags: formState.tags,
        source_file_ids: formState.source_file_ids.length ? formState.source_file_ids : undefined,
      })
    }

    message.success(
      props.card ? t('knowledge.card.saveSuccess') : t('knowledge.card.createSuccess')
    )
    emit('success')
    handleCancel()
  } catch (err) {
    console.error('Save card failed:', err)
  } finally {
    loading.value = false
  }
}
```

- [ ] **Step 6: 提交**

```bash
git add src/components/KnowledgeCardEditor/index.vue
git commit -m "feat(knowledge): 编辑器改用 md-editor-v3，字段对齐 md_content"
```

---

### Task 6: 新建 JsonContentPane 组件

**Files:**
- Create: `src/components/KnowledgeCardViewer/JsonContentPane.vue`

- [ ] **Step 1: 创建 JsonContentPane.vue**

```vue
<template>
  <div class="json-content-pane">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-500">{{ t('knowledge.card.jsonPane') }}</span>
      <a-button size="small" type="text" @click="handleCopy">
        <template #icon><CopyOutlined /></template>
        {{ t('knowledge.card.copyJson') }}
      </a-button>
    </div>
    <div class="json-content-pane__body">
      <vue-json-pretty
        v-if="parsedData !== null"
        :data="parsedData"
        :deep="3"
        :show-line="false"
        show-double-quotes
      />
      <a-empty v-else :description="t('knowledge.card.jsonEmpty')" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message, Empty } from 'ant-design-vue'
import { CopyOutlined } from '@ant-design/icons-vue'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'

const { t } = useI18n()

const props = defineProps<{
  jsonContent: string
}>()

const parsedData = computed(() => {
  if (!props.jsonContent || props.jsonContent.trim() === '') return null
  try {
    return JSON.parse(props.jsonContent)
  } catch {
    return null
  }
})

function handleCopy() {
  const text = props.jsonContent || '{}'
  navigator.clipboard.writeText(text).then(() => {
    message.success(t('common.copySuccess'))
  })
}
</script>

<style scoped>
.json-content-pane__body {
  max-height: min(480px, calc(100vh - 240px));
  overflow-y: auto;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add src/components/KnowledgeCardViewer/JsonContentPane.vue
git commit -m "feat(knowledge): 新增 JsonContentPane 只读 JSON 展示组件"
```

---

### Task 7: 改造 KnowledgeCardViewer 详情页为双栏展示

**Files:**
- Modify: `src/components/KnowledgeCardViewer/index.vue:73-111` (content tab template)
- Modify: `src/components/KnowledgeCardViewer/index.vue:272-276` (renderedContent computed)

- [ ] **Step 1: 新增 import**

在 `<script setup>` 的 import 区域新增：

```typescript
import JsonContentPane from './JsonContentPane.vue'
```

- [ ] **Step 2: 修改 renderedContent 计算属性**

将 `renderedContent` 的数据源从 `card.value?.content` 改为 `card.value?.md_content`（兼容回退 `content`）：

```typescript
const renderedContent = computed(() => {
  const content = card.value?.md_content || card.value?.content || ''
  const html = marked.parse(content) as string
  return DOMPurify.sanitize(html)
})
```

- [ ] **Step 3: 修改 readonlyPreview 模式的 template 为双栏**

将 `<template v-if="readonlyPreview">` 内的正文展示区域改为双栏：

```vue
<template v-if="readonlyPreview">
  <div class="grid grid-cols-2 gap-4">
    <JsonContentPane :json-content="card.json_content" />
    <div>
      <div class="text-sm font-medium text-gray-500 mb-2">{{ t('knowledge.card.markdownPane') }}</div>
      <div
        class="p-4 bg-gray-50 rounded-lg min-h-[200px] max-h-[min(480px,calc(100vh-240px))] overflow-y-auto"
      >
        <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
        <div class="markdown-body" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
  <div v-if="card.tags?.length" class="mt-4 flex flex-wrap gap-1.5">
    <a-tag v-for="tag in card.tags" :key="tag" class="m-0"> #{{ tag }} </a-tag>
  </div>
  <div class="mt-6">
    <AssociatedFilesList
      :rows="sourceFileRows"
      :opening-id="openingSourceFileId"
      @open="openSourceFilePreview"
    />
  </div>
</template>
```

- [ ] **Step 4: 修改 content tab 的 template 为双栏**

将 `<a-tab-pane key="content">` 内的正文展示区域改为双栏：

```vue
<a-tab-pane key="content" :tab="t('knowledge.card.tabContent')">
  <div class="grid grid-cols-2 gap-4">
    <JsonContentPane :json-content="card.json_content" />
    <div>
      <div class="text-sm font-medium text-gray-500 mb-2">{{ t('knowledge.card.markdownPane') }}</div>
      <div
        class="p-4 bg-gray-50 rounded-lg min-h-[200px] max-h-[min(480px,calc(100vh-240px))] overflow-y-auto"
      >
        <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
        <div class="markdown-body" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
  <div v-if="card.tags?.length" class="mt-4 flex flex-wrap gap-1.5">
    <a-tag v-for="tag in card.tags" :key="tag" class="m-0"> #{{ tag }} </a-tag>
  </div>
  <div class="mt-6">
    <AssociatedFilesList
      :rows="sourceFileRows"
      :opening-id="openingSourceFileId"
      @open="openSourceFilePreview"
    />
  </div>
</a-tab-pane>
```

- [ ] **Step 5: 提交**

```bash
git add src/components/KnowledgeCardViewer/index.vue
git commit -m "feat(knowledge): 详情页改为 JSON + Markdown 双栏展示"
```

---

### Task 8: 国际化 i18n 补充

**Files:**
- Modify: `src/i18n/locales/zh-CN.ts:306-388` (knowledge.card 区域)
- Modify: `src/i18n/locales/en-US.ts:309-393` (knowledge.card 区域)

- [ ] **Step 1: 中文 i18n 新增键**

在 `src/i18n/locales/zh-CN.ts` 的 `knowledge.card` 对象中，在 `tagMaxLimit` 之前新增：

```typescript
jsonPane: 'JSON',
markdownPane: 'Markdown',
copyJson: '复制 JSON',
jsonEmpty: '暂无 JSON 数据',
```

- [ ] **Step 2: 英文 i18n 新增键**

在 `src/i18n/locales/en-US.ts` 的 `knowledge.card` 对象中，在 `tagMaxLimit` 之前新增：

```typescript
jsonPane: 'JSON',
markdownPane: 'Markdown',
copyJson: 'Copy JSON',
jsonEmpty: 'No JSON data available',
```

- [ ] **Step 3: 提交**

```bash
git add src/i18n/locales/zh-CN.ts src/i18n/locales/en-US.ts
git commit -m "feat(i18n): 知识卡双栏展示国际化文案"
```

---

### Task 9: Mock 数据同步

**Files:**
- Modify: `src/mocks/data/knowledgeCards.ts`
- Modify: `src/mocks/handlers/knowledge.ts:365,402-425,498-509`

- [ ] **Step 1: mock 知识卡数据增加 json_content 和 md_content**

在 `src/mocks/data/knowledgeCards.ts` 中，为每条 `mockKnowledgeCards` 数据新增 `json_content` 和 `md_content` 字段。`md_content` 取原 `content` 的值，`json_content` 填充示例结构化数据：

```typescript
export const mockKnowledgeCards: KnowledgeCard[] = [
  {
    id: 'card_001',
    title: '高血压诊断标准',
    type: 'evidence',
    content:
      '### 高血压诊断标准\n\n根据《中国高血压防治指南（2018年修订版）》，在未用抗高血压药的情况下，非同日3次测量血压，收缩压≥140mmHg和/或舒张压≥90mmHg即可诊断为高血压。\n\n#### 血压水平分类：\n- **正常血压**：收缩压 <120 且 舒张压 <80\n- **正常高值**：收缩压 120-139 或 舒张压 80-89\n- **1级高血压**：收缩压 140-159 或 舒张压 90-99\n- **2级高血压**：收缩压 160-179 或 舒张压 100-109\n- **3级高血压**：收缩压 ≥180 或 舒张压 ≥110',
    md_content:
      '### 高血压诊断标准\n\n根据《中国高血压防治指南（2018年修订版）》，在未用抗高血压药的情况下，非同日3次测量血压，收缩压≥140mmHg和/或舒张压≥90mmHg即可诊断为高血压。\n\n#### 血压水平分类：\n- **正常血压**：收缩压 <120 且 舒张压 <80\n- **正常高值**：收缩压 120-139 或 舒张压 80-89\n- **1级高血压**：收缩压 140-159 或 舒张压 90-99\n- **2级高血压**：收缩压 160-179 或 舒张压 100-109\n- **3级高血压**：收缩压 ≥180 或 舒张压 ≥110',
    json_content: JSON.stringify({
      title: '高血压诊断标准',
      source: '中国高血压防治指南（2018年修订版）',
      criteria: { systolic: '>=140mmHg', diastolic: '>=90mmHg', measurement: '非同日3次' },
      classification: [
        { level: '正常血压', systolic: '<120', diastolic: '<80' },
        { level: '正常高值', systolic: '120-139', diastolic: '80-89' },
        { level: '1级高血压', systolic: '140-159', diastolic: '90-99' },
        { level: '2级高血压', systolic: '160-179', diastolic: '100-109' },
        { level: '3级高血压', systolic: '>=180', diastolic: '>=110' },
      ],
    }, null, 2),
    tags: ['高血压', '诊断', '指南'],
    // ...rest stays the same
  },
  // card_002, card_003, card_004 同理：
  // md_content = 原 content 值
  // json_content = 对应的示例 JSON 字符串（可用简单结构）
]
```

对 card_002、card_003、card_004 同样处理。简单的 json_content 示例：

```typescript
// card_002
json_content: JSON.stringify({ title: '降压药物选用原则', principles: ['小剂量开始', '优先长效制剂', '联合用药', '个体化治疗'] }, null, 2),

// card_003
json_content: JSON.stringify({ title: '顽固性高血压处理经验', factors: ['伪难治性高血压', '生活方式未改善', '药物干扰'], recommendation: '螺内酯 25mg/d' }, null, 2),

// card_004
json_content: JSON.stringify({ title: '跌倒风险评分', target: '高龄、步态不稳、镇静药物患者', timing: '入院24小时内', measures: ['床旁提醒', '陪护宣教', '夜间巡视加密'] }, null, 2),
```

- [ ] **Step 2: mock handler — 修改搜索过滤**

在 `src/mocks/handlers/knowledge.ts` 第 365 行，将关键字搜索中的 `c.content` 改为 `c.md_content`：

```typescript
filtered = filtered.filter(
  (c) => c.title.toLowerCase().includes(kw) || c.md_content.toLowerCase().includes(kw)
)
```

- [ ] **Step 3: mock handler — 修改创建知识卡**

在 `src/mocks/handlers/knowledge.ts` 的创建知识卡 handler（约第 402-425 行）中，将 `content: payload.content` 改为使用新字段：

```typescript
const newCard: KnowledgeCard = {
  id: `card_${Date.now()}`,
  title: payload.title,
  content: payload.md_content || payload.content || '',
  md_content: payload.md_content || payload.content || '',
  json_content: '',
  type: payload.type,
  // ...rest stays the same
}
```

- [ ] **Step 4: mock handler — 修改回退知识卡**

在 `src/mocks/handlers/knowledge.ts` 的回退 handler（约第 504 行），将 `card.content = versionData.content` 改为同时更新 `md_content`：

```typescript
if (card && versionData) {
  card.content = versionData.content
  card.md_content = versionData.content
  card.version = versionData.version
  card.updated_at = new Date().toISOString()
  return HttpResponse.json({ code: 0, message: 'ok', data: card })
}
```

- [ ] **Step 5: 提交**

```bash
git add src/mocks/data/knowledgeCards.ts src/mocks/handlers/knowledge.ts
git commit -m "fix(mock): 知识卡 mock 数据适配 json_content/md_content"
```

---

### Task 10: 构建验证和手动测试

**Files:** 无新增/修改

- [ ] **Step 1: 运行类型检查和构建**

```bash
pnpm build
```

预期：构建成功，无类型错误。

- [ ] **Step 2: 启动开发服务器**

```bash
pnpm dev
```

- [ ] **Step 3: 手动验证 — 知识卡列表页**

打开知识卡管理页面，确认列表正常加载，无报错。

- [ ] **Step 4: 手动验证 — 知识卡详情双栏**

点击任一知识卡打开详情，确认：
- content tab 显示左右双栏（左 JSON、右 Markdown）
- JSON 栏显示格式化的 JSON 数据，支持折叠/展开
- Markdown 栏正常渲染
- 复制 JSON 按钮可用

- [ ] **Step 5: 手动验证 — 新建知识卡**

点击"新建知识卡"，确认：
- 编辑器是 Markdown 编辑器（md-editor-v3），不是 Tiptap
- 可以正常输入 Markdown 内容
- 请求 payload 不包含 `json_content`
- 提交成功

- [ ] **Step 6: 手动验证 — 编辑知识卡**

点击某张知识卡的"编辑"按钮，确认：
- 编辑器加载 Markdown 内容
- 可以修改并保存

- [ ] **Step 7: 手动验证 — 版本历史和对比**

在详情中切换到"版本历史"和"版本对比" tab，确认不报错、功能正常。
