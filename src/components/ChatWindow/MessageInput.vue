<script setup lang="ts">
import { ref, h, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sender, Attachments } from 'ant-design-x-vue'
import {
  SendOutlined,
  StopOutlined,
  PaperClipOutlined,
  GlobalOutlined,
  BulbOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { ChatMessageMode } from '@/types/chat'
import { randomUUID } from '@/utils/randomUUID'

const { t } = useI18n()

defineProps<{
  loading?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (
    e: 'send',
    content: string,
    options: { thinkingMode: ChatMessageMode; webSearch: boolean; files: File[] }
  ): void
  (e: 'stop'): void
}>()

const inputValue = ref('')
const thinkingMode = ref<ChatMessageMode>('balance')
const webSearch = ref(false)
const fileList = ref<
  Array<{ uid: string; name: string; status: string; url: string; file: File; size?: number }>
>([])

/** true=内置 Web Speech API，false=三方受控模式（需自行实现语音识别并更新 inputValue） */
const useBuiltInSpeech = ref(true)
const speechRecording = ref(false)

const allowSpeechConfig = computed(() => ({
  recording: speechRecording.value,
  onRecordingChange: (recording: boolean) => {
    speechRecording.value = recording
  },
}))

/** 禁用 Attachments 内置 Upload 的默认请求，仅标记成功（文件在 beforeUpload 中收集） */
const customUploadRequest = (options: {
  onSuccess?: (body?: unknown) => void
  onProgress?: (event: { percent: number }) => void
}) => {
  options.onProgress?.({ percent: 100 })
  options.onSuccess?.()
}

/** Attachments 多选时 beforeUpload 可能并发调用，用 nextTick 确保顺序处理 */
const attachQueue: Array<File | { originFileObj?: File; name?: string; size?: number }> = []
let attachScheduled = false

const beforeUpload = (file: File | { originFileObj?: File; name?: string; size?: number }) => {
  attachQueue.push(file)
  if (!attachScheduled) {
    attachScheduled = true
    nextTick(() => {
      attachQueue.forEach((f) => handleUpload(f))
      attachQueue.length = 0
      attachScheduled = false
    })
  }
  return false
}

const thinkingModeOptions = computed(() => [
  { value: 'deep', label: t('chat.thinkingDeep') },
  { value: 'balance', label: t('chat.thinkingBalance') },
  { value: 'fast', label: t('chat.thinkingFast') },
])

const handleSend = () => {
  if (!inputValue.value.trim() && fileList.value.length === 0) return

  emit('send', inputValue.value, {
    thinkingMode: thinkingMode.value,
    webSearch: webSearch.value,
    files: fileList.value.map((f) => f.file),
  })

  inputValue.value = ''
  fileList.value = []
}

const handleStop = () => {
  emit('stop')
}

defineExpose({
  inputValue,
  fileList,
})

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_DOC_SIZE = 20 * 1024 * 1024
const MAX_FILES = 5

/** 从 File 或 Upload 包装对象中提取 name、size */
function getFileInfo(file: File | { originFileObj?: File; name?: string; size?: number }): {
  name: string
  size: number
} {
  if (file instanceof File) return { name: file.name, size: file.size }
  const raw = (file as { originFileObj?: File }).originFileObj
  if (raw instanceof File) return { name: raw.name, size: raw.size }
  const o = file as { name?: string; size?: number }
  return { name: o.name ?? '', size: o.size ?? 0 }
}

/** 是否已存在相同文件（按 name + size 去重） */
function isDuplicate(file: File | { originFileObj?: File; name?: string; size?: number }): boolean {
  const { name, size } = getFileInfo(file)
  return fileList.value.some((f) => f.name === name && f.size === size)
}

type FormattedFileItem = {
  uid: string
  name: string
  status: string
  url: string
  file: File
  size?: number
}

/**
 * 校验文件并返回格式化后的 item，校验失败返回 null 并弹出提示。
 * 回形针（onFileChange）与加号（handleAttachmentsChange）共用此逻辑，确保去重等规则一致。
 */
function validateAndFormatFile(
  file: File | { originFileObj?: File; name?: string; size?: number }
): FormattedFileItem | null {
  const { name: fileName, size: fileSize } = getFileInfo(file)
  const rawFile = file instanceof File ? file : (file as { originFileObj?: File }).originFileObj

  if (fileList.value.length >= MAX_FILES) {
    message.warning(t('chat.attachmentMaxCount', { max: MAX_FILES }))
    return null
  }
  if (isDuplicate(file)) {
    message.warning(t('chat.attachmentDuplicate', { name: fileName }))
    return null
  }
  if (!rawFile || !(rawFile instanceof File)) return null

  const isImage = ALLOWED_IMAGE_TYPES.includes(rawFile.type)
  const isDoc = ALLOWED_DOC_TYPES.includes(rawFile.type)

  if (!isImage && !isDoc) {
    message.warning(t('chat.attachmentFormatInvalid', { name: fileName }))
    return null
  }
  if (isImage && fileSize > MAX_IMAGE_SIZE) {
    message.warning(t('chat.attachmentSizeExceeded', { name: fileName }))
    return null
  }
  if (isDoc && fileSize > MAX_DOC_SIZE) {
    message.warning(t('chat.attachmentSizeExceeded', { name: fileName }))
    return null
  }

  return {
    uid: randomUUID(),
    name: fileName,
    status: 'done',
    url: isImage ? URL.createObjectURL(rawFile) : '',
    file: rawFile,
    size: fileSize,
  }
}

const handleUpload = (
  file: File | { originFileObj?: File; name?: string; size?: number }
): boolean => {
  const item = validateAndFormatFile(file)
  if (item) {
    fileList.value.push(item)
    return true
  }
  return false
}

/**
 * 同步 Attachments 的变更。
 * - 删除：列表变短时，直接同步。
 * - 添加（点击加号）：ant-design-vue Upload 在 beforeUpload 返回 false 时仍会把文件加入 fileList 并触发 onChange，
 *   因此需在此对新增文件做 validateAndFormatFile 校验，过滤掉重复/非法文件，实现与回形针一致的拦截。
 */
const handleAttachmentsChange = (info: {
  fileList: Array<{
    uid: string
    name?: string
    status?: string
    originFileObj?: File
    file?: File
    url?: string
    size?: number
  }>
}) => {
  const prev = fileList.value

  if (info.fileList.length < prev.length) {
    // 删除操作：直接同步
    fileList.value = info.fileList.map((f) => {
      const existing = prev.find((e) => e.uid === f.uid)
      const rawFile = (f as { file?: File }).file ?? f.originFileObj ?? existing?.file
      const isImage = rawFile && ALLOWED_IMAGE_TYPES.includes(rawFile.type)
      return {
        uid: f.uid,
        name: f.name ?? existing?.name ?? '',
        status: (f.status as string) ?? 'done',
        url:
          (f as { url?: string }).url ??
          existing?.url ??
          (rawFile && isImage ? URL.createObjectURL(rawFile) : ''),
        file: (rawFile ?? existing?.file) as File,
        size: rawFile?.size ?? (f as { size?: number }).size ?? existing?.size,
      }
    })
    return
  }

  if (info.fileList.length > prev.length) {
    // 添加操作（来自加号）：Upload 在 beforeUpload 返回 false 时仍会把文件加入 fileList，
    // 需对新增文件做校验并过滤，只保留通过校验的
    const prevUids = new Set(prev.map((p) => p.uid))
    const batchSeen = new Set<string>()
    const validNewItems: FormattedFileItem[] = []

    for (const f of info.fileList) {
      if (prevUids.has(f.uid)) continue // 已有文件，保留在 prev 中
      const fileInput = (f as { file?: File }).file ?? f.originFileObj ?? f
      const { name, size } = getFileInfo(fileInput)
      const key = `${name}:${size}`
      if (batchSeen.has(key) || isDuplicate(fileInput)) {
        continue
      }
      batchSeen.add(key)
      const item = validateAndFormatFile(fileInput)
      if (item) validNewItems.push(item)
    }

    fileList.value = [...prev, ...validNewItems]
  }
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files) return
  const files = Array.from(target.files)
  const batchSeen = new Set<string>()
  files.forEach((file) => {
    const { name, size } = getFileInfo(file)
    const key = `${name}:${size}`
    if (batchSeen.has(key) || isDuplicate(file)) {
      message.warning(t('chat.attachmentDuplicate', { name }))
      return
    }
    batchSeen.add(key)
    handleUpload(file)
  })
  target.value = ''
}
</script>

<template>
  <div class="message-input p-4 border-t border-gray-100 dark:border-gray-800">
    <!-- Attachments Preview -->
    <Attachments
      v-if="fileList.length > 0"
      :items="fileList"
      :multiple="true"
      :max-count="MAX_FILES"
      accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/msword,text/plain,.docx"
      :custom-request="customUploadRequest"
      :before-upload="beforeUpload"
      class="mb-2"
      @change="handleAttachmentsChange"
    />

    <!-- 模式选择 + 联网开关：附件展示区下方、输入框上方 -->
    <div class="message-input-toolbar flex items-center gap-3 px-1 py-2">
      <div class="flex items-center gap-1.5">
        <BulbOutlined class="text-sm text-gray-400" />
        <a-select
          v-model:value="thinkingMode"
          size="small"
          :options="thinkingModeOptions"
          :bordered="true"
          style="font-size: 12px"
        />
      </div>
      <div
        class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs cursor-pointer select-none transition-all border border-gray-200 dark:border-gray-700"
        :style="
          webSearch
            ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }
            : { color: 'var(--color-text-tertiary)' }
        "
        :class="webSearch ? 'border' : ''"
        @click="webSearch = !webSearch"
      >
        <GlobalOutlined />
        <span>{{ webSearch ? t('chat.webSearchOn') : t('chat.webSearchOff') }}</span>
      </div>
    </div>

    <!-- Sender 使用组件库自带聚焦效果（蓝色描边 + 阴影），不做覆盖 -->
    <Sender
      v-model:value="inputValue"
      :loading="loading"
      :disabled="disabled"
      :placeholder="t('chat.inputPlaceholder')"
      :allow-speech="useBuiltInSpeech ? true : allowSpeechConfig"
      @submit="handleSend"
      @cancel="handleStop"
    >
      <!-- Prefix Slot: Attachment -->
      <template #prefix>
        <!-- @mousedown.stop 阻止事件冒泡到 Sender 的 content div，避免其 onMousedown 对非 textarea 调用 preventDefault 导致 file input 无法打开选择框 -->
        <div class="relative inline-block mr-1" @mousedown.stop>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/msword,text/plain,.docx"
            class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            @change="onFileChange"
          />
          <a-tooltip :title="t('chat.attachFile')">
            <a-button type="text" size="small" :icon="h(PaperClipOutlined)" />
          </a-tooltip>
        </div>
      </template>

      <!-- Submit Button -->
      <template #submitButton>
        <a-button
          type="primary"
          shape="circle"
          :icon="loading ? h(StopOutlined) : h(SendOutlined)"
          @click="loading ? handleStop() : handleSend()"
        />
      </template>
    </Sender>
  </div>
</template>

<style scoped>
.message-input {
  background: var(--color-bg-container);
}

.message-input :deep(.ant-sender) {
  border-radius: 12px;
}

/* 不覆盖 .ant-sender 的 box-shadow / border，保留组件库自带的 :focus-within 蓝色描边与阴影 */
.message-input :deep(.ant-sender textarea),
.message-input :deep(.ant-sender input) {
  outline: none;
}
</style>
