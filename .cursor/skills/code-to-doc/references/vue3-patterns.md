# Vue3 Composition API 常用模式说明

此文档用于辅助 Agent 理解 Vue3 Composition API 的常见模式，在阅读源码和生成文档时作为参考。

---

## 响应式状态模式

### `ref` vs `reactive`
- `ref(value)` — 用于基本类型或需要整体替换的对象；访问值需要 `.value`
- `reactive(object)` — 用于复杂对象，直接访问属性；但不能整体替换
- 文档中描述时：说明"这是一个响应式变量，初始值为 X，表示 Y"

### `computed`
- 有 getter 的计算属性：`const x = computed(() => ...)`
- 有 getter+setter：`const x = computed({ get: ..., set: ... })`
- 文档中描述时：说明"派生自 A 和 B，当 A 或 B 变化时自动重新计算，结果为 Z"

### `watch` vs `watchEffect`
- `watch(source, callback)` — 显式监听特定源，懒执行
- `watchEffect(fn)` — 自动追踪依赖，立即执行
- 文档中描述时：说明"监听 X 变化，当 X 从 A 变为 B 时，执行操作 C"

---

## 生命周期钩子对应关系

| Vue2 Options API | Vue3 Composition API | 执行时机 |
|---|---|---|
| `created` | `setup()` 函数体 | 组件实例创建后，DOM 未挂载 |
| `mounted` | `onMounted` | DOM 挂载完成 |
| `updated` | `onUpdated` | 数据更新、DOM 重新渲染后 |
| `beforeUnmount` / `beforeDestroy` | `onBeforeUnmount` | 组件卸载前 |
| `unmounted` / `destroyed` | `onUnmounted` | 组件卸载后（清理副作用） |

---

## 常见 Composable 模式

### 数据获取 Composable
```
useXxxList() 通常返回：
- list: 列表数据
- loading: 加载状态
- pagination: 分页信息
- fetchList(params): 请求方法
- refresh(): 刷新当前页
```

### 表单 Composable
```
useXxxForm() 通常返回：
- formData: 表单对象
- formRef: 表单 ref
- rules: 校验规则
- submitForm(): 提交
- resetForm(): 重置
```

---

## `defineProps` 与 `withDefaults`

```
// 带默认值的 props 定义模式
// 文档中描述为：组件接受以下 props，并具有对应默认值
```

---

## `defineEmits` 模式

```
// emit 定义模式
// 文档中描述为：组件可向父组件发送以下事件
```

---

## `defineExpose` 模式

如果组件暴露了方法/属性给父组件通过 ref 调用，文档中需要特别说明：
- 暴露的方法名
- 调用时机与用途
- 参数和返回值

---

## 常见异步处理模式

### 请求 + Loading + 错误处理
```
执行步骤：
1. 将 loading 状态设为 true
2. 调用接口，等待返回
3. 成功时：更新数据状态，关闭 loading
4. 失败时：显示错误提示，关闭 loading（finally 块）
```

### 防抖处理
```
如果方法被防抖包裹：
- 说明防抖延迟时间
- 说明哪些高频操作（如搜索输入）使用了防抖
```

---

## provide / inject 模式

如果组件使用了 `provide` / `inject`：
- 文档中说明：向子孙组件提供了什么数据/方法
- 或者：从祖先组件注入了什么数据/方法
- 以及注入数据的用途

---

## Pinia Store 使用模式

```
const xxxStore = useXxxStore()

常见用法：
- 读取 store.someState
- 调用 store.someAction()
- 使用 storeToRefs(xxxStore) 解构响应式数据
```

文档中需说明：
- 依赖哪个 store
- 读取了哪些状态（及其含义）
- 调用了哪些 action（及触发时机）
- 是否修改了 store 状态