<template>
  <div ref="scrollContainer" class="scroll-container" @wheel.prevent="handleWheel">
    <div ref="scrollWrapper" class="scroll-wrapper">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ scroll: [] }>()

const scrollContainer = ref<HTMLElement>()
const scrollWrapper = ref<HTMLElement>()

function handleWheel(e: WheelEvent) {
  const wrapper = scrollWrapper.value
  if (!wrapper) return
  // 将垂直滚轮映射为水平滚动（与 jkjn el-scrollbar 行为一致）
  const eventDelta = -e.deltaY * 40
  wrapper.scrollLeft = wrapper.scrollLeft - eventDelta / 4
  emit('scroll')
}

function scrollToTarget(targetEl: HTMLElement) {
  const container = scrollContainer.value
  const wrapper = scrollWrapper.value
  if (!container || !wrapper) return

  const containerWidth = container.offsetWidth
  const targetLeft = targetEl.offsetLeft
  const targetWidth = targetEl.offsetWidth

  if (targetLeft < wrapper.scrollLeft) {
    wrapper.scrollLeft = targetLeft
  } else if (targetLeft + targetWidth > wrapper.scrollLeft + containerWidth) {
    wrapper.scrollLeft = targetLeft + targetWidth - containerWidth
  }
}

defineExpose({ scrollToTarget })
</script>

<style scoped>
.scroll-container {
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.scroll-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  height: 34px;
  /* 隐藏原生滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scroll-wrapper::-webkit-scrollbar {
  display: none;
}
</style>
