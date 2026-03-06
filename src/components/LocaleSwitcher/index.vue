<template>
  <a-dropdown>
    <a-button type="text">
      <template #icon>
        <GlobalOutlined />
      </template>
      {{ currentLocaleShort }}
    </a-button>
    <template #overlay>
      <a-menu @click="handleLocaleChange">
        <a-menu-item key="zh-CN">简体中文</a-menu-item>
        <a-menu-item key="en-US">English</a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLocaleStore } from '@/stores/locale';
import { GlobalOutlined } from '@ant-design/icons-vue';

const localeStore = useLocaleStore();

/** 按钮上显示国际通用语言简写（ISO 639-1 大写）：ZH / EN */
const currentLocaleShort = computed(() => {
  return localeStore.locale === 'zh-CN' ? 'ZH' : 'EN';
});

const handleLocaleChange = ({ key }: { key: string }) => {
  localeStore.setLocale(key as 'zh-CN' | 'en-US');
};
</script>
