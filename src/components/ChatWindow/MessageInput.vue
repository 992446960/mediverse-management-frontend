<template>
  <div class="border-t border-gray-200 dark:border-gray-700 p-4">
    <Sender
      v-model:value="inputValue"
      :placeholder="placeholder"
      :loading="loading"
      :disabled="disabled"
      allow-speech
      @submit="handleSubmit"
    >
      <template #header>
        <div class="flex items-center gap-4 px-2 py-1 text-sm text-gray-500">
          <!-- Thinking Mode -->
          <div class="flex items-center gap-2">
            <span>思考模式:</span>
            <Select
              v-model:value="thinkingMode"
              size="small"
              style="width: 100px"
              :options="thinkingOptions"
            />
          </div>

          <!-- Web Search -->
          <div class="flex items-center gap-2">
            <span>联网搜索:</span>
            <Switch v-model:checked="webSearch" size="small" />
          </div>

          <!-- Attachments -->
          <Upload
            :before-upload="handleBeforeUpload"
            :show-upload-list="false"
            accept=".jpg,.png,.webp,.pdf,.docx"
          >
            <Button type="text" size="small">
              <template #icon><PaperClipOutlined /></template>
              添加附件
            </Button>
          </Upload>
        </div>
      </template>

      <!-- Custom submit button when streaming -->
      <template #submitButton>
        <Button v-if="streaming" type="primary" danger shape="circle" @click="handleStop">
          <template #icon><StopOutlined /></template>
        </Button>
        <Button
          v-else
          type="primary"
          shape="circle"
          :disabled="!inputValue.trim() && attachments.length === 0"
          @click="handleSubmit"
        >
          <template #icon><SendOutlined /></template>
        </Button>
      </template>
    </Sender>

    <!-- Attachments Preview -->
    <div v-if="attachments.length > 0" class="mt-2 flex flex-wrap gap-2">
      <div v-for="(file, index) in attachments" :key="index" class="relative group">
        <div
          class="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs flex items-center gap-1 border border-gray-200 dark:border-gray-700"
        >
          <FileOutlined />
          <span class="truncate max-w-[100px]">{{ file.name }}</span>
          <CloseCircleOutlined
            class="cursor-pointer hover:text-red-500 ml-1"
            @click="removeAttachment(index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Sender } from 'ant-design-x-vue'
import { Select, Switch, Upload, Button, message } from 'ant-design-vue'
import {
  PaperClipOutlined,
  SendOutlined,
  StopOutlined,
  FileOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{
  loading?: boolean
  streaming?: boolean
  disabled?: boolean
  placeholder?: string
}>()

// Use props
console.log(props)

const emit = defineEmits<{
  (
    e: 'submit',
    content: string,
    attachments: File[],
    options: { thinkingMode: string; webSearch: boolean }
  ): void
  (e: 'stop'): void
}>()

const inputValue = ref('')
const thinkingMode = ref('medium')
const webSearch = ref(false)
const attachments = ref<File[]>([])

const thinkingOptions = [
  { label: '深度思考', value: 'high' },
  { label: '标准思考', value: 'medium' },
  { label: '快速响应', value: 'low' },
]

const handleSubmit = () => {
  if (!inputValue.value.trim() && attachments.value.length === 0) return

  emit('submit', inputValue.value, [...attachments.value], {
    thinkingMode: thinkingMode.value,
    webSearch: webSearch.value,
  })

  inputValue.value = ''
  attachments.value = []
}

const handleStop = () => {
  emit('stop')
}

const handleBeforeUpload = (file: File) => {
  const isLt20M = file.size / 1024 / 1024 < 20
  if (!isLt20M) {
    message.error('文件大小不能超过 20MB!')
    return false
  }
  attachments.value.push(file)
  return false // Prevent automatic upload
}

const removeAttachment = (index: number) => {
  attachments.value.splice(index, 1)
}
</script>
