<template>
  <a-modal
    :open="open"
    :title="card ? t('knowledge.card.editTitle') : t('knowledge.card.createTitle')"
    :confirm-loading="loading"
    width="800px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" :model="formState" layout="vertical" class="mt-4">
      <a-form-item
        name="title"
        :label="t('knowledge.card.titleLabel')"
        :rules="[{ required: true, message: t('knowledge.card.titleRequired') }]"
      >
        <a-input
          v-model:value="formState.title"
          :placeholder="t('knowledge.card.titlePlaceholder')"
        />
      </a-form-item>

      <div class="grid grid-cols-2 gap-4">
        <a-form-item
          name="type"
          :label="t('knowledge.card.typeLabel')"
          :rules="[{ required: true, message: t('knowledge.card.typeRequired') }]"
        >
          <a-select v-model:value="formState.type">
            <a-select-option v-for="(cfg, key) in CARD_TYPE_CONFIG" :key="key" :value="key">
              {{ cfg.label }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item :label="t('knowledge.card.tagsLabel')">
          <div class="flex flex-wrap gap-2 items-center">
            <a-tag v-for="tag in formState.tags" :key="tag" closable @close="handleCloseTag(tag)">
              {{ tag }}
            </a-tag>
            <a-input
              v-if="inputTagVisible"
              ref="inputTagRef"
              v-model:value="inputTagValue"
              type="text"
              size="small"
              class="w-[78px]"
              @blur="handleInputTagConfirm"
              @keyup.enter="handleInputTagConfirm"
            />
            <a-tag v-else style="background: #fff; border-style: dashed" @click="showInputTag">
              <PlusOutlined /> {{ t('knowledge.card.addTag') }}
            </a-tag>
          </div>
        </a-form-item>
      </div>

      <a-form-item
        name="content"
        :label="t('knowledge.card.contentLabel')"
        :rules="[{ required: true, message: t('knowledge.card.contentRequired') }]"
      >
        <TiptapEditor
          :model-value="formState.content"
          :placeholder="t('knowledge.card.contentPlaceholder')"
          @update:model-value="(val) => (formState.content = val)"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { KnowledgeCard, CardType, OwnerType } from '@/types/knowledge'
import { CARD_TYPE_CONFIG } from '@/types/knowledge'
import { saveKnowledgeCard } from '@/api/knowledge'
import TiptapEditor from './TiptapEditor.vue'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  card?: KnowledgeCard
  ownerType: OwnerType
  ownerId: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
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
  () => props.open,
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
  emit('update:open', false)
}

const handleOk = async () => {
  try {
    await formRef.value.validate()
    loading.value = true

    await saveKnowledgeCard(props.ownerType, props.ownerId, {
      ...formState,
      id: props.card?.id,
    })

    message.success(
      props.card ? t('knowledge.card.saveSuccess') : t('knowledge.card.createSuccess')
    )
    emit('success')
    handleCancel()
  } catch (err) {
    console.error('Save card failed:', err)
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
