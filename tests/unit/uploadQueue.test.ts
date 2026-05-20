import { describe, expect, it } from 'vitest'
import type { UploadQueueItem } from '../../src/components/FileUploader/types'
import {
  clearUploadQueueItems,
  hasUploadQueueItemMd5,
  removeUploadQueueItem,
} from '../../src/components/FileUploader/queue'

function queueItem(uid: string, status: UploadQueueItem['status']): UploadQueueItem {
  return {
    uid,
    md5: uid,
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

  it('checks duplicate queue items by file md5', () => {
    const queue = [queueItem('5d41402abc4b2a76b9719d911017c592', 'pending')]

    expect(hasUploadQueueItemMd5(queue, '5d41402abc4b2a76b9719d911017c592')).toBe(true)
    expect(hasUploadQueueItemMd5(queue, '7d793037a0760186574b0282f2f435e7')).toBe(false)
  })
})
