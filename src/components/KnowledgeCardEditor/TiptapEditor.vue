<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  BoldOutlined,
  ItalicOutlined,
  FontSizeOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  CodeOutlined,
  LineOutlined,
} from '@ant-design/icons-vue'
import { watch } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: props.placeholder || '请输入内容...',
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(
  () => props.modelValue,
  (value) => {
    if (editor.value && editor.value.getHTML() !== value) {
      editor.value.commands.setContent(value, { emitUpdate: false })
    }
  }
)

const menuItems = [
  {
    key: 'bold',
    icon: BoldOutlined,
    action: () => editor.value?.chain().focus().toggleBold().run(),
    isActive: () => editor.value?.isActive('bold'),
  },
  {
    key: 'italic',
    icon: ItalicOutlined,
    action: () => editor.value?.chain().focus().toggleItalic().run(),
    isActive: () => editor.value?.isActive('italic'),
  },
  {
    key: 'heading',
    icon: FontSizeOutlined,
    action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: () => editor.value?.isActive('heading', { level: 2 }),
  },
  {
    key: 'bulletList',
    icon: UnorderedListOutlined,
    action: () => editor.value?.chain().focus().toggleBulletList().run(),
    isActive: () => editor.value?.isActive('bulletList'),
  },
  {
    key: 'orderedList',
    icon: OrderedListOutlined,
    action: () => editor.value?.chain().focus().toggleOrderedList().run(),
    isActive: () => editor.value?.isActive('orderedList'),
  },
  {
    key: 'codeBlock',
    icon: CodeOutlined,
    action: () => editor.value?.chain().focus().toggleCodeBlock().run(),
    isActive: () => editor.value?.isActive('codeBlock'),
  },
  {
    key: 'blockquote',
    icon: LineOutlined,
    action: () => editor.value?.chain().focus().toggleBlockquote().run(),
    isActive: () => editor.value?.isActive('blockquote'),
  },
]
</script>

<template>
  <div class="tiptap-editor border border-gray-200 rounded-md overflow-hidden">
    <div
      v-if="editor"
      class="editor-menu flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200"
    >
      <button
        v-for="item in menuItems"
        :key="item.key"
        type="button"
        class="p-2 rounded hover:bg-gray-200 transition-colors"
        :class="{ 'bg-gray-200 text-blue-600': item.isActive() }"
        @click="item.action"
      >
        <component :is="item.icon" />
      </button>
    </div>
    <editor-content
      :editor="editor"
      class="p-4 min-h-[300px] max-h-[600px] overflow-y-auto focus:outline-none"
    />
  </div>
</template>

<style scoped>
.tiptap-editor :deep(.ProseMirror) {
  outline: none;
}

.tiptap-editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.tiptap-editor :deep(.ProseMirror ul),
.tiptap-editor :deep(.ProseMirror ol) {
  padding: 0 1rem;
  margin: 1rem 0;
}

.tiptap-editor :deep(.ProseMirror h2) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 600;
  font-size: 1.25rem;
}

.tiptap-editor :deep(.ProseMirror blockquote) {
  border-left: 3px solid #e2e8f0;
  padding-left: 1rem;
  margin-left: 0;
  color: #64748b;
}

.tiptap-editor :deep(.ProseMirror code) {
  background-color: #f1f5f9;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: monospace;
}

.tiptap-editor :deep(.ProseMirror pre) {
  background: #1e293b;
  color: #f8fafc;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.tiptap-editor :deep(.ProseMirror pre code) {
  background: none;
  color: inherit;
  padding: 0;
}
</style>
