import { describe, expect, it } from 'vitest'
import type { UploadQueueItem } from '../../src/components/FileUploader/types'
import {
  clearUploadQueueItems,
  removeUploadQueueItem,
} from '../../src/components/FileUploader/queue'

function queueItem(uid: string, status: UploadQueueItem['status']): UploadQueueItem {
  return {
    uid,
    file: new File(['content'], `${uid}.txt`),
    fileName: `${uid}.txt`,
    status,
    percent: 0,
  }
}

describe('upload queue helpers', () => {
  it('removes local queue item in any status', () => {
    const queue = [
      queueItem('pending-item', 'pending'),
      queueItem('uploading-item', 'uploading'),
      queueItem('success-item', 'success'),
      queueItem('fail-item', 'fail'),
    ]

    expect(removeUploadQueueItem(queue, 'pending-item').map((item) => item.uid)).toEqual([
      'uploading-item',
      'success-item',
      'fail-item',
    ])
    expect(removeUploadQueueItem(queue, 'uploading-item').map((item) => item.uid)).toEqual([
      'pending-item',
      'success-item',
      'fail-item',
    ])
    expect(removeUploadQueueItem(queue, 'success-item').map((item) => item.uid)).toEqual([
      'pending-item',
      'uploading-item',
      'fail-item',
    ])
    expect(removeUploadQueueItem(queue, 'fail-item').map((item) => item.uid)).toEqual([
      'pending-item',
      'uploading-item',
      'success-item',
    ])
  })

  it('clears all local queue items', () => {
    const queue = [
      queueItem('pending-item', 'pending'),
      queueItem('uploading-item', 'uploading'),
      queueItem('success-item', 'success'),
      queueItem('fail-item', 'fail'),
    ]

    expect(clearUploadQueueItems(queue)).toEqual([])
  })
})
