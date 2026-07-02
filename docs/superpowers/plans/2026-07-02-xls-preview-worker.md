# XLS Excel 预览 Worker 兼容实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 前端支持后端直接返回的 `.xls` 在线预览，并兼容“接口或文件名是 `.xlsx`，实际二进制是 OLE `.xls`”的错标文件；转换放到 Web Worker，超过 10MB 或转换超过 8 秒时提示下载查看。

**Architecture:** 在现有 `ExcelViewer.vue` 前增加轻量准备层 `ExcelPreviewLoader.vue`。准备层负责拉取文件、判断 Excel 二进制类型、决定是否走旧版 `.xls` 兼容转换、管理 Worker 超时和降级 UI；`ExcelViewer.vue` 继续只负责渲染 `@vue-office/excel`、缩放和尺寸恢复。`.xls` 转 `.xlsx` 的 SheetJS 逻辑放入独立 Worker，避免阻塞主线程。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript、Vite module worker、Ant Design Vue、`@vue-office/excel`、`xlsx`、Vitest、Chrome 验收。

**Limits:** `.xls` 前端转换与 `@vue-office/excel` 的兼容模式本质一致，会增加解析耗时，也可能让复杂样式、合并单元格、公式结果或宏等能力有损。本方案只保证可预览路径和失败降级，不承诺 Excel 桌面端 100% 还原。

---

## 当前证据

- 问题文件 URL 后缀和接口 `file_type` 是 `xlsx`，文件头实际是 `D0 CF 11 E0 A1 B1 1A E1`，属于 OLE/BIFF 旧版 `.xls`。
- 当前 `src/components/FilePreview/ExcelViewer.vue` 只把 `fileUrl` 直接交给 `@vue-office/excel`，没有托管 `.xls` 转换。
- 当前 `src/components/FilePreview/index.vue` 只在 `currentFile?.file_type === 'xlsx'` 时进入 Excel 预览。
- 当前 `src/components/UniversalFilePreview/index.vue` 和 `src/utils/fileType.ts` 只识别 `xlsx`，不识别 `xls`。
- 当前 `src/utils/documentUploadAccept.ts` 的知识库和聊天附件 accept 均未包含 `.xls` / `application/vnd.ms-excel`。
- 当前项目没有直接依赖 `xlsx`，只有 `@vue-office/excel`；Worker 转换不应依赖 vue-office 的内部打包实现，需显式新增 `xlsx` 依赖。

## 用户可见状态

| 状态 | 触发条件 | 展示 |
| --- | --- | --- |
| 正常预览 | 标准 `.xlsx`，或 `.xls` 转换成功 | 保持现有 Excel 预览、缩放和工作表标签 |
| 正在准备/转换 | 正在下载二进制、检测头部或 Worker 转换中 | 居中 loading，文案“正在准备 Excel 预览...”或“正在转换旧版 Excel 文件...” |
| 文件过大/超时 | `.xls` 超过 10MB，或 Worker 超过 8 秒 | 提示“旧版 Excel 在线预览存在兼容和性能限制。当前文件较大或转换耗时过长，建议下载后使用本机 Excel 查看。”并提供下载按钮 |
| 转换失败 | Worker 抛错、二进制损坏、fetch 失败 | 提示“旧版 Excel 在线预览可能出现样式、合并单元格或公式显示差异。当前文件转换失败，请下载后使用本机 Excel 查看。”并提供下载按钮 |

## 文件结构

Create:

- `src/components/FilePreview/excelFileKind.ts`
- `src/components/FilePreview/xlsConvertClient.ts`
- `src/components/FilePreview/xlsConvert.worker.ts`
- `src/components/FilePreview/ExcelPreviewLoader.vue`
- `tests/unit/excelFileKind.test.ts`
- `tests/unit/xlsConvertClient.test.ts`
- `tests/unit/excelPreviewLoaderStatic.test.ts`

Modify:

- `package.json`
- `pnpm-lock.yaml`
- `src/components/FilePreview/index.vue`
- `src/components/UniversalFilePreview/index.vue`
- `src/components/ChatWindow/MessageInput.vue`
- `src/utils/fileType.ts`
- `src/utils/documentUploadAccept.ts`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en-US.ts`
- `tests/unit/excelViewerResize.test.ts`
- `tests/unit/filePreviewTabs.test.ts`
- `tests/unit/i18nStaticContracts.test.ts`
- `docs/documentation-task-board.md`

## Task 1: Excel 类型检测工具和单测

**Files:**

- Create: `src/components/FilePreview/excelFileKind.ts`
- Create: `tests/unit/excelFileKind.test.ts`

- [ ] **Step 1: 先写失败单测**

新增 `tests/unit/excelFileKind.test.ts`，覆盖：

- `D0 CF 11 E0 A1 B1 1A E1` 返回 `xls`。
- `50 4B 03 04` 返回 `xlsx`。
- 空数组或未知头返回 `unknown`。
- `fileType === 'xls'` 必须走兼容转换。
- `fileType === 'xlsx'` 且二进制为 `xls` 时必须走兼容转换。
- `fileType === 'xlsx'` 且二进制为 `xlsx` 时不走兼容转换。
- 10MB 阈值：`10 * 1024 * 1024` 可转换，超过 1 byte 直接降级。

运行：

```bash
pnpm exec vitest run tests/unit/excelFileKind.test.ts
```

Expected: 失败，因为工具文件尚不存在。

- [ ] **Step 2: 实现检测工具**

在 `src/components/FilePreview/excelFileKind.ts` 中导出：

- `OLE_XLS_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]`
- `ZIP_XLSX_SIGNATURE = [0x50, 0x4b]`
- `LEGACY_XLS_MAX_PREVIEW_BYTES = 10 * 1024 * 1024`
- `LEGACY_XLS_CONVERT_TIMEOUT_MS = 8000`
- `type ExcelBinaryKind = 'xls' | 'xlsx' | 'unknown'`
- `detectExcelBinaryKind(input: ArrayBuffer | Uint8Array): ExcelBinaryKind`
- `shouldUseLegacyXlsConversion(fileType: string | null | undefined, kind: ExcelBinaryKind): boolean`
- `isLegacyXlsTooLarge(byteLength: number): boolean`
- `getExcelExtension(fileType: string | null | undefined): string`

Implementation notes:

- `detectExcelBinaryKind` 只检查头部，不解析全文件。
- `shouldUseLegacyXlsConversion` 的规则是：`fileType` 归一化为 `xls` 时走转换；`fileType` 为 `xlsx` 但 `kind === 'xls'` 时走转换。
- 如果 `fileType` 是 `xls` 但头部实际是 ZIP `.xlsx`，不转换，直接按 `.xlsx` 渲染。

- [ ] **Step 3: 跑单测确认通过**

```bash
pnpm exec vitest run tests/unit/excelFileKind.test.ts
```

## Task 2: 新增 `xlsx` 依赖、Worker 和超时客户端

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `src/components/FilePreview/xlsConvert.worker.ts`
- Create: `src/components/FilePreview/xlsConvertClient.ts`
- Create: `tests/unit/xlsConvertClient.test.ts`

- [ ] **Step 1: 安装显式依赖**

```bash
pnpm add xlsx
```

Expected: `package.json` 和 `pnpm-lock.yaml` 新增 `xlsx`。

- [ ] **Step 2: 先写 Worker 客户端单测**

新增 `tests/unit/xlsConvertClient.test.ts`，用 fake `Worker` 覆盖：

- 成功消息时 resolve 转换后的 `ArrayBuffer`。
- 超过 `LEGACY_XLS_CONVERT_TIMEOUT_MS` 时 reject，并调用 `worker.terminate()`。
- Worker 返回失败消息时 reject，并调用 `worker.terminate()`。
- `worker.onerror` 时 reject，并调用 `worker.terminate()`。

运行：

```bash
pnpm exec vitest run tests/unit/xlsConvertClient.test.ts
```

Expected: 失败，因为客户端尚不存在。

- [ ] **Step 3: 实现 Worker 客户端**

`src/components/FilePreview/xlsConvertClient.ts` 负责主线程生命周期：

- 导出 `type XlsConvertFailureReason = 'timeout' | 'convert-error' | 'worker-error'`。
- 导出 `class XlsConvertError extends Error`，携带 `reason`。
- 导出 `convertLegacyXlsInWorker(buffer: ArrayBuffer, timeoutMs = LEGACY_XLS_CONVERT_TIMEOUT_MS): Promise<ArrayBuffer>`。
- 用 `new Worker(new URL('./xlsConvert.worker.ts', import.meta.url), { type: 'module' })`。
- 每次请求生成 `id`，只处理同一个 `id` 的返回。
- `postMessage({ id, buffer }, [buffer])` 使用 Transferable。
- 成功、失败、超时和 `onerror` 都必须清理 timer 并 terminate。

- [ ] **Step 4: 实现 Worker 转换**

`src/components/FilePreview/xlsConvert.worker.ts` 只做纯转换：

- `import * as XLSX from 'xlsx'`。
- `XLSX.read(buffer, { type: 'array', cellStyles: true })` 读取。
- `XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })` 输出 `.xlsx`。
- 成功时 `postMessage({ id, ok: true, buffer }, [buffer])`。
- 失败时 `postMessage({ id, ok: false })`。
- 不在 Worker 内操作 DOM、Vue、i18n 或 Ant Design。
- 不把底层错误文本传给用户界面。
- `cellStyles: true` 只是尽量保留样式，不保证复杂样式完整。

- [ ] **Step 5: 跑 Worker 客户端单测**

```bash
pnpm exec vitest run tests/unit/xlsConvertClient.test.ts
```

## Task 3: Excel 预览准备层

**Files:**

- Create: `src/components/FilePreview/ExcelPreviewLoader.vue`
- Create: `tests/unit/excelPreviewLoaderStatic.test.ts`

- [ ] **Step 1: 先写静态契约单测**

新增 `tests/unit/excelPreviewLoaderStatic.test.ts`，读取源码并断言：

- `ExcelPreviewLoader.vue` 使用 `detectExcelBinaryKind`。
- `ExcelPreviewLoader.vue` 使用 `convertLegacyXlsInWorker`。
- `ExcelPreviewLoader.vue` 使用 `LEGACY_XLS_MAX_PREVIEW_BYTES`。
- `ExcelPreviewLoader.vue` 渲染 `ExcelViewer`。
- `ExcelPreviewLoader.vue` 调用 `triggerFileDownload`。
- 文案使用 `knowledge.previewExcelPreparing`、`knowledge.previewExcelConverting`、`knowledge.previewExcelLegacyLargeOrTimeout`、`knowledge.previewExcelLegacyFailed`。

运行：

```bash
pnpm exec vitest run tests/unit/excelPreviewLoaderStatic.test.ts
```

Expected: 失败，因为组件尚不存在。

- [ ] **Step 2: 实现 `ExcelPreviewLoader.vue` props 和状态**

组件 props：

- `fileUrl: string`
- `fileType?: string`
- `fileName?: string`
- `viewportSize?: { width: number; height: number }`

组件事件：

- `rendered`
- `error`

状态建议：

- `preparing`
- `converting`
- `ready`
- `large-or-timeout`
- `failed`

- [ ] **Step 3: 实现准备流程**

流程：

1. `fetch(fileUrl)` 读取 `ArrayBuffer`。
2. 用 `detectExcelBinaryKind(arrayBuffer)` 判断 `xls` / `xlsx` / `unknown`。
3. 如果不需要兼容转换，创建 `.xlsx` Blob URL 交给 `ExcelViewer`，避免重复下载。
4. 如果需要转换且 `byteLength > LEGACY_XLS_MAX_PREVIEW_BYTES`，进入 `large-or-timeout`。
5. 如果需要转换且大小允许，进入 `converting`，调用 `convertLegacyXlsInWorker(arrayBuffer)`。
6. Worker 成功后创建 `.xlsx` Blob URL 交给 `ExcelViewer`。
7. Worker 超时进入 `large-or-timeout`。
8. Worker 失败或 fetch 失败进入 `failed`。

Cleanup:

- 每次 `fileUrl` 变化前 revoke 上一个 Blob URL。
- `onBeforeUnmount` revoke 当前 Blob URL。
- 避免异步竞态：使用递增 `requestVersion` 或 `AbortController`，过期请求不更新状态。

- [ ] **Step 4: 实现降级 UI**

UI 要求：

- `preparing`：居中 `a-spin`，显示 `t('knowledge.previewExcelPreparing')`。
- `converting`：居中 `a-spin`，显示 `t('knowledge.previewExcelConverting')` 和兼容提示。
- `large-or-timeout`：居中 `a-result` 或 `a-empty`，文案使用 `knowledge.previewExcelLegacyLargeOrTimeout`，按钮使用 `knowledge.downloadFile`。
- `failed`：居中 `a-result` 或 `a-empty`，文案使用 `knowledge.previewExcelLegacyFailed`，按钮使用 `knowledge.downloadFile`。
- `ready`：渲染 `ExcelViewer`，透传 `viewportSize`、`rendered`、`error`。

Style notes:

- 外层必须保持 `h-full min-h-0`，避免破坏现有 Excel 尺寸测量。
- 不新增页面级 card；降级提示在现有预览边框内容区中居中展示。

- [ ] **Step 5: 跑准备层静态单测**

```bash
pnpm exec vitest run tests/unit/excelPreviewLoaderStatic.test.ts
```

## Task 4: 接入知识库文件预览、通用预览和聊天附件预览

**Files:**

- Modify: `src/components/FilePreview/index.vue`
- Modify: `src/components/UniversalFilePreview/index.vue`
- Modify: `src/components/ChatWindow/MessageInput.vue`
- Modify: `src/utils/fileType.ts`
- Modify: `src/utils/documentUploadAccept.ts`
- Modify: `tests/unit/excelViewerResize.test.ts`
- Modify: `tests/unit/filePreviewTabs.test.ts`

- [ ] **Step 1: 文件类型和 accept 支持 `.xls`**

`src/utils/fileType.ts`:

- 保持 `FileCategory` 的 Excel 分类为现有 `'xlsx'`，减少下游改动。
- 在 `EXT_MAP` 增加 `xls: 'xlsx'`。
- 通用预览通过 `extractExtension(displayName.value) || extractExtension(props.fileUrl)` 取得真实 `fileType` 传给准备层。

`src/utils/documentUploadAccept.ts`:

- `KNOWLEDGE_DOCUMENT_EXTENSIONS` 增加 `.xls`。
- `CHAT_DOCUMENT_EXT_SET` 增加 `.xls`。
- `CHAT_DOCUMENT_MIME_SET` 增加 `application/vnd.ms-excel`。
- `CHAT_ATTACHMENT_ACCEPT` 增加 `.xls` 和 `application/vnd.ms-excel`。

- [ ] **Step 2: 知识库文件预览接入 Loader**

`src/components/FilePreview/index.vue`:

- `import ExcelPreviewLoader from './ExcelPreviewLoader.vue'`。
- 将原 `ExcelViewer` 分支替换为 `ExcelPreviewLoader`。
- 条件改为 `['xls', 'xlsx'].includes(currentFile?.file_type?.toLowerCase() ?? '') && originalFileUrl`。
- 传入 `file-url`、`file-type`、`file-name`。
- 删除不再使用的 `ExcelViewer` import。

- [ ] **Step 3: 通用预览接入 Loader**

`src/components/UniversalFilePreview/index.vue`:

- `import ExcelPreviewLoader from '@/components/FilePreview/ExcelPreviewLoader.vue'`。
- 将原 `ExcelViewer` 分支替换为 `ExcelPreviewLoader`。
- 增加 `excelFileType` computed。
- 对 `category === 'xlsx'` 渲染 Loader，透传 `fileUrl`、`excelFileType`、`displayName`、`previewBodySize`。
- 保留 `@rendered="onOfficeReady"` 和 `@error="onOfficeReady"`，避免外层 loading 不消失。

- [ ] **Step 4: 聊天附件预览接入 Loader**

`src/components/ChatWindow/MessageInput.vue`:

- 将异步组件 `ExcelViewer` 替换为 `ExcelPreviewLoader`。
- `PendingPreviewKind` 扩展为 `'xls' | 'xlsx'`。
- `resolvePendingPreviewKind` 对 `.xls` 或 `application/vnd.ms-excel` 返回 `'xls'`。
- Modal 内 Excel 分支改为同时支持 `previewKind === 'xlsx' || previewKind === 'xls'`。
- 传入 `file-url`、`file-type`、`file-name`。

- [ ] **Step 5: 更新静态契约单测**

`tests/unit/filePreviewTabs.test.ts` 增加：

- `FilePreview/index.vue` 包含 `ExcelPreviewLoader`。
- 文件类型判断包含 `'xls'` 和 `'xlsx'`。

`tests/unit/excelViewerResize.test.ts`：

- 通用预览断言从 `ExcelViewer` 调整为 `ExcelPreviewLoader`。
- 继续断言 `:viewport-size="previewBodySize"` 没有丢失。

运行：

```bash
pnpm exec vitest run tests/unit/filePreviewTabs.test.ts tests/unit/excelViewerResize.test.ts
```

## Task 5: i18n 文案和文档看板

**Files:**

- Modify: `src/i18n/locales/zh-CN.ts`
- Modify: `src/i18n/locales/en-US.ts`
- Modify: `tests/unit/i18nStaticContracts.test.ts`
- Modify: `docs/documentation-task-board.md`

- [ ] **Step 1: 增加中英文文案**

`zh-CN.ts` 的 `knowledge` 下新增：

- `previewExcelPreparing: '正在准备 Excel 预览...'`
- `previewExcelConverting: '正在转换旧版 Excel 文件...'`
- `previewExcelLegacyRisk: '旧版 Excel 在线预览可能出现样式、合并单元格或公式显示差异。'`
- `previewExcelLegacyLargeOrTimeout: '旧版 Excel 在线预览存在兼容和性能限制。当前文件较大或转换耗时过长，建议下载后使用本机 Excel 查看。'`
- `previewExcelLegacyFailed: '旧版 Excel 在线预览可能出现样式、合并单元格或公式显示差异。当前文件转换失败，请下载后使用本机 Excel 查看。'`

`en-US.ts` 的 `knowledge` 下新增对应英文文案。

- [ ] **Step 2: 更新 i18n 静态契约**

`tests/unit/i18nStaticContracts.test.ts` 的 `requiredKeys` 增加上述 5 个 key。

运行：

```bash
pnpm exec vitest run tests/unit/i18nStaticContracts.test.ts
```

- [ ] **Step 3: 更新文档任务看板**

`docs/documentation-task-board.md` 的“近期同步记录”新增一条，说明：

- 制定或落地 `.xls` Excel 前端 Worker 兼容预览方案。
- 明确 10MB / 8 秒降级阈值。
- 说明复杂样式、合并单元格和公式显示可能有损，失败时提示下载。

## Task 6: 集成验证

**Files:**

- All changed frontend files.

- [ ] **Step 1: 跑相关单测**

```bash
pnpm exec vitest run \
  tests/unit/excelFileKind.test.ts \
  tests/unit/xlsConvertClient.test.ts \
  tests/unit/excelPreviewLoaderStatic.test.ts \
  tests/unit/excelPreviewScale.test.ts \
  tests/unit/excelViewerResize.test.ts \
  tests/unit/filePreviewTabs.test.ts \
  tests/unit/i18nStaticContracts.test.ts
```

Expected: 全部通过。

- [ ] **Step 2: 跑前端完整验证**

```bash
pnpm verify
```

Expected: `pnpm check:theme && pnpm check:docs && pnpm build` 全部通过。

- [ ] **Step 3: Chrome 手工验收**

服务已启动在 `http://localhost:3000/` 时，用 Chrome 验收：

1. 使用测试账号登录。
2. 打开原问题文件 `20220101-20250903刘院门诊病历 2.xlsx`。
3. 确认不再显示空白表格或 vue-office “未获取到数据”错误。
4. 确认准备/转换期间 UI 不冻结。
5. 打开标准 `.xlsx`，确认仍直接正常预览，缩放 100% / 125% / 150% 保持可用。
6. 打开 `.xls` 或错标 `.xlsx` 大文件，确认超过 10MB 时展示下载提示。
7. 人为把 Worker timeout 调小到 1ms 做临时本地验证，确认超时提示出现；验证后恢复 8000ms，不提交临时代码。

- [ ] **Step 4: 自审边界**

确认没有做这些事：

- 没有后端转换逻辑。
- 没有扩大到 `.doc` 或 `.ppt` 旧格式预览。
- 没有提交测试账号、Token、真实个人 IP 或 `.env.*.local`。
- 没有把 vue-office 内部依赖路径作为业务 import。

## Task 7: 提交

**Files:**

- All changed frontend files.

- [ ] **Step 1: 检查远端连通性**

```bash
git remote -v
git ls-remote --exit-code origin HEAD
```

Expected: 远端可连接。如果失败，停止提交和 push，并汇报原因。

- [ ] **Step 2: 查看工作区**

```bash
git status --short
```

确认只包含本计划范围内的文件。

- [ ] **Step 3: 提交并按项目规则 push**

```bash
git add package.json pnpm-lock.yaml \
  src/components/FilePreview/excelFileKind.ts \
  src/components/FilePreview/xlsConvertClient.ts \
  src/components/FilePreview/xlsConvert.worker.ts \
  src/components/FilePreview/ExcelPreviewLoader.vue \
  src/components/FilePreview/index.vue \
  src/components/UniversalFilePreview/index.vue \
  src/components/ChatWindow/MessageInput.vue \
  src/utils/fileType.ts \
  src/utils/documentUploadAccept.ts \
  src/i18n/locales/zh-CN.ts \
  src/i18n/locales/en-US.ts \
  tests/unit/excelFileKind.test.ts \
  tests/unit/xlsConvertClient.test.ts \
  tests/unit/excelPreviewLoaderStatic.test.ts \
  tests/unit/excelViewerResize.test.ts \
  tests/unit/filePreviewTabs.test.ts \
  tests/unit/i18nStaticContracts.test.ts \
  docs/superpowers/plans/2026-07-02-xls-preview-worker.md \
  docs/documentation-task-board.md

git commit -m "feat(file-preview): 支持 xls worker 兼容预览" -m "- 新增 Excel 文件头检测和 xls Worker 转换" -m "- 支持 xls 与错标 xlsx 文件预览" -m "- 增加 10MB/8 秒降级下载提示"
git push
```

Expected: 提交和 push 成功。

---

## 验收标准

- `.xls` 文件能进入 Excel 预览准备层，不再被识别为不支持预览。
- 错标为 `.xlsx` 但文件头为 OLE `.xls` 的文件能走 Worker 转换后预览。
- 标准 `.xlsx` 不走旧版转换，现有缩放和 ResizeObserver 恢复能力不回退。
- `.xls` 超过 10MB 或转换超过 8 秒时，页面不阻塞，显示下载提示。
- 转换失败时显示下载提示，不把底层错误直接暴露给用户。
- 知识库文件预览、通用文件预览、聊天待发送附件预览三处 Excel 入口行为一致。
- `pnpm verify` 通过。
