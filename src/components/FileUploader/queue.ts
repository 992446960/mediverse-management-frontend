import type { UploadQueueItem } from './types'

export function removeUploadQueueItem(queue: UploadQueueItem[], uid: string): UploadQueueItem[] {
  return queue.filter((item) => item.uid !== uid)
}

export function clearUploadQueueItems(queue: UploadQueueItem[]): UploadQueueItem[] {
  void queue
  return []
}
