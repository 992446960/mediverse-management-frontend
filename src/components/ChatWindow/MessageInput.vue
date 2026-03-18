<script setup lang="ts">
import { ref, h, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sender, Attachments } from 'ant-design-x-vue'
import {
  SendOutlined,
  StopOutlined,
  PaperClipOutlined,
  GlobalOutlined,
  BulbOutlined,
} from '@ant-design/icons-vue'

const { t } = useI18n()

defineProps<{
  loading?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (
    e: 'send',
    content: string,
    options: { thinkingMode: string; webSearch: boolean; files: File[] }
  ): void
  (e: 'stop'): void
}>()

const inputValue = ref('')
const thinkingMode = ref('medium')
const webSearch = ref(false)
const fileList = ref<Array<{ uid: number; name: string; status: string; url: string; file: File }>>(
  []
)
const speechRecording = ref(false)

const thinkingModeOptions = computed(() => [
  { value: 'high', label: t('chat.thinkingDeep') },
  { value: 'medium', label: t('chat.thinkingBalance') },
  { value: 'low', label: t('chat.thinkingFast') },
])

const allowSpeechConfig = computed(() => ({
  recording: speechRecording.value,
  onRecordingChange: (recording: boolean) => {
    speechRecording.value = recording
  },
}))

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

const handleUpload = (file: File): boolean => {
  if (fileList.value.length >= MAX_FILES) return false

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isDoc = ALLOWED_DOC_TYPES.includes(file.type)

  if (!isImage && !isDoc) return false
  if (isImage && file.size > MAX_IMAGE_SIZE) return false
  if (isDoc && file.size > MAX_DOC_SIZE) return false

  fileList.value.push({
    uid: Date.now(),
    name: file.name,
    status: 'done',
    url: isImage ? URL.createObjectURL(file) : '',
    file,
  })
  return false
}

const handleRemoveFile = (file: { uid: number }) => {
  fileList.value = fileList.value.filter((f) => f.uid !== file.uid)
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    Array.from(target.files).forEach(handleUpload)
    target.value = ''
  }
}
</script>

<template>
  <div
    class="message-input p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
  >
    <!-- Attachments Preview -->
    <Attachments
      v-if="fileList.length > 0"
      :items="fileList"
      class="mb-2"
      @remove="handleRemoveFile"
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
      :allow-speech="allowSpeechConfig"
      @submit="handleSend"
      @cancel="handleStop"
    >
      <!-- Prefix Slot: Attachment -->
      <template #prefix>
        <div class="relative inline-block mr-1">
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
.message-input :deep(.ant-sender) {
  border-radius: 12px;
}

/* 不覆盖 .ant-sender 的 box-shadow / border，保留组件库自带的 :focus-within 蓝色描边与阴影 */
.message-input :deep(.ant-sender textarea),
.message-input :deep(.ant-sender input) {
  outline: none;
}
</style>
