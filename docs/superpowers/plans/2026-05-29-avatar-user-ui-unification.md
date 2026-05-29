# Avatar And User UI Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify avatar and user management UI around the approved medical SaaS style while preserving existing business behavior.

**Architecture:** Add a small shared UI layer for section titles, avatar upload, identity summaries, readonly descriptions, and wizard steps. Keep domain behavior inside existing avatar and user components, and reuse `AdvancedConfigFields` / `ToolSkillSelector` for capability selection instead of duplicating advanced-config state.

**Tech Stack:** Vue 3, TypeScript, Ant Design Vue 4, `@ant-design/icons-vue`, existing project CSS variables, Vitest, Chrome acceptance.

---

## File Structure

Create shared UI components:

- `src/components/SectionTitle/index.vue`: shared blue-accent section heading.
- `src/components/AvatarUploadPanel/index.vue`: shared avatar upload display and trigger UI.
- `src/components/IdentitySummary/index.vue`: shared avatar/name/status/scope header.
- `src/components/ReadonlyDescription/index.vue`: shared readonly field rows and tag values.
- `src/components/WizardStepper/index.vue`: shared stepper used by avatar wizard.

Modify avatar components:

- `src/views/admin/Avatars/components/AvatarEditModal.vue`
- `src/views/admin/Avatars/components/AvatarDetailModal.vue`
- `src/views/admin/Avatars/components/AvatarWizard.vue`
- `src/views/admin/Avatars/components/steps/StepType.vue`
- `src/views/admin/Avatars/components/steps/StepScope.vue`
- `src/views/admin/Avatars/components/steps/StepInfo.vue`
- `src/views/admin/Avatars/components/steps/StepAdvanced.vue`
- `src/views/admin/Avatars/components/steps/StepConfirm.vue`
- `src/components/AvatarConfig/index.vue`
- `src/components/AvatarConfig/AdvancedConfigFields.vue`

Modify user/profile components:

- `src/views/my/Profile.vue`
- `src/views/admin/Users/components/UserForm.vue`

Tests and docs:

- `tests/unit/avatarAdvancedConfig.test.ts`
- `tests/unit/uiSharedComponents.test.ts`
- `docs/documentation-task-board.md`

## Task 1: Shared Section And Readonly Components

**Files:**
- Create: `src/components/SectionTitle/index.vue`
- Create: `src/components/ReadonlyDescription/index.vue`
- Test: `tests/unit/uiSharedComponents.test.ts`

- [ ] **Step 1: Add failing tests for shared display contracts**

Add `tests/unit/uiSharedComponents.test.ts` with these assertions:

```ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SectionTitle from '@/components/SectionTitle/index.vue'
import ReadonlyDescription from '@/components/ReadonlyDescription/index.vue'

describe('shared UI components', () => {
  it('renders section title with optional description', () => {
    const wrapper = mount(SectionTitle, {
      props: {
        title: '高级能力配置',
        description: '配置工具、技能与模型',
      },
    })

    expect(wrapper.text()).toContain('高级能力配置')
    expect(wrapper.text()).toContain('配置工具、技能与模型')
    expect(wrapper.find('.section-title__accent').exists()).toBe(true)
  })

  it('renders readonly rows with fallback empty text', () => {
    const wrapper = mount(ReadonlyDescription, {
      props: {
        items: [
          { label: '姓名', value: 'yuyang' },
          { label: '邮箱', value: '' },
        ],
      },
    })

    expect(wrapper.text()).toContain('姓名')
    expect(wrapper.text()).toContain('yuyang')
    expect(wrapper.text()).toContain('邮箱')
    expect(wrapper.text()).toContain('—')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec vitest run tests/unit/uiSharedComponents.test.ts
```

Expected: fails because the shared components do not exist.

- [ ] **Step 3: Implement `SectionTitle`**

Create `src/components/SectionTitle/index.vue`:

```vue
<template>
  <div class="section-title">
    <span class="section-title__accent" aria-hidden="true" />
    <div class="section-title__content">
      <div class="section-title__text">{{ title }}</div>
      <div v-if="description" class="section-title__description">{{ description }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style scoped lang="scss">
.section-title {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.section-title__accent {
  width: 3px;
  height: 18px;
  margin-top: 2px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
}

.section-title__text {
  font-size: 16px;
  font-weight: 600;
  line-height: 22px;
  color: var(--color-text-base);
}

.section-title__description {
  margin-top: 2px;
  font-size: 13px;
  line-height: 20px;
  color: var(--color-text-secondary);
}
</style>
```

- [ ] **Step 4: Implement `ReadonlyDescription`**

Create `src/components/ReadonlyDescription/index.vue`:

```vue
<template>
  <div class="readonly-description">
    <div
      v-for="item in items"
      :key="item.label"
      class="readonly-description__row"
      :class="{ 'readonly-description__row--span': item.span === 2 }"
    >
      <div class="readonly-description__label">{{ item.label }}</div>
      <div class="readonly-description__value">
        <template v-if="Array.isArray(item.value)">
          <a-space v-if="item.value.length" :size="6" wrap>
            <a-tag v-for="value in item.value" :key="value">{{ value }}</a-tag>
          </a-space>
          <span v-else>{{ emptyText }}</span>
        </template>
        <template v-else>
          {{ String(item.value || emptyText) }}
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface ReadonlyDescriptionItem {
  label: string
  value?: string | number | string[] | null
  span?: 1 | 2
}

withDefaults(
  defineProps<{
    items: ReadonlyDescriptionItem[]
    emptyText?: string
  }>(),
  { emptyText: '—' }
)
</script>

<style scoped lang="scss">
.readonly-description {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.readonly-description__row {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  min-height: 44px;
  border-bottom: 1px solid var(--color-border-secondary);
}

.readonly-description__row--span {
  grid-column: 1 / -1;
}

.readonly-description__label {
  padding: 12px 14px;
  color: var(--color-text-secondary);
  background: var(--color-bg-layout);
}

.readonly-description__value {
  min-width: 0;
  padding: 12px 14px;
  color: var(--color-text-base);
  word-break: break-word;
}
</style>
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm exec vitest run tests/unit/uiSharedComponents.test.ts
```

Expected: the new test file passes.

- [ ] **Step 6: Commit**

```bash
git add src/components/SectionTitle/index.vue src/components/ReadonlyDescription/index.vue tests/unit/uiSharedComponents.test.ts
git commit -m "feat(ui): 新增通用分区和只读描述组件" -m "- 抽出 SectionTitle 统一分区标题" -m "- 抽出 ReadonlyDescription 统一详情展示"
```

## Task 2: Shared Avatar And Identity Components

**Files:**
- Create: `src/components/AvatarUploadPanel/index.vue`
- Create: `src/components/IdentitySummary/index.vue`
- Modify: `tests/unit/uiSharedComponents.test.ts`

- [ ] **Step 1: Extend shared component tests**

Append tests:

```ts
import AvatarUploadPanel from '@/components/AvatarUploadPanel/index.vue'
import IdentitySummary from '@/components/IdentitySummary/index.vue'

it('emits upload click from avatar upload panel', async () => {
  const wrapper = mount(AvatarUploadPanel, {
    props: {
      imageUrl: '',
      title: '头像',
      actionText: '上传头像',
      hint: '建议尺寸 200x200px',
    },
  })

  await wrapper.find('button').trigger('click')

  expect(wrapper.emitted('upload')).toHaveLength(1)
  expect(wrapper.text()).toContain('上传头像')
})

it('renders identity summary scope and status', () => {
  const wrapper = mount(IdentitySummary, {
    props: {
      name: '余主任的分身1',
      scope: 'AI创新研究院 / 前端开发部门 / yuyang',
      statusText: '启用中',
    },
  })

  expect(wrapper.text()).toContain('余主任的分身1')
  expect(wrapper.text()).toContain('AI创新研究院')
  expect(wrapper.text()).toContain('启用中')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec vitest run tests/unit/uiSharedComponents.test.ts
```

Expected: fails because avatar and identity components do not exist.

- [ ] **Step 3: Create `AvatarUploadPanel`**

Implement a component with props `imageUrl`, `title`, `actionText`, `hint`, `loading`, `disabled`, and emit `upload`. Use `UserOutlined` for empty avatar and `PlusOutlined` inside the button. Keep the file scoped to upload presentation only; the parent keeps the hidden file input and upload API.

- [ ] **Step 4: Create `IdentitySummary`**

Implement a component with props `avatarUrl`, `name`, `scope`, `statusText`, `statusColor`, and optional `tags`. Use a round avatar fallback with `UserOutlined`, render status as `a-tag`, and render scope in one truncating line.

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
pnpm exec vitest run tests/unit/uiSharedComponents.test.ts
```

Expected: all shared component tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/AvatarUploadPanel/index.vue src/components/IdentitySummary/index.vue tests/unit/uiSharedComponents.test.ts
git commit -m "feat(ui): 新增头像上传和身份摘要组件" -m "- 统一头像上传展示结构" -m "- 统一分身和用户身份摘要展示"
```

## Task 3: Avatar Detail And Edit Modal

**Files:**
- Modify: `src/views/admin/Avatars/components/AvatarDetailModal.vue`
- Modify: `src/views/admin/Avatars/components/AvatarEditModal.vue`

- [ ] **Step 1: Update detail modal structure**

Use `IdentitySummary`, `SectionTitle`, and `ReadonlyDescription`:

- Top summary receives `detail.name`, `formatScope(detail)`, `detail.avatar_url`, and active/inactive status.
- Basic readonly items include type, bio, greeting, style, tags, created time, updated time.
- Advanced readonly items include `advancedSummary.tools`, `advancedSummary.skills`, `advancedSummary.algorithm`, `advancedSummary.model`.
- Knowledge grants remain as the existing `a-table`.

- [ ] **Step 2: Update edit modal visual layout**

Keep existing data loading, upload, validation, and submit logic. Replace only presentation:

- Left rail uses `AvatarUploadPanel`.
- Right content uses `SectionTitle` for base, style, and advanced sections.
- Style options use card-style radio labels with icons from `UserOutlined`, `MessageOutlined`, `ThunderboltOutlined`, `FileTextOutlined`, `SettingOutlined`.
- Existing `AdvancedConfigFields` remains the advanced-config input.

- [ ] **Step 3: Run targeted type check**

Run:

```bash
pnpm build
```

Expected: `vue-tsc -b && vite build` passes.

- [ ] **Step 4: Chrome verify `/admin/avatars`**

Open logged-in Chrome at:

```text
http://localhost:3001/admin/avatars
```

Check:

- Existing avatar detail opens and shows identity summary plus advanced summary.
- Existing avatar edit opens and shows left avatar rail plus advanced config block.
- Tool and skill selectors still open.

- [ ] **Step 5: Commit**

```bash
git add src/views/admin/Avatars/components/AvatarDetailModal.vue src/views/admin/Avatars/components/AvatarEditModal.vue
git commit -m "feat(avatar): 统一分身详情和编辑弹框样式" -m "- 分身详情改为身份摘要和只读分组" -m "- 编辑分身复用头像和分区组件"
```

## Task 4: Avatar Wizard Multi-Step UI

**Files:**
- Create: `src/components/WizardStepper/index.vue`
- Modify: `src/views/admin/Avatars/components/AvatarWizard.vue`
- Modify: `src/views/admin/Avatars/components/steps/StepType.vue`
- Modify: `src/views/admin/Avatars/components/steps/StepScope.vue`
- Modify: `src/views/admin/Avatars/components/steps/StepInfo.vue`
- Modify: `src/views/admin/Avatars/components/steps/StepAdvanced.vue`
- Modify: `src/views/admin/Avatars/components/steps/StepConfirm.vue`

- [ ] **Step 1: Add `WizardStepper`**

Props:

```ts
type WizardStep = { key: string; title: string }

defineProps<{
  steps: WizardStep[]
  current: number
}>()
```

Rendering contract:

- Index less than `current`: check circle.
- Index equal to `current`: solid primary circle.
- Index greater than `current`: gray circle.
- Step labels are visible and no longer than one line.

- [ ] **Step 2: Replace inline stepper in `AvatarWizard.vue`**

Pass localized titles into `WizardStepper`:

```ts
const wizardSteps = computed(() =>
  steps.map((step) => ({
    key: step.key,
    title: t(step.titleKey),
  }))
)
```

- [ ] **Step 3: Restyle `StepType`**

Keep `useAvatarCreatePermission`. Render allowed types as large option cards with title, description, selected border, and radio indicator. Do not change allowed type logic.

- [ ] **Step 4: Restyle `StepScope`**

Keep the existing select loading and validation logic. Add a readonly range preview under the form when org/dept/user labels are available.

- [ ] **Step 5: Restyle `StepInfo`**

Use the same left avatar rail and right form structure as `AvatarEditModal`. Keep `validate()` exposed exactly as today.

- [ ] **Step 6: Restyle `StepAdvanced`**

Wrap existing `AdvancedConfigFields` in the approved advanced capability visual block. Do not duplicate API loading inside this step beyond its current behavior.

- [ ] **Step 7: Restyle `StepConfirm`**

Replace the table-like confirmation with identity summary, advanced summary, and content summary sections. Keep `resolveAdvancedConfigSummary` for labels.

- [ ] **Step 8: Verify wizard tests**

Run:

```bash
pnpm exec vitest run tests/unit/avatarAdvancedConfig.test.ts tests/unit/uiSharedComponents.test.ts
```

Expected: both test files pass.

- [ ] **Step 9: Chrome verify avatar creation**

At `/admin/avatars`:

- Open 新增分身.
- Verify all 5 stages render with the new stepper.
- Create a test avatar with at least one tool, one skill, one engine, and one model.
- Open the created avatar detail and confirm the selected advanced config is visible.
- Delete the test avatar after verification.

- [ ] **Step 10: Commit**

```bash
git add src/components/WizardStepper/index.vue src/views/admin/Avatars/components/AvatarWizard.vue src/views/admin/Avatars/components/steps/StepType.vue src/views/admin/Avatars/components/steps/StepScope.vue src/views/admin/Avatars/components/steps/StepInfo.vue src/views/admin/Avatars/components/steps/StepAdvanced.vue src/views/admin/Avatars/components/steps/StepConfirm.vue
git commit -m "feat(avatar): 统一新增分身向导样式" -m "- 抽出向导步骤条组件" -m "- 优化类型范围信息能力确认五阶段展示"
```

## Task 5: Workbench Avatar Config

**Files:**
- Modify: `src/components/AvatarConfig/index.vue`
- Modify: `src/components/AvatarConfig/AdvancedConfigFields.vue`
- Modify: `src/views/dept/Avatar.vue`

- [ ] **Step 1: Refactor `AvatarConfig` presentation**

Keep API calls and save payload unchanged. Present:

- Basic information section.
- Conversation strategy section.
- Advanced capability section.
- Footer actions aligned with the approved style.

- [ ] **Step 2: Tighten `AdvancedConfigFields` layout**

Preserve props and emits. Adjust only spacing, chips, and select grouping so it can be reused in modals and workbench pages.

- [ ] **Step 3: Verify `/dept/avatar` manually**

At `/dept/avatar`:

- Confirm section layout matches edit modal style.
- Tool and skill selectors open.
- Save behavior is unchanged. If backend still returns `分身不存在`, record it as an existing backend blocker and do not mask the error.

- [ ] **Step 4: Commit**

```bash
git add src/components/AvatarConfig/index.vue src/components/AvatarConfig/AdvancedConfigFields.vue src/views/dept/Avatar.vue
git commit -m "feat(avatar): 统一工作台分身配置样式" -m "- 工作台配置复用分区和能力配置视觉" -m "- 保留现有保存接口和后端错误展示"
```

## Task 6: Profile And User Forms

**Files:**
- Modify: `src/views/my/Profile.vue`
- Modify: `src/views/admin/Users/components/UserForm.vue`

- [ ] **Step 1: Update profile page**

Keep `authApi.updateMe`, avatar upload, refresh, and change password flows. Replace presentation with:

- `AvatarUploadPanel` for avatar section.
- Left form with consistent section spacing.
- Right preview using `IdentitySummary` and readonly rows.

- [ ] **Step 2: Update user detail mode**

When `viewOnly` is true:

- Render `IdentitySummary` with username or real name.
- Render grouped readonly fields for basic info, organization, roles, status, and created time.
- Keep footer close button.

- [ ] **Step 3: Update user create/edit mode**

Keep `formState`, `rules`, submit payload, and role permission logic. Adjust only layout:

- Two-column fields on desktop.
- Organization and department at top for creation.
- Username disabled in edit mode.
- Password visible only in create mode.
- Roles as wrapped checkbox chips.
- Status as compact radio group.

- [ ] **Step 4: Chrome verify user flows**

At `/my/profile`:

- Upload trigger opens file picker.
- Save and refresh buttons remain visible.
- Change password opens modal.

At `/admin/users`:

- Detail opens in readonly layout.
- Edit opens and saves existing fields.
- Add user opens with password field and locked org/dept behavior preserved by current role.

- [ ] **Step 5: Commit**

```bash
git add src/views/my/Profile.vue src/views/admin/Users/components/UserForm.vue
git commit -m "feat(user): 统一个人资料和用户弹框样式" -m "- 个人资料复用头像和身份摘要组件" -m "- 用户详情新增编辑复用统一表单视觉"
```

## Task 7: Documentation And Final Verification

**Files:**
- Modify: `docs/documentation-task-board.md`
- Optionally modify: `README.md`

- [ ] **Step 1: Update documentation task board**

Add a recent sync record for avatar and user UI unification. If new design or plan docs are added to the document index, add them to README and the task board asset table.

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm exec vitest run tests/unit/avatarAdvancedConfig.test.ts tests/unit/uiSharedComponents.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Run full frontend verification**

Run:

```bash
pnpm verify
```

Expected: `pnpm check:docs` passes, then `vue-tsc -b && vite build` passes.

- [ ] **Step 4: Final Chrome acceptance**

Use logged-in Chrome and verify:

- `/admin/avatars`: detail, edit, add wizard stages 1-5, create, detail replay, edit replay.
- `/dept/avatar`: workbench config display, selector open, save behavior unchanged.
- `/my/profile`: profile edit, preview, change password modal open.
- `/admin/users`: user detail, edit, add.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/documentation-task-board.md
git commit -m "docs(ui): 同步分身和用户 UI 统一计划" -m "- 更新文档索引和任务看板" -m "- 记录最终验证范围"
```

## Execution Notes

- Do not introduce a new icon library.
- Do not change API payload shape.
- Do not change role permission logic.
- Do not hide existing backend save errors in `/dept/avatar`.
- Prefer scoped styles in the modified component or shared component.
- Reuse current CSS variables instead of hard-coded theme colors where possible.

## Self-Review

- Spec coverage: all requested surfaces are covered: avatar detail, avatar creation stages, workbench avatar config, profile, user detail, user edit, and user creation.
- Placeholder scan: the plan has no placeholder markers and no open-ended implementation slots.
- Type consistency: shared component names and props are defined before later tasks reference them.
