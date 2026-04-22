/**
 * 知识库与聊天共用的「业务文档」扩展名白名单（含知识库额外支持的文本数据格式）。
 * 与 {@link KNOWLEDGE_FILE_ACCEPT} 字符串保持一致，供校验逻辑引用。
 */
export const KNOWLEDGE_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.pptx',
  '.txt',
  '.md',
  '.xlsx',
  '.csv',
  '.json',
  '.jsonl',
] as const

/** 知识库拖拽上传默认 accept（含 csv / json / jsonl） */
export const KNOWLEDGE_FILE_ACCEPT = KNOWLEDGE_DOCUMENT_EXTENSIONS.join(',')

const CHAT_DOCUMENT_EXT_SET = new Set<string>([
  '.pdf',
  '.doc',
  '.docx',
  '.pptx',
  '.txt',
  '.md',
  '.xlsx',
])

const CHAT_DOCUMENT_MIME_SET = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
])

export function getFileLowerExtension(fileName: string): string {
  const i = fileName.lastIndexOf('.')
  return i >= 0 ? fileName.slice(i).toLowerCase() : ''
}

/** 聊天附件：是否为允许的文档类型（扩展名优先，兼容 MIME 或空 type） */
export function isChatDocumentAttachment(file: File): boolean {
  const ext = getFileLowerExtension(file.name)
  if (CHAT_DOCUMENT_EXT_SET.has(ext)) return true
  if (file.type && CHAT_DOCUMENT_MIME_SET.has(file.type)) return true
  return false
}

const CHAT_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

/** 聊天回形针 / Attachments：input accept 与 ant Upload accept 共用 */
export const CHAT_ATTACHMENT_ACCEPT = [
  ...CHAT_IMAGE_MIMES,
  ...CHAT_DOCUMENT_MIME_SET,
  '.pdf',
  '.docx',
  '.doc',
  '.pptx',
  '.xlsx',
  '.txt',
  '.md',
].join(',')
