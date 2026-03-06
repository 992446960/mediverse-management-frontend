---
name: skill-analyzer
version: 1.0.0
type: behavior
layer: meta
description: '分析任意 Skill 文件，输出结构化理解报告，用于学习与逆向工程'
author: clare
tags: [meta, analyzer, learning, reverse-engineering, skill-design]
created: 2025-01-01
updated: 2025-01-01

input_schema:
  - name: skill_file
    type: file | text
    required: true
    description: '需要分析的 Skill 文件内容，支持粘贴文本或上传文件'

output_schema:
  - name: overview
    type: string
    description: 'Skill 大致内容概述'
  - name: purpose
    type: string
    description: 'Skill 的核心作用与设计意图'
  - name: usage
    type: string
    description: 'Skill 的具体用法与调用方式'
  - name: analysis
    type: object
    description: '技术结构深度分析'
  - name: extension
    type: string
    description: '可扩展方向建议'
  - name: full_chinese_translation
    type: string
    description: '当输入 Skill 文件为全英文时，输出的该文件完整中文翻译；非全英文时省略'

compatibility:
  models: [claude-3-5, claude-4, gpt-4o]
  context_min: 8k

dependencies: []
triggers:
  - '/skill-analyzer'
  - '/sa'
---

# Skill Analyzer

## Purpose

帮助工程师通过阅读和分析他人的 Skill 文件来快速学习 Skill 设计范式。  
核心价值：**将黑盒 Skill 变成可读懂、可复用、可学习的结构化知识。**

这是一个 Meta-Skill —— 它的输入是 Skill，它的输出是对 Skill 的理解。

---

## Activation

**触发方式：**

```
/skill-analyzer [skill文件内容或文件路径]
/sa [skill文件内容或文件路径]
```

**触发条件：**

- 用户使用指令 `/skill-analyzer` 或 `/sa`
- 用户明确表达"帮我分析这个 skill"、"理解这个 skill 文件"等意图
- 用户上传或粘贴了一个 Skill 文件内容并希望学习它

---

## Instructions

1. **读取输入**：接收用户提供的 Skill 文件（文本粘贴 或 文件上传），完整读取全部内容，不做裁剪。

2. **识别结构**：判断该 Skill 的格式类型（是否含 YAML frontmatter、Markdown body、脚本文件、示例文件等），识别其所属类型与层级。

3. **输出概述（Overview）**：用 2-3 句话概括该 Skill 的整体内容，包含：它是什么、属于哪个领域、处理什么对象。

4. **输出作用（Purpose）**：分析该 Skill 存在的原因与设计意图，回答"为什么要有这个 Skill，它解决了什么问题"。

5. **输出用法（Usage）**：说明该 Skill 的使用方式，包括：触发方式、输入格式、调用示例。若文件中有示例则直接引用。

6. **输出技术结构分析（Analysis）**：从工程视角深度拆解该 Skill，必须覆盖以下维度：

   - **类型判断**：Knowledge / Behavior / Tool，及其子类型
   - **结构完整性**：是否含 Identity / Behavior / Contract 三要素
   - **指令质量**：Instructions 是否单一职责、是否有歧义
   - **Contract 完整性**：input/output schema 是否明确
   - **设计亮点**：值得学习的设计模式或表达方式
   - **设计缺陷**：缺失、模糊或可改进的部分

7. **输出扩展方向（Extension）**：基于该 Skill 的能力边界，提出 2-3 个可扩展或衍生的方向，给出具体建议而非泛泛描述。

8. **全英文输入时的完整中文翻译**：若判断输入 Skill 文件**主体内容为全英文**（如 YAML + Markdown 均为英文），则在报告中增加一个独立 Section，输出**该文件的完整中文翻译**，保持原有结构（frontmatter、标题层级、代码块等），仅将自然语言部分译为中文，便于中文读者直接阅读原文等价内容。若文件为中文或中英混合，则**不输出**本 Section。

---

## Output Format

严格按照以下结构输出，使用 Markdown 格式，每个 Section 独立清晰：

````output
# 📦 Skill 分析报告：{skill-name}

---

## 1️⃣ 大致内容（Overview）
{2-3句话概括：这个Skill是什么，处理什么，属于哪个领域}

---

## 2️⃣ 作用（Purpose）
{这个Skill存在的原因，解决了什么问题，设计意图是什么}

---

## 3️⃣ 用法（Usage）

**触发方式：**
{触发指令或调用条件}

**输入：**
{输入格式和示例}

**调用示例：**
​```
{具体调用示例}
​```

---

## 4️⃣ 技术结构分析（Analysis）

| 维度 | 结论 |
|------|------|
| Skill 类型 | {Knowledge / Behavior / Tool} · {子类型} |
| 结构完整性 | Identity ✅/❌ · Behavior ✅/❌ · Contract ✅/❌ |
| 指令质量 | {评价} |
| Contract 完整性 | {评价} |

**设计亮点：**
- {亮点1}
- {亮点2}

**设计缺陷 / 改进建议：**
- {缺陷1 及建议}
- {缺陷2 及建议}

---

## 5️⃣ 扩展方向（Extension）

**方向1：{名称}**
{具体说明，可以做什么，怎么做}

**方向2：{名称}**
{具体说明}

**方向3：{名称}**
{具体说明}

---

## 6️⃣ 完整中文翻译（仅当输入文件为全英文时输出）

当且仅当输入的 Skill 文件主体为**全英文**时，在此输出该文件的**完整中文翻译**，要求：
- 保留原有文档结构（YAML frontmatter、各级标题、列表、代码块等）
- 仅将自然语言正文译为中文，专有名词、字段名、代码可保留英文
- 翻译需完整覆盖全文，不省略段落

若输入为中文或中英混合，则**不输出**本 Section。
````

---

## Constraints

- ❌ 禁止在未完整读取 Skill 文件内容前输出任何分析结论
- ❌ 禁止跳过任何一个输出 Section，5 个部分必须全部输出
- ❌ 禁止用泛泛的语言描述分析结果，每条结论必须有依据（引用原文片段）
- ❌ 禁止对 Skill 文件的内容做修改或"优化后输出"，分析阶段只读不写
- ⚠️ 如果输入的文件格式不规范或残缺，仍需尽力分析，并在 Analysis 章节注明"文件结构异常：{原因}"
- ⚠️ 分析报告语言跟随用户输入语言（中文输入 → 中文输出，英文输入 → 英文输出）
- ✅ 当输入 Skill 文件为全英文时，**必须**在报告中包含「6️⃣ 完整中文翻译」Section，且翻译须覆盖全文、保持结构一致

---

## Examples

**调用示例：**

```
/skill-analyzer

---
name: code-reviewer
version: 1.0.0
...（skill文件内容）
```

**预期输出片段：**

```
# 📦 Skill 分析报告：code-reviewer

## 1️⃣ 大致内容（Overview）
这是一个代码审查类 Behavior Skill，用于对输入的代码片段进行质量分析...

## 2️⃣ 作用（Purpose）
该 Skill 旨在标准化 AI Agent 的代码审查行为，避免 Agent 在 review 时...
```

> 完整示例见 `examples/` 目录。
