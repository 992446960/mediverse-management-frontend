<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { Modal, Form, Input, Select, Tag, message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { KnowledgeCard, CardType, OwnerType } from '@/types/knowledge'
import { CARD_TYPE_CONFIG } from '@/types/knowledge'
import TiptapEditor from './TiptapEditor.vue'

const props = defineProps<{
  visible: boolean
  card?: KnowledgeCard
  ownerType: OwnerType
  ownerId: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'success'): void
}>()

const formRef = ref()
const loading = ref(false)
const inputTagValue = ref('')
const inputTagVisible = ref(false)

const formState = reactive({
  title: '',
  type: 'evidence' as CardType,
  content: '',
  tags: [] as string[],
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.card) {
        formState.title = props.card.title
        formState.type = props.card.type
        formState.content = props.card.content
        formState.tags = [...props.card.tags]
      } else {
        formState.title = ''
        formState.type = 'evidence'
        formState.content = ''
        formState.tags = []
      }
    }
  }
)

const handleCancel = () => {
  emit('update:visible', false)
}

const handleOk = async () => {
  try {
    await formRef.value.validate()
    loading.value = true

    // 模拟 API 调用
    const payload = {
      ...formState,
      id: props.card?.id,
      owner_type: props.ownerType,
      owner_id: props.ownerId,
    }

    // 这里实际应该调用 axios.post
    console.log('Saving card:', payload)

    message.success(props.card ? '更新成功' : '创建成功')
    emit('success')
    handleCancel()
  } catch (err) {
    console.error('Validate failed:', err)
  } finally {
    loading.value = false
  }
}

const handleCloseTag = (removedTag: string) => {
  formState.tags = formState.tags.filter((tag) => tag !== removedTag)
}

const showInputTag = () => {
  inputTagVisible.value = true
}

const handleInputTagConfirm = () => {
  const inputValue = inputTagValue.value
  if (inputValue && !formState.tags.includes(inputValue)) {
    formState.tags.push(inputValue)
  }
  inputTagVisible.value = false
  inputTagValue.value = ''
}
</script>

<template>
  <Modal
    :open="visible"
    :title="card ? '编辑知识卡' : '新建知识卡'"
    :confirm-loading="loading"
    width="800px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form ref="formRef" :model="formState" layout="vertical" class="mt-4">
      <Form.Item name="title" label="标题" :rules="[{ required: true, message: '请输入标题' }]">
        <Input v-model:value="formState.title" placeholder="请输入知识卡标题" />
      </Form.Item>

      <div class="grid grid-cols-2 gap-4">
        <Form.Item name="type" label="类型" :rules="[{ required: true, message: '请选择类型' }]">
          <Select v-model:value="formState.type">
            <Select.Option v-for="(cfg, key) in CARD_TYPE_CONFIG" :key="key" :value="key">
              {{ cfg.label }}
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="标签">
          <div class="flex flex-wrap gap-2 items-center">
            <Tag v-for="tag in formState.tags" :key="tag" closable @close="handleCloseTag(tag)">
              {{ tag }}
            </Tag>
            <Input
              v-if="inputTagVisible"
              ref="inputTagRef"
              v-model:value="inputTagValue"
              type="text"
              size="small"
              :style="{ width: '78px' }"
              @blur="handleInputTagConfirm"
              @keyup.enter="handleInputTagConfirm"
            />
            <Tag v-else style="background: #fff; border-style: dashed" @click="showInputTag">
              <PlusOutlined /> 新增标签
            </Tag>
          </div>
        </Form.Item>
      </div>

      <Form.Item name="content" label="内容" :rules="[{ required: true, message: '请输入内容' }]">
        <TiptapEditor
          :model-value="formState.content"
          placeholder="请输入知识卡正文内容..."
          @update:model-value="(val) => (formState.content = val)"
        />
      </Form.Item>
    </Form>
  </Modal>
</template>
