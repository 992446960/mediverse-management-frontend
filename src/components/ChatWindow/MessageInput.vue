<script setup lang="ts">
import { ref, h } from 'vue'
import { Sender, Attachments } from 'ant-design-x-vue'
import {
  SendOutlined,
  StopOutlined,
  PaperClipOutlined,
  GlobalOutlined,
  BulbOutlined,
} from '@ant-design/icons-vue'

defineProps<{
  loading?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (
    e: 'send',
    content: string,
    options: { thinkingMode: string; webSearch: boolean; files: any[] }
  ): void
  (e: 'stop'): void
}>()

const inputValue = ref('')
const thinkingMode = ref('medium') // 'high' | 'medium' | 'low'
const webSearch = ref(false)
const fileList = ref<Array<{ uid: number; name: string; status: string; url: string }>>([])

const handleSend = () => {
  if (!inputValue.value.trim() && fileList.value.length === 0) return

  emit('send', inputValue.value, {
    thinkingMode: thinkingMode.value,
    webSearch: webSearch.value,
    files: fileList.value,
  })

  inputValue.value = ''
  fileList.value = []
}

const handleStop = () => {
  emit('stop')
}

const handleUpload = (file: File) => {
  // Mock upload for now
  const newFile = {
    uid: Date.now(),
    name: file.name,
    status: 'done',
    url: URL.createObjectURL(file),
  }
  fileList.value.push(newFile)
  return false // Prevent default upload behavior
}

const handleRemoveFile = (file: { uid: number }) => {
  fileList.value = fileList.value.filter((f) => f.uid !== file.uid)
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    handleUpload(target.files[0])
  }
}
</script>

<template>
  <div
    class="message-input p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
  >
    <!-- Toolbar -->
    <div class="flex items-center justify-between mb-2 px-2">
      <div class="flex items-center gap-4">
        <!-- Thinking Mode -->
        <div
          class="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:text-blue-500 transition-colors"
          @click="
            thinkingMode =
              thinkingMode === 'high' ? 'low' : thinkingMode === 'medium' ? 'high' : 'medium'
          "
        >
          <BulbOutlined :class="{ 'text-yellow-500': thinkingMode !== 'low' }" />
          <span
            >思考:
            {{
              thinkingMode === 'high' ? '深度' : thinkingMode === 'medium' ? '标准' : '快速'
            }}</span
          >
        </div>

        <!-- Web Search -->
        <div
          class="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:text-blue-500 transition-colors"
          @click="webSearch = !webSearch"
        >
          <GlobalOutlined :class="{ 'text-blue-500': webSearch.value }" />
          <span>联网搜索</span>
        </div>
      </div>
    </div>

    <!-- Attachments Preview -->
    <Attachments
      v-if="fileList.length > 0"
      :items="fileList"
      class="mb-2"
      @remove="handleRemoveFile"
    />

    <!-- Sender Input -->
    <Sender
      v-model:value="inputValue"
      :loading="loading"
      :disabled="disabled"
      placeholder="输入消息，Shift+Enter 换行..."
      @submit="handleSend"
      @cancel="handleStop"
    >
      <template #prefix>
        <div class="relative inline-block mr-2">
          <input
            type="file"
            class="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
            @change="onFileChange"
          />
          <a-button type="text" size="small" :icon="h(PaperClipOutlined)" />
        </div>
      </template>

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
.message-input :deep(.ant-sender-input) {
  background-color: #f3f4f6;
  border-radius: 20px;
  padding: 8px 16px;
}

.dark .message-input :deep(.ant-sender-input) {
  background-color: #1f2937;
  color: white;
}
</style>
