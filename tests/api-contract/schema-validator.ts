/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OpenAPI Schema 校验工具
 *
 * 从线上 /openapi.json 拉取完整规范，
 * 提供 assertMatchesSchema() 按 operationId 校验实际响应。
 */
import Ajv, { type ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import axios from 'axios'

// ─── OpenAPI 规范缓存 ─────────────────────────────────────────

let _spec: Record<string, any> | null = null

export async function loadSpec(): Promise<Record<string, any>> {
  if (_spec) return _spec
  const specUrl = (process.env.API_BASE_URL ?? '').replace(/\/api\/v1\/?$/, '') + '/openapi.json'
  const res = await axios.get(specUrl, { timeout: 10_000 })
  _spec = res.data
  return _spec
}

// ─── $ref 解析 ────────────────────────────────────────────────

function resolveRef(spec: Record<string, any>, ref: string): Record<string, any> {
  const parts = ref.replace(/^#\//, '').split('/')
  let node: any = spec
  for (const p of parts) {
    node = node?.[p]
    if (node === undefined) throw new Error(`无法解析 $ref: ${ref}`)
  }
  return node
}

/** 递归展开 $ref，返回纯 JSON Schema（ajv 可直接使用） */
function deepResolve(
  spec: Record<string, any>,
  schema: Record<string, any>,
  seen = new Set<string>()
): Record<string, any> {
  if (schema.$ref) {
    if (seen.has(schema.$ref)) return {} // 防止循环引用
    seen.add(schema.$ref)
    return deepResolve(spec, resolveRef(spec, schema.$ref), seen)
  }

  const resolved: Record<string, any> = { ...schema }

  if (resolved.properties) {
    resolved.properties = Object.fromEntries(
      Object.entries(resolved.properties).map(([k, v]) => [
        k,
        deepResolve(spec, v as Record<string, any>, new Set(seen)),
      ])
    )
  }

  if (resolved.items) {
    resolved.items = deepResolve(spec, resolved.items, new Set(seen))
  }

  if (resolved.anyOf) {
    resolved.anyOf = (resolved.anyOf as Record<string, any>[]).map((s) =>
      deepResolve(spec, s, new Set(seen))
    )
  }

  if (resolved.oneOf) {
    resolved.oneOf = (resolved.oneOf as Record<string, any>[]).map((s) =>
      deepResolve(spec, s, new Set(seen))
    )
  }

  if (resolved.allOf) {
    resolved.allOf = (resolved.allOf as Record<string, any>[]).map((s) =>
      deepResolve(spec, s, new Set(seen))
    )
  }

  if (resolved.additionalProperties && typeof resolved.additionalProperties === 'object') {
    resolved.additionalProperties = deepResolve(spec, resolved.additionalProperties, new Set(seen))
  }

  return resolved
}

// ─── 按 operationId 查找 response schema ──────────────────────

function findResponseSchema(
  spec: Record<string, any>,
  operationId: string
): Record<string, any> | null {
  for (const [, methods] of Object.entries(spec.paths ?? {})) {
    for (const [, op] of Object.entries(methods as Record<string, any>)) {
      if (typeof op !== 'object' || !op.operationId) continue
      if (op.operationId === operationId) {
        const content200 = op.responses?.['200']?.content?.['application/json']
        if (content200?.schema) {
          return deepResolve(spec, content200.schema)
        }
        return null
      }
    }
  }
  return null
}

// ─── AJV 实例 ────────────────────────────────────────────────

let _ajv: Ajv | null = null

function getAjv(): Ajv {
  if (!_ajv) {
    _ajv = new Ajv({
      allErrors: true,
      strict: false,
      // OpenAPI 3.1 使用 type 数组与 nullable 混用
      allowUnionTypes: true,
    })
    addFormats(_ajv)
  }
  return _ajv
}

// ─── 公共断言方法 ──────────────────────────────────────────────

const validatorCache = new Map<string, ValidateFunction>()

/**
 * 断言 `data` 符合 OpenAPI 中 operationId 对应的 200 响应 schema。
 * 抛出的异常会被 Vitest 捕获并打印详细校验错误。
 */
export async function assertMatchesSchema(operationId: string, data: unknown): Promise<void> {
  const spec = await loadSpec()

  let validate = validatorCache.get(operationId)
  if (!validate) {
    const schema = findResponseSchema(spec, operationId)
    if (!schema) {
      throw new Error(`在 OpenAPI 规范中找不到 operationId="${operationId}" 的 200 响应 schema`)
    }
    validate = getAjv().compile(schema)
    validatorCache.set(operationId, validate)
  }

  const valid = validate(data)
  if (!valid) {
    const errors = validate.errors
      ?.map((e) => `  ${e.instancePath || '/'} ${e.message} (${JSON.stringify(e.params)})`)
      .join('\n')
    throw new Error(
      `响应不符合 OpenAPI Schema [${operationId}]:\n${errors}\n\n实际数据:\n${JSON.stringify(data, null, 2).slice(0, 2000)}`
    )
  }
}

// ─── 通用结构断言 ──────────────────────────────────────────────

/** 断言 BaseResponse 成功结构：code===0, message 为字符串, data 存在 */
export function assertBaseResponseOk(body: Record<string, any>): void {
  if (typeof body.code !== 'number') throw new Error(`code 应为 number, 实际: ${typeof body.code}`)
  if (body.code !== 0) throw new Error(`code 应为 0, 实际: ${body.code}, message: ${body.message}`)
  if (typeof body.message !== 'string')
    throw new Error(`message 应为 string, 实际: ${typeof body.message}`)
  if (!('data' in body)) throw new Error('响应缺少 data 字段')
}

/** 断言分页结构完整性 */
export function assertPaginatedData(data: Record<string, any>): void {
  if (!Array.isArray(data.items)) throw new Error('data.items 应为数组')
  if (typeof data.total !== 'number' && typeof data.page !== 'number') {
    // 有的列表只有 items 没有分页字段，跳过
    return
  }
  for (const field of ['total', 'page', 'page_size'] as const) {
    if (field in data && typeof data[field] !== 'number') {
      throw new Error(`data.${field} 应为 number`)
    }
  }
}

/** 断言字符串为 UUID v4 格式 */
export function assertUUID(value: unknown, label = 'value'): void {
  if (typeof value !== 'string') throw new Error(`${label} 应为 string, 实际: ${typeof value}`)
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRe.test(value)) throw new Error(`${label} 不是合法 UUID: ${value}`)
}

/** 断言字符串为 ISO 8601 日期时间 */
export function assertDatetime(value: unknown, label = 'value'): void {
  if (typeof value !== 'string') throw new Error(`${label} 应为 string, 实际: ${typeof value}`)
  if (Number.isNaN(Date.parse(value))) throw new Error(`${label} 不是合法日期时间: ${value}`)
}
