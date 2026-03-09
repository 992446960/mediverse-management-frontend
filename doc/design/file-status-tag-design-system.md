# Mediverse Knowledge 文件管理状态 Tag 设计系统

基于 `ui-ux-pro-max` 生成的建议与项目现有 `Ant Design Vue` 主题进行的整合设计。

## 1. 设计系统概览 (ui-ux-pro-max)

- **模式**: 实时监控 (Real-Time Monitoring)
- **风格**: 深色模式优先 (Dark Mode OLED) / 医疗专业感
- **关键词**: 高对比度、深蓝色调、护眼、技术感、精确
- **推荐色板**:
  - 背景: `#0F172A` (深蓝黑)
  - 文字: `#F8FAFC` (极浅灰白)
  - 成功/CTA: `#22C55E` (翠绿)

## 2. 状态 Tag 配色方案 (Status Mapping)

为了在文件处理的多个中间阶段提供清晰的视觉反馈，我们对 4 个进行中状态进行了色相细分。

| 文件状态 (FileStatus) | 语义/颜色 (AntD Color) | 理由 |
| :--- | :--- | :--- |
| **uploading** (上传中) | `blue` (#0EA5E9) | 初始阶段，使用项目主色，表示动作开始。 |
| **parsing** (解析中) | `cyan` (#06B6D4) | 处理阶段 1，明亮的青色表示正在读取内容。 |
| **extracting** (提取中) | `geekblue` (#4F46E5) | 处理阶段 2，较深的极客蓝表示正在进行深度分析。 |
| **indexing** (索引中) | `purple` (#8B5CF6) | 处理阶段 3，紫色表示最后的归档与索引准备。 |
| **done** (已完成) | `#53b614` | 终态，绿色表示成功。 |
| **failed** (处理失败) | `error` (#DC2626) | 终态，红色表示异常，与主题 `colorError` 一致。 |

## 3. 无障碍与交互规范

- **对比度**: 
  - 亮色模式下，Tag 文字与背景对比度需满足 WCAG AA (4.5:1)。
  - 暗色模式下，利用 Ant Design Vue 的 `darkAlgorithm` 自动调整 Tag 饱和度。
- **交互**:
  - 鼠标悬停在 `failed` 状态的 Tag 上应显示 Tooltip 错误信息。
  - 所有 Tag 保持 `border-radius: 4px` (或跟随全局 `borderRadiusSM`)。
- **反模式避免**:
  - 禁止在 Tag 内使用 Emoji。
  - 避免 4 个进行中状态使用完全相同的颜色。

## 4. 落地清单

- [x] 更新 `src/types/knowledge.ts` 中的 `FILE_STATUS_CONFIG`。
- [x] 确保 `src/views/shared/KnowledgeFiles.vue` 正确引用配置。
- [ ] (可选) 在 `src/config/themes.ts` 中微调 Tag 组件 Token。
