// 通用 API 响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 分页数据结构
export interface PaginatedData<T> {
  total: number
  page: number
  page_size: number
  items: T[]
}

// 分页请求参数
export interface PaginationParams {
  page?: number
  page_size?: number
  keyword?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
