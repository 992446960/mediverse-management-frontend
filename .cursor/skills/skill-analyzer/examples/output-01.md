# 示例输出

以下是对 `code-reviewer` Skill 执行 `/skill-analyzer` 后的预期输出：

---

# 📦 Skill 分析报告：code-reviewer

---

## 1️⃣ 大致内容（Overview）

这是一个代码审查类 Behavior Skill，归属 Workflow 层。它接收任意代码片段作为输入，通过四个维度（可读性、性能、安全性、规范性）进行系统化扫描，输出结构化的问题清单与改进建议。适用于 CI/CD 流水线中的 AI 代码审查节点，或开发者在编写代码后的即时质量检查场景。

---

## 2️⃣ 作用（Purpose）

该 Skill 旨在**标准化 AI Agent 的代码审查行为**，解决两个核心问题：

1. Agent 在没有约束时 review 代码往往泛泛而谈，缺乏优先级排序
2. 不同 session 中 review 风格不一致，无法作为工程流程的稳定节点

通过明确 Instructions 和 Output Format，确保每次 review 输出结构一致、可被下游工具消费。

---

## 3️⃣ 用法（Usage）

**触发方式：**

```
/review [代码块]
```

**输入：**

- `code`（必填）：待审查的代码字符串
- `language`（可选）：编程语言，默认自动识别

**调用示例：**

```
/review

def get_user(id):
    query = "SELECT * FROM users WHERE id = " + id
    return db.execute(query)
```

**预期输出：**

```
## Code Review Report

### Critical Issues
- [L2] SQL 拼接存在注入风险 → 使用参数化查询：db.execute("SELECT * FROM users WHERE id = ?", [id])

### Warnings
- [L1] 函数无类型注解 → 建议添加 def get_user(id: int) -> Optional[User]

### Suggestions
- 考虑添加用户不存在时的 None 处理逻辑
```

---

## 4️⃣ 技术结构分析（Analysis）

| 维度            | 结论                                                     |
| --------------- | -------------------------------------------------------- |
| Skill 类型      | Behavior · Workflow                                      |
| 结构完整性      | Identity ✅ · Behavior ✅ · Contract ✅                  |
| 指令质量        | 良好，4 条指令各司其职，无歧义                           |
| Contract 完整性 | input/output schema 均已定义，output 使用 array 类型合理 |

**设计亮点：**

- Instructions 第 3 条明确了排序规则（critical > warning > info），这是很多 Skill 忽略的细节，直接影响输出可读性
- output_schema 使用 `array` 类型与实际输出结构一致，Contract 与 Behavior 对齐良好
- Constraints 中限制"不修改原始代码"，明确了 Skill 的只读边界，防止 Agent 越权操作

**设计缺陷 / 改进建议：**

- `output_schema` 中 `issues` 和 `suggestions` 缺少子字段定义（如 line_number, severity, message），下游解析时无法做结构化处理 → 建议补充嵌套 schema
- `compatibility` 字段缺失，无法知道该 Skill 是否在小上下文模型中可用 → 建议补充 `context_min`
- 超过 500 行代码时的降级策略（"优先分析核心逻辑"）描述模糊 → 建议明确核心逻辑的判断标准

---

## 5️⃣ 扩展方向（Extension）

**方向 1：多文件联合审查（Multi-file Review）**
当前 Skill 仅支持单文件/单片段审查。可扩展为接收文件列表，进行跨文件的依赖关系与接口一致性检查。实现方式：在 input_schema 中新增 `files: array` 字段，并在 Instructions 中增加跨文件引用分析步骤。

**方向 2：审查规则可配置（Rule-based Review）**
当前审查维度固定（可读性/性能/安全性/规范性）。可扩展为允许调用方传入自定义规则集（如团队编码规范文档），让 Skill 基于特定规则集审查。实现方式：新增 `rules_doc` 输入字段，类型为 Reference Skill。

**方向 3：与 CI/CD 集成的 Tool Skill 封装**
将此 Behavior Skill 封装为 Tool Layer 的 Function Skill，提供标准化的 JSON 输入输出接口，使其可被 GitHub Actions、Jenkins 等 CI 工具直接调用，实现 PR 自动审查。
