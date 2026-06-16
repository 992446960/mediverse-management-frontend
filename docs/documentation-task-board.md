# 文档任务看板

本文档记录项目文档资产、事实来源和新鲜度状态。任何代码、接口、配置、Docker 或需求变更，都必须更新对应条目。

## 文档资产

| 文档                                                                      | 事实来源                                                          | 状态   | 维护要求                                         |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------ | ------------------------------------------------ |
| `README.md`                                                               | `package.json`、`vite.config.ts`、`README.Docker.md`、`docs/`     | 已补全 | 项目定位、命令和文档索引变化时更新               |
| `AGENTS.md`                                                               | `project-init`、当前仓库结构、验证命令                            | 已补全 | Agent 操作边界、命令或文档索引变化时更新         |
| `CLAUDE.md`                                                               | `project-init`、项目红线规则                                      | 已补全 | 核心红线变化时更新，保持 20 行以内               |
| `docs/development-guide.md`                                               | `wang-convention`、`src/`、`tests/`                               | 已补全 | 编码规范、架构约束或模块边界变化时更新           |
| `docs/frontend-development.md`                                            | `package.json`、`.env.*`、`vite.config.ts`、Docker 配置           | 已补全 | 启动、联调、验证、环境变量变化时更新             |
| `README.Docker.md`                                                        | `Dockerfile`、`compose.yaml`、`nginx.conf`、`scripts/docker-*.sh` | 已补全 | Docker 打包、部署、变量、回滚流程变化时更新      |
| `docs/API设计.docx`                                                       | Management、Ecosys、KnowledgeBase API 详细设计                    | 已存在 | 接口设计、字段约定或错误码变化时更新             |
| `docs/API设计.md`                                                         | 飞书 Wiki「API设计」、线上 Swagger/OpenAPI、`docs/API设计.docx`   | 已存在 | 随飞书/Swagger 接口合同同步更新，便于检索与 diff |
| `docs/markdown-test-sample.md`                                            | Markdown 预览、解析和样式测试文本                                 | 已新增 | Markdown 渲染测试场景变化时更新                  |
| `docs/requirements/shanghai-first-hospital-customization-requirements.md` | 定制需求和 `docs/requirements/assets/`                            | 已存在 | 需求范围、素材或验收标准变化时更新               |
| `tests/api-contract/API_CONTRACT_TEST_REPORT.md`                          | `tests/api-contract/`、真实 API 测试结果                          | 已存在 | API 合规测试覆盖或结果变化时更新                 |
| `docs/superpowers/plans/2026-05-20-python-mock-backend-openapi.md`        | 线上 Swagger、Python mock 后端实现计划                            | 已新增 | mock 后端接口范围、路径或验证命令变化时更新      |
| `docs/superpowers/specs/2026-05-29-avatar-user-ui-unification-design.md`  | 分身与用户管理 UI 设计图、当前 Vue/Ant Design 组件边界            | 已新增 | 分身、用户、个人资料 UI 统一规格变化时更新       |
| `docs/superpowers/plans/2026-05-29-avatar-user-ui-unification.md`         | UI 统一设计规格、当前组件结构、验证要求                           | 已新增 | 分身与用户 UI 实施任务或验收范围变化时更新       |

## 检查任务

| 任务                 | 命令                                                                             | 状态                                  |
| -------------------- | -------------------------------------------------------------------------------- | ------------------------------------- |
| 文档新鲜度检查       | `pnpm check:docs`                                                                | 必须通过                              |
| 聚合验证             | `pnpm verify`                                                                    | 代码或配置变更时必须通过              |
| Docker Compose 校验  | `docker compose config`                                                          | Docker 相关变更时必须通过             |
| API 合规测试         | `pnpm test:api`                                                                  | 具备 `.env.api-test` 和网络条件时运行 |
| Python mock 合同测试 | `API_TEST_USE_MOCK=true API_BASE_URL=http://127.0.0.1:8005/api/v1 pnpm test:api` | mock 后端运行时执行                   |

## 近期同步记录

- 暗黑主题整改阶段 2 落地：分身配置、向导按钮、沟通风格、分身类型、组织 logo 上传 hover、个人资料头像阴影、召回测试 Top-K 与详情 hover 阴影统一改为主色变量；`QuickActionGuide` 的 `#00a0e9` 并入 `var(--color-primary)`，并补充阶段 2 静态契约单测。
- 暗黑主题整改阶段 1 落地：`KBSidebar`、`KnowledgeCardViewer` 系列、`ToolSkillSelector`、`AvatarDetailModal`、`RecallSourceDetailModal`、`KnowledgeCardEditor` 的暗色可见白底/浅灰/近黑文字改为复用 `--color-*` 主题变量，并新增阶段 1 静态契约单测防止类别 A 问题回退。
- 暗黑主题整改阶段 0 基建落地：新增 `src/config/tokens.ts` 集中维护 antdv seed 主色真实色值，`themes.ts` 引用该常量；`variables.css` 新增 diff/code 专用变量并保留 CSS 兜底值；新增静态主题契约单测防止 token 通道再次分裂。
- 前端 i18n 文案收口第一批：错误页、分身测试空态、删除确认、登录过期、请求失败、下载失败和重复提交提示统一接入 `zh-CN` / `en-US` locale，并补充静态 i18n 契约单测。
- 前端样式规范收口第一批：`App.vue` 根级 transition 与用户菜单 overlay 样式迁入全局样式入口，`FullscreenLayout` 补齐 `scoped lang="scss"`，并新增静态样式契约单测防止回退。
- 分身配置表单去重：新增 `src/utils/avatar.ts` 统一 scope、风格 i18n key 和详情表单映射；新增 `useAdvancedConfigOptions` 合并高级配置选项加载与默认值应用；新增 `TagListEditor` 复用标签编辑 UI，并替换新增分身、编辑分身和工作台分身配置中的重复标签逻辑。
- 用户详情/编辑/新增弹窗按 UI 图回修样式：`UserForm.vue` 继续复用同一弹窗组件，详情保留身份摘要与单列只读分区并修正表格 label 样式，编辑/新增弹窗调整为中等宽度；`ReadonlyDescription` 修正单列宽行跨列问题，并新增视觉契约单测防止宽弹窗和卡片式布局回归。
- 个人资料页按原 UI 图回还紧凑名片样式：`Profile.vue` 恢复左侧头像叠加上传按钮、编辑表单和备注区，右侧改为头像、角色状态与图标信息卡预览；保留用户名、手机号、邮箱、机构、科室、备注、保存、刷新、头像上传和修改密码逻辑。
- API Token 管理表格修复 Token 码列：slot 列补稳定 `token_hash` 列标识并默认开启列宽拖拽，单元格改为左侧 token 文本占剩余宽度、右侧显示/复制图标固定对齐，避免宽度充足时仍被固定 140px 截断。
- 分身详情和编辑分身弹窗按 UI 图回修：详情页重做摘要区、基础信息分行样式、高级能力图标行和知识库授权空态；编辑页复用新增分身的头像上传、高级能力卡片，并抽出 `AvatarStyleSelector` 让新增/编辑共用沟通风格卡片；全局滚动条轨道改为透明、滑块复用主题色变量。
- `PageFilter` 多行筛选的“展开/收起”按钮并入查询/重置操作列，操作区按按钮与展开控件整体估算宽度，避免用户管理筛选栏中展开入口脱离按钮盒子。
- 按新增分身 UI 设计图继续回修向导细节：绑定范围下拉补前置图标并改为紧凑预览卡布局，基础信息头像支持移除且去除外层 body 边框，沟通风格卡补齐多色 icon 背景，高级能力配置恢复卡片间距、工具/技能 tag 配色和推理/模型纵向布局，确认预览补齐沟通风格 tag、高级配置图标间距、底部取消按钮与统一按钮尺寸，并将工具/技能多 tag 区域改为最多三行、透明轨道的横向滚动；共享组件单测覆盖头像移除事件。
- 完成分身与用户 UI 统一计划落地：新增 `SectionTitle`、`ReadonlyDescription`、`AvatarUploadPanel`、`IdentitySummary`、`WizardStepper` 共享组件；统一分身详情/编辑/新增向导、科室工作台分身配置、个人资料、用户详情/新增/编辑样式；Chrome 验收覆盖 `/admin/avatars`、`/dept/avatar`、`/my/profile`、`/admin/users`，并通过 `pnpm exec vitest run tests/unit/avatarAdvancedConfig.test.ts tests/unit/uiSharedComponents.test.ts` 与 `pnpm verify`。
- 制定分身与用户管理 UI 统一设计规格和实施计划：覆盖分身详情、新增分身 5 阶段、编辑分身、科室工作台分身配置、个人资料、用户详情、用户编辑、用户新增；设计图资产已落到 `docs/superpowers/specs/assets/2026-05-29-avatar-user-ui/`，计划明确共享组件、页面改造、单测、`pnpm verify` 与 Chrome 验收范围。
- 分身配置新增高级能力配置区块：个人/科室/机构配置页、后台新增/编辑/详情支持工具、技能、推理引擎、模型配置，前端接入 `GET /tools`、`GET /engines`、`GET /models` 并同步 MSW mock、单元测试与 Chrome 验收清单。
- 科室工作台分身配置 Chrome 验收确认高级配置区块、工具/技能选择器可用；当前线上 `PUT /api/v1/my/avatar` 对当前登录科室管理员返回 `分身不存在`，`PUT /api/v1/avatars/{id}` 返回 `doctor_id ... 不存在`，保存回显需后端修复 specialist 分身更新合同。
- 二次对比飞书 Wiki「API设计」目录更新：确认 `3.2.3` / `3.2.4` / `3.2.5` 上次未落地，补齐 `GET /api/v1/tools`、`GET /api/v1/engines`、`GET /api/v1/models`；同步整理 §2.1.4-§2.1.9 分身配置、编辑、统计接口字段，修复旧的破损 JSON/表格占位。
- 自飞书 Wiki「API设计」（`RjKPwTWUBivbaykfexbcBzaTnvb`，docx token `D53xdwU3aoPGDnxAQLicIHEjn1d`）同步本地 `docs/API设计.md`：补充分身列表/创建/详情接口中的 `user_id`、`tools`、`skills`、`algorithm`、`model` 与 `doctor_id` 示例；§4.4.2 召回详情补 `confidence`；§4.4.5/§4.4.6 按飞书示例更新召回响应中的 `count`、空 `answer` 和知识卡正文/关联文件字段。
- 默认品牌统一为 `Mediverse Management`：中英文 `app.brandName`、浏览器初始标题、首屏加载页和 README 项目描述同步改名；主布局侧栏品牌区沿用 SH1 长文案方案，保持侧栏宽度不变并用单行省略和 tooltip 展示完整名称。
- 召回历史隐藏 `confidence` 展示：历史列表不展示置信度列，选中历史详情回填时不带出置信度；实时召回结果仍按接口返回展示置信度。
- 知识卡召回测试页迁移到 `src/views/shared/knowledge-recall-test/index.vue` 页面目录结构，结果展示、历史弹窗、详情弹窗拆为页面私有组件，卡片类型选择逻辑下沉为页面私有 composable，个人/科室/机构入口同步改为 `knowledge-recall-test/index.vue`。
- 开发规范补齐页面目录和组件边界：新增页面必须使用 `src/views/<domain>/<page>/index.vue`，页面私有组件/composable 留在页面目录内，`src/components/` 仅承载跨页面复用组件，并明确单文件复杂度拆分阈值。
- 业务文件预览页仅在内容区展示 PDF「解析视图/原文视图」切换，避免页头和内容区重复出现同一组切换入口。
- 同一工作台反复点击文件预览时复用并更新原预览标签，不再连续新增多个预览标签。
- Excel 文件预览容器尺寸变化后会重新挂载 `@vue-office/excel` 渲染器，避免浏览器窗口拖动导致表格内容空白，并补充 resize 回归单测。
- 通用文件预览页改为测量内容区实际像素尺寸并传给 Excel 预览器；Excel 预览器首次拿到有效尺寸后会重挂载一次，避免 `a-spin` / 全屏布局层级导致表格只按初始小高度渲染。
- Excel 文件预览新增 100% / 125% / 150% 数据级缩放，默认 125%，通过 `transformData` 放大列宽、行高和字体，避免 CSS transform 导致坐标错位。
- Excel 文件预览缩放工具栏下方的表格区域改为独立测量尺寸，避免缩放工具栏占高后底部工作表栏被裁切。
- 召回测试执行中禁用召回历史入口；测试问题、最终回答、召回知识卡标题补充图标；知识卡详情使用预览内容兜底时显示提示。
- 召回知识卡详情中的关联文件统一使用详情返回的文件 URL 打开通用预览，不再进入业务文件预览页。
- 召回历史弹窗复用 `PageFilter` 和 `PageTable` 组件，并优化表格展示：状态展示本地化枚举，耗时按秒/毫秒安全格式化，创建时间格式化到分钟；操作列右侧固定且仅成功记录可查看详情；召回知识卡详情补齐 Markdown 预览样式。
- 知识卡召回详情弹窗移除右侧 JSON 展示；历史详情中 `md_content` 为空或异常为 JSON 时改用 `card_preview_content` 作为正文兜底，避免原始 JSON 占据 Markdown 内容区。
- 知识卡召回测试页新增召回历史弹窗：列表对接 §4.4.1，选中记录后调用 §4.4.2 并通过统一 ViewModel 回填现有召回测试结果区；点击召回知识卡详情直接使用 `retrieved_sources[].md_content/json_content`。
- 按飞书 Wiki「API设计」最新评论 `7643737490725161956` 仅对比 §4.4.2 召回记录详情查询，补齐 `retrieved_sources[]` 中的 `json_content` / `md_content` 返回字段。
- 按飞书 Wiki「API设计」评论 `7642609880704240604` 同步 `docs/API设计.md`：§4.1.9 创建知识卡 Request 补 `json_content` 非必填说明，§4.1.9/§4.1.10 Response 将 `online_status` 标注为任务状态占位并注明 `creating` / `updating` 含义。
- `DirectoryTree` 支持通过配置开启拖拽调整宽度与一键收起，文件管理页启用该能力；默认进入页面仍展示目录筛选条件，收起态保留明显的「目录」展开入口。
- `PageTree` 支持通过配置开启拖拽调整宽度与一键收起，科室管理和用户管理页启用该能力，收起态保留明显展开入口。
- 剩余公共组件文案收口：`RightToolbar`、`DirectoryTree`、`PageTree`、`SkillPanel`、主题切换按钮与 HTTP/session 错误兜底改为使用 i18n key，并补齐 icon-only 按钮可访问名称。
- `DirectoryTree`、`PageTree` 与 `DirectoryTreeItem` 的折叠态、hover、active、滚动条和分支线样式改为使用主题变量，避免硬编码主色和亮/暗色背景。
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
