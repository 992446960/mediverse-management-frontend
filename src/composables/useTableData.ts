import { ref, reactive, onMounted } from 'vue'
import type { Ref } from 'vue'
import type { PaginationParams, PaginatedData } from '@/types/api'

export interface UseTableDataOptions<T, P extends PaginationParams> {
  fetchFn: (params: P) => Promise<PaginatedData<T>>
  defaultParams?: Partial<P>
  immediate?: boolean
}

export interface UseTableDataReturn<T, P extends PaginationParams> {
  data: Ref<T[]>
  loading: Ref<boolean>
  pagination: { current: number; pageSize: number; total: number }
  searchParams: Ref<Partial<P>>
  loadData: () => Promise<void>
  handleTableChange: (pag: { current: number; pageSize: number }) => void
  handleSearch: (params?: Partial<P>) => void
  refresh: () => void
}

export function useTableData<T, P extends PaginationParams = PaginationParams>(
  options: UseTableDataOptions<T, P>
): UseTableDataReturn<T, P> {
  const { fetchFn, defaultParams = {}, immediate = true } = options

  const data = ref<T[]>([]) as Ref<T[]>
  const loading = ref(false)
  const pagination = reactive({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const searchParams = ref<Partial<P>>({ ...defaultParams }) as Ref<Partial<P>>

  const loadData = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...searchParams.value,
      } as P
      const result = await fetchFn(params)
      data.value = result.items
      pagination.total = result.total
    } finally {
      loading.value = false
    }
  }

  const handleTableChange = (pag: { current: number; pageSize: number }) => {
    pagination.current = pag.current
    pagination.pageSize = pag.pageSize
    loadData()
  }

  const handleSearch = (params?: Partial<P>) => {
    if (params !== undefined) {
      searchParams.value = { ...searchParams.value, ...params }
    }
    pagination.current = 1
    loadData()
  }

  const refresh = () => loadData()

  if (immediate) {
    onMounted(loadData)
  }

  return {
    data,
    loading,
    pagination,
    searchParams,
    loadData,
    handleTableChange,
    handleSearch,
    refresh,
  }
}
