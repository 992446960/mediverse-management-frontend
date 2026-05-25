# 文档任务看板

本文档记录项目文档资产、事实来源和新鲜度状态。任何代码、接口、配置、Docker 或需求变更，都必须更新对应条目。

## 文档资产

| 文档                                                                      | 事实来源                                                          | 状态   | 维护要求                                        |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------ | ----------------------------------------------- |
| `README.md`                                                               | `package.json`、`vite.config.ts`、`README.Docker.md`、`docs/`     | 已补全 | 项目定位、命令和文档索引变化时更新              |
| `AGENTS.md`                                                               | `project-init`、当前仓库结构、验证命令                            | 已补全 | Agent 操作边界、命令或文档索引变化时更新        |
| `CLAUDE.md`                                                               | `project-init`、项目红线规则                                      | 已补全 | 核心红线变化时更新，保持 20 行以内              |
| `docs/development-guide.md`                                               | `wang-convention`、`src/`、`tests/`                               | 已补全 | 编码规范、架构约束或模块边界变化时更新          |
| `docs/frontend-development.md`                                            | `package.json`、`.env.*`、`vite.config.ts`、Docker 配置           | 已补全 | 启动、联调、验证、环境变量变化时更新            |
| `README.Docker.md`                                                        | `Dockerfile`、`compose.yaml`、`nginx.conf`、`scripts/docker-*.sh` | 已补全 | Docker 打包、部署、变量、回滚流程变化时更新     |
| `docs/API设计.docx`                                                       | Management、Ecosys、KnowledgeBase API 详细设计                    | 已存在 | 接口设计、字段约定或错误码变化时更新            |
| `docs/API设计.md`                                                         | `docs/API设计.docx` 的 Markdown 副本                              | 已存在 | 自 docx 导出或随 docx 同步更新，便于检索与 diff |
| `docs/markdown-test-sample.md`                                            | Markdown 预览、解析和样式测试文本                                 | 已新增 | Markdown 渲染测试场景变化时更新                 |
| `docs/requirements/shanghai-first-hospital-customization-requirements.md` | 定制需求和 `docs/requirements/assets/`                            | 已存在 | 需求范围、素材或验收标准变化时更新              |
| `tests/api-contract/API_CONTRACT_TEST_REPORT.md`                          | `tests/api-contract/`、真实 API 测试结果                          | 已存在 | API 合规测试覆盖或结果变化时更新                |
| `docs/superpowers/plans/2026-05-20-python-mock-backend-openapi.md`        | 线上 Swagger、Python mock 后端实现计划                            | 已新增 | mock 后端接口范围、路径或验证命令变化时更新     |

## 检查任务

| 任务                 | 命令                                                                             | 状态                                  |
| -------------------- | -------------------------------------------------------------------------------- | ------------------------------------- |
| 文档新鲜度检查       | `pnpm check:docs`                                                                | 必须通过                              |
| 聚合验证             | `pnpm verify`                                                                    | 代码或配置变更时必须通过              |
| Docker Compose 校验  | `docker compose config`                                                          | Docker 相关变更时必须通过             |
| API 合规测试         | `pnpm test:api`                                                                  | 具备 `.env.api-test` 和网络条件时运行 |
| Python mock 合同测试 | `API_TEST_USE_MOCK=true API_BASE_URL=http://127.0.0.1:8005/api/v1 pnpm test:api` | mock 后端运行时执行                   |

## 近期同步记录

- 知识卡召回测试页新增召回历史弹窗：列表对接 §4.4.1，选中记录后调用 §4.4.2 并通过统一 ViewModel 回填现有召回测试结果区；点击召回知识卡详情直接使用 `retrieved_sources[].md_content/json_content`。
- 按飞书 Wiki「API设计」最新评论 `7643737490725161956` 仅对比 §4.4.2 召回记录详情查询，补齐 `retrieved_sources[]` 中的 `json_content` / `md_content` 返回字段。
- 按飞书 Wiki「API设计」评论 `7642609880704240604` 同步 `docs/API设计.md`：§4.1.9 创建知识卡 Request 补 `json_content` 非必填说明，§4.1.9/§4.1.10 Response 将 `online_status` 标注为任务状态占位并注明 `creating` / `updating` 含义。
- `DirectoryTree` 支持通过配置开启拖拽调整宽度与一键收起，文件管理页启用该能力；默认进入页面仍展示目录筛选条件，收起态保留明显的「目录」展开入口。
- `PageTree` 支持通过配置开启拖拽调整宽度与一键收起，科室管理和用户管理页启用该能力，收起态保留明显展开入口。
- `PageTable` 列配置弹窗改名为“列表设置”，并从单一显示勾选改为表格式配置行；每列可配置显示、列宽拖拽和固定位置，selection 列补齐“选择”名称，operation 列默认右固定。
- `PageTable` 横向滚动宽度改为按当前可见列宽求和，不再使用 `max-content`，避免长文件名内容撑开列宽导致文件名列无法缩小。
- 科室/机构文件管理表格取消文件名列左侧固定，并为文件名列开启拖拽调整宽度。
- `PageTable` 滚动配置改为始终保留横向 `scroll.x`，仅在数据行数可能溢出时启用纵向 `scroll.y`，避免空数据/少数据时出现右侧滚动条占位线。
- 分身详情弹窗和知识卡版本对比加载态改为保留弹窗正文高度并居中展示，补充静态单测覆盖 modal loading 布局契约。
- `tsconfig.app.json` 的 `ignoreDeprecations` 调整为当前 TypeScript 5.9 可接受的 `"5.0"`，避免 `vue-tsc -b` 因 TS5103 中断。
- `PageTable` 自适应滚动高度改为扣除 Ant Design 表头实际高度，保留取消默认 100px 底部预留的行为，同时避免表格内容滚动区压到分页器。
- 知识库首页搜索框增加独立最大宽度与 `min-width: 0` 收口，避免宽屏下输入框跟随推荐内容容器过长或撑出页面。
- 本次知识卡异步写入功能审核整改：`creating` / `updating` 禁用范围补齐到详情版本历史与 diff 回滚入口，并在回滚 handler 增加状态防护；编辑弹窗 Card Type 下拉改为复用本地化枚举文案，避免英文环境继续显示后端中文 `name`；补充知识卡类型 option 文案与回滚可操作性单元测试。
- 知识卡新增/编辑写操作改为异步任务响应：前端不再把 PUT 响应归一化为完整知识卡，并支持新建 `online_status=creating`、编辑 `online_status=updating` 的列表/详情展示；处理中知识卡禁用详情、编辑、上下线、审核、删除等所有操作；知识卡筛选表单的“上线状态”文案改为“状态”；新增/编辑提交成功提示改为等待创建/等待更新；知识卡类型、上线状态、审核状态标签改为按当前语言渲染，卡类型枚举同步为 `rule` / `scale` / `risk_point` / `pathway_clause` / `melody_element` / `disease_overview`；语言切换时同步刷新 `PageHead` tabs 与标签页右键菜单，知识卡类型 tab 不再直出后端中文 `name`；知识卡列表 Title 列支持拖拽调整宽度，Type 列默认宽度加宽；`docs/API设计.md` §4.1.9/§4.1.10/§4.1.15 同步任务响应字段与类型枚举。
- 知识卡回退确认弹窗改为复用现有 `a-modal` 结构，明确拆分 header/content/footer，并保留 warning icon、回退原因输入和确认请求中的按钮 loading。
- 知识卡版本回退规则更新：仅允许从当前版本回退到上一版本，其他历史版本仅支持对比；前端请求体不再发送 `target_version`，`docs/API设计.md` §4.1.14 与 Python mock OpenAPI 快照同步为返回完整知识卡对象。
- `DirectoryTree` 与 `PageTable` 暗色边框改为使用 `dark:border-(--color-border)`，与暗色主题变量保持一致。
- `DirectoryTree` 与 `PageTable` 暗色容器背景改为使用 `--color-bg-container`，避免继续固定到 `slate-900`。
- 文件上传队列改为先计算文件内容 MD5，并以 MD5 作为队列唯一标识；加入队列前按 MD5 去重，避免同一文件重复进入上传队列。
- 知识卡管理新增隐藏的召回测试页入口，调用 `POST /knowledge-recall/{owner_type}/{owner_id}/recall` 并展示最终回答与召回知识卡列表；不实现测试历史。
- 知识卡召回测试页调整为左侧问题、右侧参数布局，标题补充副标题提示；知识卡类型优先读取本地缓存，缺失时调用 `GET /knowledge/card-types`，并补齐“全部/多选”选中边界。
- 知识卡召回测试入口改为前端路由跳转，隐藏菜单但保留 nav-tag，避免点击入口时出现整页加载跳转。
- 知识卡召回测试页头部改为独立 header，修复标题展示；左右布局断点下调，全选按钮支持全选/全不选，Top-K 进度条使用 `#0ea5e9` 页面变量。
- 知识卡召回最终回答按 Markdown 文本安全渲染，并限制回答区域最大高度，长内容在区域内滚动。
- 知识卡召回列表限制最大高度，召回条目过多时在列表区域内滚动展示。
- 知识卡召回列表新增详情弹窗：点击召回条目后加载知识卡详情，弹窗头部展示标题/类型/ID/更新时间，左侧安全渲染 Markdown 正文，右侧展示召回得分和可滚动的关联文件列表。
- 知识卡召回详情弹窗改为直接使用召回接口 `sources` 中的卡片数据，不再额外请求知识卡详情接口；正文渲染 `md_content`，关联文件读取卡片内 `sources`。
- 知识卡召回详情弹窗空态占位改为在正文区和关联文件区内居中展示，避免空内容时占位贴近顶部。
- 知识卡召回测试页补齐入口组件名，使其与路由名匹配并命中顶层 `keep-alive` include；切换标签返回后保留测试问题、召回结果和详情弹窗状态。
- 文件上传队列新增「一键移除」入口，移除类按钮保留默认按钮类型并使用 danger 状态提示。
- 上传请求去重对 `FormData` 追加文件元信息，避免多个文件同路径并发上传被误判为重复提交。
- 文件上传队列支持任意状态本地移除，仅更新弹窗内本地队列，不触发后端删除。
- `PageTable` 自动高度计算默认不再额外扣除 100px 底部预留，表格滚动区与分页器之间不再出现大块空白；如个别页面需要底部预留，可通过 `tableConf.tableMarginBottom` 显式配置。
- 自飞书 Wiki「API设计」（`RjKPwTWUBivbaykfexbcBzaTnvb`）同步 §4.4 智能召回：§4.4.2 更名、§4.4.4 响应示例规范化、§4.4.5/§4.4.6 补 `count` 与字段表、章节顺序调整为 4.4.1–4.4.7；非 Agentic 响应仍无 `answer`（与 Swagger 一致）。
- 知识卡召回测试、知识卡新增、知识卡编辑三个请求单独延长超时时间到 10 分钟，避免长耗时写入/召回提前中断。
- 知识卡详情初次加载态改为弹窗正文区域居中展示，避免空内容容器下 loading 出现在左上角。
- 知识卡上线交互收口：前端仅允许 `audit_status=approved` 的知识卡进入上线确认；待审核/已驳回统一提示“仅审核通过的知识卡可上线”，并移除知识卡 request 失败后的组件二次错误提示，避免同一次失败出现两条 toast。
- 制定 Python mock 后端计划：在前端同级目录新建 FastAPI mock backend，按线上 Swagger 当前 67 个 path / 90 个 operation 做全量覆盖，不引入数据库，并以 API contract 测试作为验收门禁。
- 落地 Python mock 后端联调入口：mock 后端位于工作区同级目录 `../mediverse-management-mock-backend`，默认监听 `127.0.0.1:8005`；API contract 测试支持 `API_TEST_USE_MOCK=true`，并新增 `skills`、`upload`、`knowledge-recall` 覆盖；默认账号为 `dev001-user` / `dev001-dept` / `dev001-org`，密码均为 `123456`。
- 按余洋反馈对照线上 OpenAPI 更新 `docs/API设计.md`：§4.1.11 增 `note` 与 `status_action` 响应；§4.1.17 响应补 `audit_reject_reason`/`review_action`；§4.4.5/4.4.6 重写为 Agentic/非 Agentic 召回（`recall`/`search`）；清除全部历史调整为 §4.4.7。
- `docs/API设计.md` §4.1.14 回滚接口补全 Request（`reason`）与 Response 示例，与 Swagger 一致。
- 按线上 OpenAPI 对 `docs/API设计.md` §四二次 diff：修正目录/搜索路径拼写，补 §4.1.5 `indexing_task_id`、§4.1.22/4.1.23/4.4.6，规范 §4.1.15–20 的 http 与 JSON 示例；§4.1.17/4.1.21 已与 Swagger 一致。
- 执行知识库 API 合同对齐计划：接入非默认目录重命名/删除、文件批量移动、失败索引任务重试、知识库搜索 owner 隔离路径，并同步 MSW mock 后端真实接口路径、请求体和响应字段。
- `docs/API设计.md` §4.1.21 按线上 Swagger 对齐「重试失败的下游索引任务」：路径 `{task_id}`、Path Parameters 表、无 Request body、`FileIndexingRetryOut` 响应示例与字段说明。
- 知识卡与技能执行字段合同对齐：知识卡正文前端统一消费 `md_content`，技能执行 `done.result.citations` 归一化为 `md_content` / `json_content`，mock 不再继续写旧 `content` 字段。
- 新增 `docs/API设计.docx`，作为 Management、Ecosys、KnowledgeBase 域接口详细设计文档，并同步 README 文档索引。
- 由 `docs/API设计.docx` 导出 `docs/API设计.md`（Markdown），便于版本 diff 与 IDE 阅读；后续 docx 变更时需同步更新 md。
- 复查静态 i18n key 使用，知识卡 JSON 复制提示复用 `common.copied`，科室/机构文件页无权限提示复用 `knowledge.noDeptPermission` / `knowledge.noOrgPermission`。
- 新增 `docs/markdown-test-sample.md`，用于 Markdown 预览、解析和样式检查。
- 知识卡新建请求不再传 `json_content`；前端仅提交 Markdown 正文与现有可编辑字段，结构化 JSON 由后端生成或详情返回。
- 知识卡 JSON 展示区仅在存在可展示 JSON 内容时展示“复制 JSON”按钮。
- 知识卡详情正文区标签列表补充“标签”标题，避免标签区与上方内容断层。
- `PageFilter` 按操作按钮数量、图标和文案动态计算按钮栏宽度，避免按钮栏与“展开/收起”控件重叠。
- 知识卡上下线确认改为复用 `a-modal` 的 header/body/footer 结构，列表与详情共用同一确认弹框组件。
- 开发规范明确 `vue`、`vue-router`、`pinia` 自动导入范围，禁止手动导入已覆盖的运行时 API，类型导入除外。
- `components.d.ts`、`src/auto-imports.d.ts` 保留在版本库中（`pnpm build` 先执行 `vue-tsc`，忽略后 CI/Docker 会缺类型）；已从 ESLint / Prettier / lint-staged 排除，避免 pre-commit 与 `unplugin-*` 生成格式互相覆盖。
- 知识卡版本历史和版本对比交互已收口：当前版本不展示历史对比/回退入口，单版本、同版本、无效版本和回退到当前版本均不可操作；本次仅涉及前端交互边界和单元测试，不变更后端接口、Docker 或环境变量。
- 自飞书 Wiki「API设计」反向同步至 `docs/API设计.md`（§3.2.2 citations、`§4.1.9` 创建字段说明、`§4.1.17` 审核响应 `json_content`/`md_content`/`audit_reject_reason`）。
- 全量自飞书 Wiki（`RjKPwTWUBivbaykfexbcBzaTnvb`）重新生成 `docs/API设计.md`，内容与飞书 docx 纯文本一致；本地不再自行改写 SSE/召回字段注释格式。
- 同步策略调整为：**语义与飞书 Wiki 一致**，本地 `docs/API设计.md` 使用规范 Markdown（代码块、表格、缩进 JSON）；§3.2.2 SSE 示例拆分为流式 `http` 片段与展开的 `done` JSON。
- `PageTable` 的 `type: 'selection'` 列配置现映射 `width` → `rowSelection.columnWidth`、`fixed` → `rowSelection.fixed`，列宽与固定列设置可生效。

## 待维护规则

- 新增 `src/api/*` 接口时，更新 `docs/development-guide.md` 的 API 规则或 `tests/api-contract/` 说明。
- 新增路由或菜单时，更新 `docs/development-guide.md` 的路由权限说明。
- 修改环境变量时，更新 `docs/frontend-development.md` 和 `README.md`。
- 修改 Dockerfile、Compose、Nginx 或 Docker 脚本时，更新 `README.Docker.md`。
- 修改需求文档或素材时，更新 README 文档索引和本看板状态。
