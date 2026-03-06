import { Modal } from 'ant-design-vue'

export interface ConfirmDeleteOptions {
  /** 标题（建议调用方使用 t() 传入） */
  title?: string
  /** 内容（建议调用方使用 t() 传入） */
  content?: string
  okText?: string
  cancelText?: string
  onOk?: () => Promise<void> | void
}

export function confirmDelete(options: ConfirmDeleteOptions): void {
  const {
    title = '确认删除',
    content = '删除后不可恢复，是否继续？',
    okText = '删除',
    cancelText = '取消',
    onOk,
  } = options

  Modal.confirm({
    title,
    content,
    okText,
    cancelText,
    okType: 'danger',
    centered: true,
    onOk: async () => {
      await onOk?.()
    },
  })
}
