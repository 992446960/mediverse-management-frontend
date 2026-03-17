import { onUnmounted } from 'vue'
import type { Ref } from 'vue'
import type { FileListItem, OwnerType } from '@/types/knowledge'
import { getFileStatus } from '@/api/knowledge'

export function useFileStatusPoll(
  ownerType: OwnerType,
  ownerId: string,
  fileList: Ref<FileListItem[]>
) {
  let timer: ReturnType<typeof setInterval> | null = null

  const startPoll = () => {
    if (timer) return
    timer = setInterval(async () => {
      // 找出所有非终态的文件 ID
      const activeIds = fileList.value
        .filter((f) => f.status !== 'done' && f.status !== 'failed')
        .map((f) => f.id)

      if (activeIds.length === 0) {
        stopPoll()
        return
      }

      // 串行或并发请求状态（这里简单处理，只请求当前列表中的）
      for (const id of activeIds) {
        try {
          const res = await getFileStatus(ownerType, ownerId, id)
          // 更新列表中的状态
          const file = fileList.value.find((f) => f.id === id)
          if (file && file.status !== res.status) {
            file.status = res.status
            file.error_msg = res.error_msg
          }
        } catch (error) {
          console.error(`Failed to poll status for file ${id}:`, error)
        }
      }
    }, 30_000)
  }

  const stopPoll = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onUnmounted(() => {
    stopPoll()
  })

  return {
    startPoll,
    stopPoll,
  }
}
