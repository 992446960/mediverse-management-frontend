import type { UploadQueueItem } from './types'

export function removeUploadQueueItem(queue: UploadQueueItem[], uid: string): UploadQueueItem[] {
  return queue.filter((item) => item.uid !== uid)
}

export function hasUploadQueueItemMd5(queue: UploadQueueItem[], md5: string): boolean {
  return queue.some((item) => item.md5 === md5)
}

export function clearUploadQueueItems(queue: UploadQueueItem[]): UploadQueueItem[] {
  void queue
  return []
}
