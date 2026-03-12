# Plan 09: 文件管理通用组件集

> 来源阶段：Phase 3（任务 3.1~3.6）  
> 前置依赖：Plan 04（主布局与权限体系）  
> 项目目录：`mediverse-management-frontend/`  
> 子计划：[Plan 09-01 文件预览页面](./plan-09-01-文件预览页面.md)（FilePreview 详细开发计划）

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计V2.0.md` | 四、KnowledgeBase 域 → 4.1 目录/文件 CRUD 接口 |
| 产品规划 | `doc/初始文档/产品规划.md` | 知识处理流水线（上传→解析→抽取→索引→完成） |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 文件管理页布局、目录树、上传区、文件预览（含 FilePreview 布局示意） |
| 技术设计 | `doc/初始文档/技术设计.md` | 3.1 知识库数据表结构 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | Phase 3 任务 3.1~3.6、四.1 复用分析矩阵 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 五.1~五.3 工作台上下文/知识库 API/文件处理 |

### 关键设计要点

- 所有文件管理组件通过 `ownerType` + `ownerId` 参数化，个人/科室/机构三处复用
- 使用 `provide/inject` 注入 workspace context，避免深层 Props 传递
- 文件处理状态跟踪使用轮询（5秒间隔）
- 支持文件格式：PDF/TXT/CSV/JSON/JSONL/MD/XLSX/DOCX，大小限制 50MB
- 文件预览依赖：**PDF/docx/xlsx** 使用 `vue-office`（@vue-office/pdf、@vue-office/docx、@vue-office/excel）；**md** 使用 `marked`；**txt/json/jsonl/csv** 自实现（fetch 后原样展示）
- 本计划产出 6 个通用组件 + 1 个 Composable + 1 套 API

### 文件列表接口（API V2.0）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 文件 ID |
| file_name | string | 文件名 |
| file_type | string | 文件类型（pdf/xlsx/docx/txt/md/json/jsonl/csv） |
| file_size | number | 文件大小（字节） |
| dir_id | string | 所属目录 ID |
| dir_name | string | 所属目录名 |
| status | string | uploading/parsing/extracting/indexing/done/failed |
| file_url | string | 原文件 URL（预签名） |
| parsed_file_url | string \| null | 解析后文件 URL（md 格式），仅 PDF 有值 |
| error_msg | string \| null | 失败时的错误信息 |
| auto_category_suggestion | string | 自动分类建议目录 ID |
| auto_category_name | string | 自动分类建议目录名 |
| knowledge_card_count | number | 关联知识卡数量 |
| created_by | string | 创建人 ID |
| created_by_name | string | 创建人姓名 |
| created_at | string | ISO 8601 时间 |
| updated_at | string | ISO 8601 时间 |

分页响应：`{ total, page, page_size, items }`（遵循 API V2.0 统一分页结构）

### 文件预览说明（4.1.3.1）

- **支持类型**：PDF、xlsx、word、文本型（txt、md、json、jsonl、csv）
- **PDF 双模式**：仅 PDF 支持预览「原文件」和「解析后文档」两种模式；其他类型仅预览原文件
- **渲染方案**：PDF/docx/xlsx → vue-office；md → marked；txt/json/jsonl/csv → 自实现（fetch 后原样展示）

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现全部文件管理组件、API、Composable、Mock |
| 参考 | Skill: `vue-best-practices` | 组件解耦与复用 |
| 参考 | Skill: `vue` | provide/inject、watch |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 09-1 | 安装 vue-office + marked | `pnpm add @vue-office/docx @vue-office/excel @vue-office/pdf vue-demi marked` | `package.json` |
| 09-2 | useWorkspaceContext | provide/inject Composable：注入 ownerType + ownerId，子组件自动获取 | `src/composables/useWorkspaceContext.ts` |
| 09-3 | 知识库统一 API | 目录 CRUD + 文件 CRUD + 文件状态查询，通过 `ownerType`/`ownerId` 参数化 | `src/api/knowledge.ts` |
| 09-4 | useFileProcessing | 文件处理状态跟踪 Composable：轮询+状态流转+自动停止 | `src/composables/useFileProcessing.ts` |
| 09-5 | DirectoryTree 组件 | 目录树：展开/折叠、创建/重命名/删除目录、右键菜单、「所有文件」和「未分类」固定节点 | `src/components/DirectoryTree/index.vue` |
| 09-6 | FileUploader 组件 | 多文件上传：拖拽上传、格式/大小校验、上传进度条、可选分类目录 | `src/components/FileUploader/index.vue` |
| 09-7 | FileTable 组件 | 文件列表表格：配置化列（名称+格式图标/大小/知识卡数/状态Badge/操作），状态列含进度条；数据源含 `parsed_file_url` 等 API 字段 | `src/components/FileTable/index.vue` |
| 09-8 | FilePreview 组件 | 文件预览页：布局见 3.5；左侧按类型渲染（PDF 双模式；pdf/docx/xlsx 用 vue-office，md 用 marked，txt/json/jsonl/csv 自实现），右侧知识卡列表；复用 PageHead、a-tabs、a-card、a-tag | `src/components/FilePreview/index.vue` |
| 09-9 | PdfViewer 子组件 | 基于 @vue-office/pdf 的 PDF 渲染 | `src/components/FilePreview/PdfViewer.vue` |
| 09-10 | DocxViewer 子组件 | 基于 @vue-office/docx 的 Word 渲染 | `src/components/FilePreview/DocxViewer.vue` |
| 09-11 | ExcelViewer 子组件 | 基于 @vue-office/excel 的 Excel 渲染 | `src/components/FilePreview/ExcelViewer.vue` |
| 09-12 | ParsedDocViewer 子组件 | 解析后文档渲染（`parsed_file_url` 返回的 md 内容→HTML，使用 marked），仅 PDF 类型使用 | `src/components/FilePreview/ParsedDocViewer.vue` |
| 09-13 | TextFileViewer 子组件 | txt/json/jsonl/csv 预览，fetch 后原样展示；md 使用 marked 渲染 | `src/components/FilePreview/TextFileViewer.vue` |
| 09-14 | 知识库 Mock Handler | 模拟目录/文件 CRUD + 文件状态轮询 + 上传响应 | `src/mocks/handlers/knowledge.ts` |
| 09-15 | 知识库 Mock 数据 | 目录树 + 不同状态的文件列表 | `src/mocks/data/knowledge.ts` |

### 3.2 组件复用架构

```
页面层（薄壳）               共享组件层                API 层
/my/files    ─┐
/dept/files  ─┤→ DirectoryTree     ─┐
/org/files   ─┘  FileUploader      ─┤→ knowledge.ts(ownerType, ownerId)
                  FileTable         ─┤
                  FilePreview       ─┘
                  useFileProcessing
                  useWorkspaceContext
```

### 3.3 文件状态流转与 Badge

```
uploading → parsing → extracting → indexing → done
    ↓          ↓          ↓           ↓
  failed     failed     failed      failed

状态 Badge 颜色：
  uploading / parsing / extracting / indexing → blue（处理中）
  done → green（完成）
  failed → red（失败，可重试）
```

### 3.4 FileUploader 约束

| 约束项 | 值 |
|--------|-----|
| 支持格式 | `.pdf`, `.txt`, `.csv`, `.json`, `.jsonl`, `.md`, `.xlsx`, `.docx` |
| 单文件大小 | ≤ 50MB |
| 上传方式 | 拖拽 + 点击选择 |
| 并发上传 | 支持多文件同时上传最多20 |
| 进度展示 | 每个文件独立进度条 |

### 3.5 FilePreview 布局与内容展示（参考初步设计图）

> **约束**：布局与内容结构参考设计图，样式与组件复用本项目既有实现（PageHead、a-tabs、a-card、a-tag、app-container 等）。

#### 整体布局

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 顶部导航栏（返回 | 文档信息 | 状态/操作）                                  │
├───────────────────────────────────────┬─────────────────────────────────┤
│ 左侧主内容区（约 2/3 宽）               │ 右侧边栏（约 1/3 宽）              │
│ 文件内容预览                           │ 抽取知识卡 (N)                    │
│ [解析视图] [原文视图] ← 仅 PDF 显示      │ 卡片列表                          │
│ 内容渲染区                             │                                  │
└───────────────────────────────────────┴─────────────────────────────────┘
```

#### 顶部导航栏

| 区域 | 内容 | 复用组件 |
|------|------|----------|
| 左侧 | 返回按钮 + 文档图标 + 文件名 + 副标题（工作区名 · 日期） | `PageHead`（backLeft、title） |
| 右侧 | 状态 Badge（已解析等）+ 原文件下载按钮 | `PageHead.btns`、`a-tag` |

#### 左侧主内容区

| 区域 | 内容 | 复用组件 |
|------|------|----------|
| 标题 | 「文件内容预览」 | 项目内文案 |
| 视图切换 | 「解析视图」「原文视图」两个 Tab（仅 PDF 时显示；非 PDF 不显示） | `a-tabs` 或 `PageHead.tabsOptions` |
| 内容区 | 原文：PdfViewer/DocxViewer/ExcelViewer（vue-office）、TextFileViewer（marked + 自实现）；解析后：ParsedDocViewer（marked） | 自定义子组件 |

#### 右侧边栏（知识卡）

| 区域 | 内容 | 复用组件 |
|------|------|----------|
| 标题 | 「抽取知识卡 (N)」，N 为卡片数量 | 文案 |
| 卡片列表 | 每张卡片：类型标签（循证卡/规则卡/经验卡）+ 标题/摘要 + 标签（#诊断 #标准）+ 来源文件名 | `a-card`、`a-tag` |

知识卡数据：`GET /api/v1/knowledge/{owner_type}/{owner_id}/files/{id}/cards`，返回 `{ id, type, title, tags, online_status, confidence }`；`type` 映射：`evidence`→循证卡、`rule`→规则卡、`experience`→经验卡。卡片主文案以 `title` 展示；来源为当前预览文件名。

---

## 四、验收效果

- [ ] `useWorkspaceContext` provide/inject 正常工作
- [ ] 知识库 API 通过 `ownerType`/`ownerId` 参数化，同一方法可用于个人/科室/机构
- [ ] DirectoryTree 展示目录结构，支持创建/重命名/删除目录
- [ ] DirectoryTree 含「所有文件」和「未分类」两个固定入口节点
- [ ] FileUploader 拖拽上传可用，格式不合格或超过 50MB 有提示
- [ ] 上传进度条正确展示
- [ ] FileTable 列配置化渲染，状态 Badge 颜色正确
- [ ] 文件上传后 `useFileProcessing` 自动轮询状态，完成或失败后停止
- [ ] 失败状态的文件可点击"重试"
- [ ] FilePreview PDF 原文可正常渲染
- [ ] FilePreview PDF 双模式（原文/解析后文档）切换正常，解析后内容来自 `parsed_file_url`
- [ ] FilePreview 非 PDF 类型仅预览原文件，pdf/docx/xlsx 用 vue-office，md 用 marked，txt/json/jsonl/csv 自实现
- [ ] FilePreview 右侧显示该文件关联的知识卡列表
- [ ] FilePreview 布局符合 3.5 规范：顶部导航（返回+文档信息+状态+下载）、左主右栏、解析/原文 Tab 仅 PDF 显示
- [ ] FilePreview 复用 PageHead、a-tabs、a-card、a-tag 等本项目既有组件
- [ ] 知识库 API 类型定义与文件列表响应（含 `parsed_file_url`、分页 `total/page/page_size`）一致
