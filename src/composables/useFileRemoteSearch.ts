import type { Ref } from 'vue'
import type { OwnerType } from '@/types/knowledge'
import { getFileList } from '@/api/knowledge'

export function useFileRemoteSearch(
  ownerType: Ref<OwnerType> | OwnerType,
  ownerId: Ref<string> | string,
  pageSize = 50
) {
  const options = ref<Array<{ label: string; value: string }>>([])
  const loading = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  const ot = () => (typeof ownerType === 'string' ? ownerType : ownerType.value)
  const oi = () => (typeof ownerId === 'string' ? ownerId : ownerId.value)

  async function loadDefault() {
    loading.value = true
    try {
      const { items } = await getFileList(ot(), oi(), { page: 1, page_size: pageSize })
      options.value = items.map((f) => ({ label: f.file_name, value: f.id }))
    } finally {
      loading.value = false
    }
  }

  function search(keyword: string) {
    if (timer) clearTimeout(timer)
    if (!keyword) {
      loadDefault()
      return
    }
    timer = setTimeout(async () => {
      loading.value = true
      try {
        const { items } = await getFileList(ot(), oi(), {
          page: 1,
          page_size: pageSize,
          keyword,
        })
        options.value = items.map((f) => ({ label: f.file_name, value: f.id }))
      } finally {
        loading.value = false
      }
    }, 300)
  }

  onUnmounted(() => {
    if (timer) clearTimeout(timer)
  })

  return { options, loading, loadDefault, search }
}
