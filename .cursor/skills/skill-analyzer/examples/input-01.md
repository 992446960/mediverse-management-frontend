# 示例输入

用户在 Agent 中输入以下内容触发 skill-analyzer：

````
/skill-analyzer

---
name: code-reviewer
version: 1.0.0
type: behavior
layer: workflow
description: "对代码片段进行结构化审查，输出问题清单与改进建议"
author: alice
tags: [code, review, quality]
created: 2025-01-01

input_schema:
  - name: code
    type: string
    required: true
    description: "待审查的代码内容"
  - name: language
    type: string
    required: false
    description: "编程语言（可选，默认自动识别）"

output_schema:
  - name: issues
    type: array
    description: "问题清单"
  - name: suggestions
    type: array
    description: "改进建议"
---

# Code Reviewer

## Purpose
对任意代码片段进行系统化审查，覆盖：可读性、性能、安全性、规范性四个维度。

## Activation
用户发送 /review + 代码块时激活。

## Instructions
1. 识别代码语言和上下文
2. 逐行扫描，标注问题类型（bug / style / performance / security）
3. 按严重程度排序输出（critical > warning > info）
4. 给出每个问题的修改建议

## Output Format
​```
## Code Review Report

### Critical Issues
- [行号] {问题描述} → {建议}

### Warnings
- [行号] {问题描述} → {建议}

### Suggestions
- {优化建议}
​```

## Constraints
- ❌ 不修改原始代码，只分析
- ⚠️ 超过500行代码时，优先分析核心逻辑部分
````
