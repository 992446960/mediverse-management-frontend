<template>
  <a-modal
    :open="open"
    :title="card ? t('knowledge.card.editTitle') : t('knowledge.card.createTitle')"
    :confirm-loading="loading"
    :ok-button-props="{ disabled: contentResolving }"
    :destroy-on-close="true"
    width="800px"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-spin :spinning="contentResolving">
      <a-form ref="formRef" :model="formState" layout="vertical" class="mt-4">
        <a-form-item
          name="title"
          :label="t('knowledge.card.titleLabel')"
          :rules="[{ required: true, message: t('knowledge.card.titleRequired') }]"
        >
          <a-input
            v-model:value="formState.title"
            :placeholder="t('knowledge.card.titlePlaceholder')"
            :maxlength="200"
            show-count
          />
        </a-form-item>

        <div class="grid grid-cols-2 gap-4">
          <a-form-item
            name="type"
            :label="t('knowledge.card.typeLabel')"
            :rules="[{ required: true, message: t('knowledge.card.typeRequired') }]"
          >
            <a-select v-model:value="formState.type" :disabled="isEditMode">
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
              <a-tag
                v-else-if="formState.tags.length < 10"
                style="background: #fff; border-style: dashed"
                @click="showInputTag"
              >
                <PlusOutlined /> {{ t('knowledge.card.addTag') }}
              </a-tag>
            </div>
          </a-form-item>
        </div>

        <!-- 关联文件选择：仅创建模式 -->
        <a-form-item v-if="!isEditMode" :label="t('knowledge.card.sourceFileLabel')">
          <a-select
            v-model:value="formState.source_file_ids"
            mode="multiple"
            show-search
            allow-clear
            :placeholder="t('knowledge.card.sourceFilePlaceholder')"
            :filter-option="false"
            :options="editorSourceFileOptions"
            :loading="editorSourceFileLoading"
            @search="handleEditorSourceFileSearch"
          />
        </a-form-item>

        <!-- 修改摘要：仅编辑模式 -->
        <a-form-item v-if="isEditMode" :label="t('knowledge.card.changeSummaryLabel')">
          <a-input
            v-model:value="formState.change_summary"
            :placeholder="t('knowledge.card.changeSummaryPlaceholder')"
            :maxlength="200"
            show-count
          />
        </a-form-item>

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
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import type { KnowledgeCard, CardType, OwnerType } from '@/types/knowledge'
import { CARD_TYPE_CONFIG } from '@/types/knowledge'
import { getKnowledgeCardDetail, saveKnowledgeCard, updateKnowledgeCard } from '@/api/knowledge'
import TiptapEditor from './TiptapEditor.vue'
import { useFileRemoteSearch } from '@/composables/useFileRemoteSearch'

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
/** 列表行无正文时拉取详情中的 content */
const contentResolving = ref(false)
let editorLoadGeneration = 0
const inputTagValue = ref('')
const inputTagVisible = ref(false)

const isEditMode = computed(() => !!props.card?.id)

const {
  options: editorSourceFileOptions,
  loading: editorSourceFileLoading,
  loadDefault: loadEditorSourceFiles,
  search: handleEditorSourceFileSearch,
} = useFileRemoteSearch(
  toRef(() => props.ownerType),
  toRef(() => props.ownerId)
)

const formState = reactive({
  title: '',
  type: 'evidence' as CardType,
  content: '',
  tags: [] as string[],
  source_file_ids: [] as string[],
  change_summary: '',
})

watch(
  () => props.open,
  async (val) => {
    if (!val) {
      editorLoadGeneration++
      return
    }
    if (props.card) {
      const loadGen = editorLoadGeneration
      formState.title = props.card.title
      formState.type = props.card.type
      formState.tags = [...props.card.tags]
      formState.source_file_ids = []
      formState.change_summary = ''

      const fromList =
        typeof props.card.content === 'string' && props.card.content.trim().length > 0
      if (fromList) {
        formState.content = props.card.content
      } else if (props.card.id) {
        contentResolving.value = true
        try {
          const detail = await getKnowledgeCardDetail(props.ownerType, props.ownerId, props.card.id)
          if (loadGen !== editorLoadGeneration) return
          formState.content = detail.content ?? ''
        } catch {
          if (loadGen !== editorLoadGeneration) return
          formState.content = ''
          message.error(t('knowledge.card.fetchDetailFailed'))
        } finally {
          if (loadGen === editorLoadGeneration) contentResolving.value = false
        }
      } else {
        formState.content = ''
      }
    } else {
      formState.title = ''
      formState.type = 'evidence'
      formState.content = ''
      formState.tags = []
      formState.source_file_ids = []
      formState.change_summary = ''
      loadEditorSourceFiles()
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

    if (props.card?.id) {
      await updateKnowledgeCard(props.ownerType, props.ownerId, props.card.id, {
        title: formState.title,
        content: formState.content,
        tags: formState.tags,
        change_summary: formState.change_summary || undefined,
      })
    } else {
      await saveKnowledgeCard(props.ownerType, props.ownerId, {
        title: formState.title,
        content: formState.content,
        type: formState.type,
        tags: formState.tags,
        source_file_ids: formState.source_file_ids.length ? formState.source_file_ids : undefined,
      })
    }

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
    if (formState.tags.length >= 10) {
      message.warning(t('knowledge.card.tagMaxLimit'))
      inputTagVisible.value = false
      inputTagValue.value = ''
      return
    }
    formState.tags.push(inputValue)
  }
  inputTagVisible.value = false
  inputTagValue.value = ''
}
</script>
