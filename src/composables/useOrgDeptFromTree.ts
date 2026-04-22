import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { OrgDeptTreeNode } from '@/types/department'
import type { Organization } from '@/types/organization'
import type { Department } from '@/types/department'

/** 树数据（与 GET /departments/tree 一致，模块级单例） */
const treeRef = ref<OrgDeptTreeNode[]>([])

/**
 * 基于机构目录树 GET /api/v1/departments/tree 的机构/科室数据源。
 * 左侧筛选树与新增/编辑下拉共用此数据，按登录返回的 org_id/dept_id 与角色做清洗。
 * 仅重新进入路由或刷新后重新拉树并 setTree。
 */
export function useOrgDeptFromTree() {
  const authStore = useAuthStore()

  /** 从树解析出的机构列表（id + name，供下拉用） */
  const orgListFromTree = computed((): Pick<Organization, 'id' | 'name'>[] => {
    const tree = treeRef.value
    return tree.filter((n) => n.type === 'org').map((n) => ({ id: n.id, name: n.name }))
  })

  /** 从树解析出的 机构ID -> 科室列表（id + name + org_id，供下拉用） */
  const deptMapFromTree = computed(
    (): Map<string, Pick<Department, 'id' | 'name' | 'org_id'>[]> => {
      const tree = treeRef.value
      const map = new Map<string, Pick<Department, 'id' | 'name' | 'org_id'>[]>()
      tree
        .filter((n) => n.type === 'org')
        .forEach((org) => {
          const depts = (org.children ?? []).map((d) => ({
            id: d.id,
            name: d.name,
            org_id: org.id,
          }))
          map.set(org.id, depts)
        })
      return map
    }
  )

  /** 按角色返回可选的机构列表（登录 org_id/dept_id 清洗），仅含 id/name 供下拉用 */
  function getOrgOptions(): Promise<Organization[]> {
    const list = orgListFromTree.value
    let result = list
    if (!authStore.isSysAdmin && authStore.currentOrgId) {
      result = list.filter((o) => o.id === authStore.currentOrgId)
    } else if (!authStore.isSysAdmin) {
      result = []
    }
    return Promise.resolve(result as Organization[])
  }

  /** 按机构返回可选的科室列表；未选机构时返回空；科室管理员仅返回当前科室 */
  function getDeptOptions(orgId: string): Promise<Department[]> {
    if (!orgId) return Promise.resolve([])
    const depts = deptMapFromTree.value.get(orgId) ?? []
    const result =
      authStore.isDeptAdmin && authStore.currentDeptId
        ? depts.filter((d) => d.id === authStore.currentDeptId)
        : depts
    return Promise.resolve(result as Department[])
  }

  function setTree(tree: OrgDeptTreeNode[]) {
    treeRef.value = tree
  }

  function clearCache() {
    treeRef.value = []
  }

  return {
    getOrgOptions,
    getDeptOptions,
    setTree,
    clearCache,
  }
}
