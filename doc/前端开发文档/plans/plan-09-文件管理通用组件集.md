# Plan 09: 文件管理通用组件集

> 来源阶段：Phase 3（任务 3.1~3.6）  
> 前置依赖：Plan 04（主布局与权限体系）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计.md` | KnowledgeBase 域 → 目录/文件 CRUD 接口 |
| 产品规划 | `doc/初始文档/产品规划.md` | 知识处理流水线（上传→解析→抽取→索引→完成） |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 文件管理页布局、目录树、上传区、文件预览 |
| 技术设计 | `doc/初始文档/技术设计.md` | 3.1 知识库数据表结构 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | Phase 3 任务 3.1~3.6、四.1 复用分析矩阵 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 五.1~五.3 工作台上下文/知识库 API/文件处理 |

### 关键设计要点

- 所有文件管理组件通过 `ownerType` + `ownerId` 参数化，个人/科室/机构三处复用
- 使用 `provide/inject` 注入 workspace context，避免深层 Props 传递
- 文件处理状态跟踪使用轮询（5秒间隔）
- 支持文件格式：PDF/TXT/CSV/JSON/MD/XLSX/DOCX，大小限制 50MB
- PDF 预览使用 `pdfjs-dist`（此计划需安装该依赖）
- 本计划产出 6 个通用组件 + 1 个 Composable + 1 套 API

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
| 09-1 | 安装 pdfjs-dist | `pnpm add pdfjs-dist` | `package.json` |
| 09-2 | useWorkspaceContext | provide/inject Composable：注入 ownerType + ownerId，子组件自动获取 | `src/composables/useWorkspaceContext.ts` |
| 09-3 | 知识库统一 API | 目录 CRUD + 文件 CRUD + 文件状态查询，通过 `ownerType`/`ownerId` 参数化 | `src/api/knowledge.ts` |
| 09-4 | useFileProcessing | 文件处理状态跟踪 Composable：轮询+状态流转+自动停止 | `src/composables/useFileProcessing.ts` |
| 09-5 | DirectoryTree 组件 | 目录树：展开/折叠、创建/重命名/删除目录、右键菜单、「所有文件」和「未分类」固定节点 | `src/components/DirectoryTree/index.vue` |
| 09-6 | FileUploader 组件 | 多文件上传：拖拽上传、格式/大小校验、上传进度条、可选分类目录 | `src/components/FileUploader/index.vue` |
| 09-7 | FileTable 组件 | 文件列表表格：配置化列（名称+格式图标/大小/知识卡数/状态Badge/操作），状态列含进度条 | `src/components/FileTable/index.vue` |
| 09-8 | FilePreview 组件 | 文件预览页：左侧双模式切换（PDF原文/解析后文档），右侧知识卡列表 | `src/components/FilePreview/index.vue` |
| 09-9 | PdfViewer 子组件 | 基于 pdfjs-dist 的 PDF 渲染组件 | `src/components/FilePreview/PdfViewer.vue` |
| 09-10 | ParsedDocViewer 子组件 | 解析后文档渲染（Markdown→HTML） | `src/components/FilePreview/ParsedDocViewer.vue` |
| 09-11 | 知识库 Mock Handler | 模拟目录/文件 CRUD + 文件状态轮询 + 上传响应 | `src/mocks/handlers/knowledge.ts` |
| 09-12 | 知识库 Mock 数据 | 目录树 + 不同状态的文件列表 | `src/mocks/data/knowledge.ts` |

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
| 支持格式 | `.pdf`, `.txt`, `.csv`, `.json`, `.md`, `.xlsx`, `.docx` |
| 单文件大小 | ≤ 50MB |
| 上传方式 | 拖拽 + 点击选择 |
| 并发上传 | 支持多文件同时上传最多20 |
| 进度展示 | 每个文件独立进度条 |

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
- [ ] FilePreview 解析文档 Markdown 可正常渲染
- [ ] FilePreview 右侧显示该文件关联的知识卡列表
