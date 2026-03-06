# Clare Skill 设计规范 v1.0

> 工程化视角 · 企业级 Agent Skill 体系设计标准
> 
> Author: Clare · Version: 1.0.0 · Created: 2025

---

## 核心结论

Skill 不是 Prompt，是**可注册、可组合、可测试的最小行为单元**。

规范的核心原则：**统一结构 + 分层抽象 + 语义版本 + 可测试性**

---

## 一、Skill 类型分类体系

```
┌─────────────────────────────────────────────────┐
│              Skill Type Taxonomy                 │
├──────────────┬───────────────┬──────────────────┤
│ Layer        │ Type          │ 描述             │
├──────────────┼───────────────┼──────────────────┤
│ Knowledge    │ Convention    │ 规范约定型        │
│              │ Reference     │ 知识参考型        │
├──────────────┼───────────────┼──────────────────┤
│ Behavior     │ Meta          │ 元技能型          │
│              │ Workflow      │ 流程控制型        │
│              │ Transform     │ 转换处理型        │
├──────────────┼───────────────┼──────────────────┤
│ Tool         │ Function      │ 函数调用型        │
│              │ Integration   │ 外部集成型        │
└──────────────┴───────────────┴──────────────────┘
```

---

## 二、标准目录结构

```
skill-name/
├── SKILL.md          # 核心定义文件（必须）
├── examples/         # 输入/输出示例（强烈推荐）
│   ├── input-01.md
│   └── output-01.md
├── tests/            # 测试用例（推荐）
│   └── test-cases.yaml
├── scripts/          # 辅助脚本（可选）
├── references/       # 参考资料（可选）
└── assets/           # 静态资源（可选）
```

**原则**：`SKILL.md` 是唯一必须项，其余按需加载。

---

## 三、SKILL.md 标准结构

```markdown
---
name: skill-name
version: 1.0.0
type: behavior | knowledge | tool
layer: meta | workflow | transform | convention | reference | function | integration
description: "一句话描述，动词开头"
author: clare
tags: [tag1, tag2]
created: 2025-01-01
updated: 2025-01-01

input_schema:
  - name: input_field
    type: string
    required: true
    description: "输入说明"

output_schema:
  - name: output_field
    type: string
    description: "输出说明"

compatibility:
  models: [claude-3-5, gpt-4o]
  context_min: 8k

dependencies: []        # 依赖的其他 skill
triggers: []            # 触发关键词或条件
---

# {Skill Name}

## Purpose
> 一段话说清楚：这个 Skill 解决什么问题，为什么存在。

## Activation
> 何时激活，触发条件是什么。

## Instructions
> 核心行为指令，结构化书写。
> 使用编号列表，每条指令单一职责。

1. 指令一
2. 指令二
3. 指令三

## Output Format
> 明确输出结构，给出模板或示例。

​```output
# 示例输出结构
​```

## Constraints
> 明确禁止项和边界。
- ❌ 禁止...
- ⚠️ 注意...

## Examples
> 引用 examples/ 目录或内联示例。
```

---

## 四、抽象模型

```
Skill = Identity + Behavior + Contract

Identity:   name / version / type / layer / tags
Behavior:   activation + instructions + constraints
Contract:   input_schema + output_schema + dependencies
```

三者缺一不可：

- 没有 **Contract** 的 Skill → 不可测试
- 没有 **Identity** 的 Skill → 不可注册
- 没有 **Behavior** 的 Skill → 只是文档

---

## 五、版本控制规范

采用语义化版本 `MAJOR.MINOR.PATCH`：

| 版本位 | 触发条件 | 示例 |
|--------|----------|------|
| MAJOR | 破坏性变更（input/output schema 变更） | 1.0.0 → 2.0.0 |
| MINOR | 新增能力（新增可选字段、新增行为分支） | 1.0.0 → 1.1.0 |
| PATCH | 修复与优化（描述优化、约束补充） | 1.0.0 → 1.0.1 |

---

## 六、Skill 注册表结构（企业级扩展）

```yaml
# skill-registry.yaml
skills:
  - id: skill-analyzer
    path: ./skills/skill-analyzer/
    version: 1.0.0
    type: behavior
    layer: meta
    status: stable       # stable | beta | deprecated
    owner: clare
    loaded_by_default: false
```

---

## 七、可测试性标准

每个 Skill 应附带 `tests/test-cases.yaml`：

```yaml
# tests/test-cases.yaml
cases:
  - id: tc-001
    description: "基础功能验证"
    input:
      field_name: "示例输入"
    expected_output:
      contains: ["关键词1", "关键词2"]
      structure: ["section1", "section2"]
    pass_criteria: contains_all
```

---

## 八、潜在架构风险

### 风险1：Skill 粒度失控
过细导致组合爆炸，过粗导致复用率低。

**规范**：单个 Skill 的 Instructions 不超过 7 条，超过则拆分。

### 风险2：循环依赖
A 依赖 B，B 依赖 A。

**规范**：`dependencies` 字段在注册时做 DAG 验证，禁止循环引用。

### 风险3：版本漂移
多人维护时 MAJOR 版本随意升级。

**规范**：MAJOR 变更需 PR review + 影响评估文档。

### 风险4：Context 污染
多 Skill 同时加载时指令冲突。

**规范**：每个 Skill 必须声明 `context_min` 和 `layer`，Agent 按层级优先级加载，Behavior 层可覆盖 Knowledge 层但不可逆。

### 风险5：无 Contract 的黑盒 Skill
无 `input/output schema` 的 Skill 无法被上层 Agent 编排调用。

**规范**：无 schema 的 Skill 只能以 `reference` 类型注册，不允许参与自动编排。

---

## 九、Clare Skill 体系全景

```
企业 Skill Registry
        │
        ├── Knowledge Layer
        │     ├── convention/style-guide
        │     └── reference/domain-knowledge
        │
        ├── Behavior Layer
        │     ├── meta/skill-analyzer      ← 已完成
        │     ├── workflow/report-writer
        │     └── transform/format-converter
        │
        └── Tool Layer
              ├── function/code-executor
              └── integration/api-caller
```

---

## 十、认知模型总结

```
Skill 逆向分析
      ↓
Skill 抽象归类
      ↓
Skill 规范统一
      ↓
企业级 Skill 体系
```

**下一步建议**：基于此规范，用 SkillAnalyzer 逆向分析 3 个现有 Skill，验证规范覆盖率，再迭代到 v1.1。

---

*Clare Skill 设计规范 v1.0 · 持续迭代中*