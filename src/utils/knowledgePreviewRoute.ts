import type { RouteLocationNormalizedLoaded, RouteLocationNormalized } from 'vue-router'
import type { OwnerType } from '@/types/knowledge'

const PREVIEW_ROUTE_OWNER_TYPES: Partial<Record<string, OwnerType>> = {
  MyFilesPreview: 'personal',
  DeptFilesPreview: 'dept',
  OrgFilesPreview: 'org',
  AvatarFilesPreview: 'avatar',
}

export type KnowledgePreviewRouteLike = Pick<
  RouteLocationNormalizedLoaded | RouteLocationNormalized,
  'name'
>

export function getKnowledgePreviewOwnerTypeFromRoute(
  route: KnowledgePreviewRouteLike
): OwnerType | undefined {
  const name = typeof route.name === 'string' ? route.name : ''
  return PREVIEW_ROUTE_OWNER_TYPES[name]
}

export function isKnowledgePreviewRoute(route: KnowledgePreviewRouteLike): boolean {
  return getKnowledgePreviewOwnerTypeFromRoute(route) !== undefined
}
