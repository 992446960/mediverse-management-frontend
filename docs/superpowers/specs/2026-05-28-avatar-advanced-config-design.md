# 分身配置 — 高级能力配置

| 项 | 内容 |
| --- | --- |
| 版本 | v1.0 |
| 日期 | 2026-05-28 |
| 状态 | 待实施 |

## 概述

在现有 AvatarConfig 组件中新增"高级能力配置"区块，支持配置工具、技能、推理引擎和模型。该区块作为第三个 section，位于"对话策略"下方。所有使用 AvatarConfig 的页面（个人/科室/机构分身配置 + 管理后台编辑弹窗）自动获得该功能。

## UI 设计

参考截图：`docs/e9373d27487e7db97f4ec7f8d3152bbd.png`、`docs/62ccda0bad84a719b8e2c4da87ceb670.png`

### 高级能力配置区块布局

```
┌─ 高级能力配置 ─────────────────────────────────┐
│                                                │
│  工具配置：  [计算器 ×] [联网搜索 ×]            │
│              [+ 添加工具]                       │
│                                                │
│  技能配置：  [症状预问诊 ×] [病历结构化 ×]      │
│              [+ 添加技能]                       │
│                                                │
│  推理引擎：  [ 标准引擎 (低延迟...) ▾ ]         │
│                                                │
│  模型配置：  [ GPT 系列 (OpenAI) ▾ ]  >        │
│              [ GPT-4 Turbo (Preview) ▾ ]       │
│                                                │
└────────────────────────────────────────────────┘
```

### 工具/技能选择弹窗

```
┌─ 选择工具 ──────────────────────── ×  ─┐
│  🔍 搜索工具名称、功能或关键词...       │
│                                        │
│  全部        │  [计算器]    [联网搜索]  │
│  通用工具    │   ☑ 已选      ☐ 未选    │
│  医疗专业    │                          │
│  数据分析    │  每张卡片含：            │
│  办公辅助    │   - 图标                 │
│              │   - 名称                 │
│              │   - 描述                 │
│              │   - 勾选框              │
│                                        │
│            [取消]  [确定 (已选 N 项)]   │
└────────────────────────────────────────┘
```

技能选择弹窗结构相同，但无分类 tabs（技能无 category 字段）。

## API 契约

### 已有接口

| 接口 | 文件 | 说明 |
| --- | --- | --- |
| `GET /api/v1/skills` | `src/api/skills.ts` | 查询技能列表 |
| `PUT /api/v1/avatars/{id}` | `src/api/avatars.ts` | 更新分身（已支持 tools/skills/algorithm/model） |
| `GET /api/v1/my/avatar/{owner_type}/{owner_id}` | `src/api/avatarConfig.ts` | 获取分身配置 |
| `GET /api/v1/avatars/{id}` | `src/api/avatars.ts` | 获取分身详情 |

### 新增接口

#### GET /api/v1/tools

查询工具列表，按 category 分组返回。

请求参数：`category?`（可选筛选：web/memory/sessions/communication/infra/media/reasoning/medical/research）

响应：
```json
{
  "code": 0,
  "message": "ok",
  "total": 2,
  "data": [
    {
      "category": "通用工具",
      "items": [
        { "name": "calculator", "description": "支持基础及高级数学运算", "category": "通用工具" }
      ]
    }
  ]
}
```

#### GET /api/v1/engines

查询推理引擎列表。

响应：
```json
{
  "code": 0,
  "message": "ok",
  "total": 1,
  "data": [
    { "name": "standard", "description": "标准引擎 (低延迟，适用于日常交流)", "default": true, "version": "1.0" }
  ]
}
```

#### GET /api/v1/models

查询模型列表，按 provider 分组返回。

请求参数：`provider?`（可选筛选：anthropic/openai/deepseek）

响应：
```json
{
  "code": 0,
  "message": "ok",
  "total": 3,
  "data": [
    {
      "provider": "openai",
      "items": [
        {
          "id": "gpt-4-turbo",
          "name": "GPT-4 Turbo (Preview)",
          "provider": "openai",
          "api": "chat",
          "reasoning": false,
          "input": ["text"],
          "context_window": 128000,
          "max_tokens": 4096
        }
      ]
    }
  ]
}
```

### 分身更新 payload 扩展

`PUT /avatars/{id}` 的 body 新增字段（全部可选）：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| tools | string[] | 工具 name 数组，如 `["calculator", "web_search"]` |
| skills | string[] | 技能 name 数组，如 `["symptom-triage"]` |
| algorithm | string | 推理引擎 name，如 `"standard"` |
| model | `{ provider: string; model_id: string }` 或 null | 模型配置 |

## 数据模型

### 新增类型 — `src/types/advancedConfig.ts`

```typescript
export interface ToolItem {
  name: string
  description: string
  category: string
}

export interface ToolGroup {
  category: string
  items: ToolItem[]
}

export interface SkillItem {
  name: string
  description: string
}

export interface EngineItem {
  name: string
  description: string
  default: boolean
  version: string
}

export interface ModelItem {
  id: string
  name: string
  provider: string
  api: string
  reasoning: boolean
  input: string[]
  context_window: number
  max_tokens: number
}

export interface ModelGroup {
  provider: string
  items: ModelItem[]
}

export interface AvatarModelConfig {
  provider: string
  model_id: string
}
```

### 扩展现有类型

`src/types/avatar.ts` 的 `UpdateAvatarParams` 增加：

```typescript
export interface UpdateAvatarParams {
  // ... 现有字段
  tools?: string[]
  skills?: string[]
  algorithm?: string | null
  model?: { provider: string; model_id: string } | null
}
```

`src/types/avatarConfig.ts` 的 `AvatarConfig` 增加：

```typescript
export interface AvatarConfig {
  // ... 现有字段
  tools: Array<{ name: string; enabled: boolean }>
  skills: Array<{ name: string; enabled: boolean }>
  algorithms: Array<{ name: string; enabled: boolean }>
  algorithm: string | null
  model: { provider: string; model_id: string } | null
}
```

## 文件变更清单

### 新建文件

| 文件 | 说明 |
| --- | --- |
| `src/types/advancedConfig.ts` | 工具/技能/引擎/模型类型定义 |
| `src/api/advancedConfig.ts` | getTools / getEngines / getModels 接口 |
| `src/mocks/handlers/advancedConfig.ts` | tools / engines / models mock handler |
| `src/mocks/data/advancedConfig.ts` | mock 数据 |
| `src/components/AvatarConfig/ToolSkillSelector.vue` | 工具/技能选择弹窗（通用） |

### 修改文件

| 文件 | 变更 |
| --- | --- |
| `src/types/avatar.ts` | UpdateAvatarParams 增加 tools/skills/algorithm/model |
| `src/types/avatarConfig.ts` | AvatarConfig 增加 tools/skills/algorithms/algorithm/model |
| `src/components/AvatarConfig/index.vue` | 新增高级能力配置 section，formData 扩展，提交逻辑扩展 |
| `src/mocks/handlers/avatarConfig.ts` | mock 返回增加 tools/skills/algorithms/model |
| `src/mocks/handlers/index.ts` | 注册新 handler |
| `src/i18n/locales/zh-CN.ts` | 增加高级配置相关中文 |
| `src/i18n/locales/en-US.ts` | 增加高级配置相关英文 |

## 交互细节

### 工具/技能 Tag

- 已选项以 pill 形式展示（与现有 tags 风格一致），带 × 可移除
- 点击"+ 添加工具/技能"打开弹窗
- 弹窗中已选项显示勾选状态

### 推理引擎

- 单选下拉，展示 `description` 作为 label
- 若列表中有 `default: true` 的引擎，初始无值时默认选中
- 选中后 formData.algorithm 存储 name 字符串

### 模型配置

- 两个联动下拉
- 第一个选 Provider（展示格式如 "GPT 系列 (OpenAI)"），选项来自 models 分组的 provider
- 第二个选具体 Model，选项随 provider 变化
- 选中后 formData.model 存储 `{ provider, model_id }`
- Provider 映射显示名：openai → "GPT 系列 (OpenAI)"、anthropic → "Claude 系列 (Anthropic)"、deepseek → "DeepSeek 系列"

### 数据加载

- AvatarConfig 组件 onMounted 时并行加载：tools 列表、skills 列表、engines 列表、models 列表
- 加载结果缓存在组件内（这些配置列表不频繁变化）
- 分身详情返回的 tools/skills/algorithms 为 `{ name, enabled }[]` 格式，取 `enabled === true` 的 name 作为已选值

### 保存

- formData 中 tools/skills 存储为 `string[]`（name 数组），algorithm 为 `string | null`，model 为 `{ provider, model_id } | null`
- 保存时通过 UPDATE_ALLOWED_KEYS 统一发送到 `PUT /avatars/{id}`

## 不在范围内

- 创建向导 StepInfo 中不加入高级配置（可后续扩展）
- temperature / max_tokens 不暴露给用户
- 技能执行（SSE 流式）不在本次范围
