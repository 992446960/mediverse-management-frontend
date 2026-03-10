<template>
  <div class="flex items-center gap-3 flex-wrap">
    <template v-for="(btn, bIdx) in column.btns" :key="bIdx">
      <template v-if="btn.btnIsShow?.(record) !== false">
        <!-- popconfirm -->
        <a-popconfirm
          v-if="btn.type === 'popconfirm'"
          :title="btn.dynamicPopconfirmTitle?.(record) ?? btn.popconfirmTitle"
          :ok-type="(btn.popconfirmType as 'danger' | 'primary') ?? 'danger'"
          @confirm="btn.handle?.(record, index)"
          @cancel="btn.cancel?.(record, index)"
        >
          <template #default>
            <a-button
              :type="btn.buttonType ?? DEFAULT_BUTTON_TYPE"
              size="small"
              :danger="getBtnDanger(btn, record)"
              :style="getBtnColorStyle(btn, record)"
              :disabled="btn.btnDisabled?.(record)"
              @click.stop
            >
              <template v-if="resolveIcon(btn, record)" #icon>
                <component :is="resolveIcon(btn, record)" />
              </template>
              {{ btn.dynamicText?.(record) ?? btn.text }}
            </a-button>
          </template>
        </a-popconfirm>

        <!-- popover / dropdown 更多操作：无前 icon，右侧上下箭头随开合切换；列表项保留 icon 与 danger -->
        <a-dropdown
          v-else-if="btn.type === 'popover' && btn.moreList?.length"
          v-model:open="moreOpen"
          trigger="click"
        >
          <template #overlay>
            <a-menu class="page-table-more-menu">
              <a-menu-item
                v-for="(m, mIdx) in btn.moreList?.filter((item) => item.btnIsShow?.(record) !== false) ?? []"
                :key="mIdx"
                @click="m.handle?.(record, index)"
              >
                <a-button
                  :type="m.buttonType ?? DEFAULT_BUTTON_TYPE"
                  size="small"
                  :danger="getBtnDanger(m, record)"
                  :style="getBtnColorStyle(m, record)"
                  :disabled="m.btnDisabled?.(record)"
                  @click="m.handle?.(record, index)"
                >
                  <template v-if="resolveIcon(m, record)" #icon>
                    <component :is="resolveIcon(m, record)" />
                  </template>
                  {{ m.dynamicText?.(record) ?? m.text }}
                </a-button>
              </a-menu-item>
            </a-menu>
          </template>
          <a-button
            :type="btn.buttonType ?? DEFAULT_BUTTON_TYPE"
            size="small"
            :danger="getBtnDanger(btn, record)"
            :style="getBtnColorStyle(btn, record)"
            class="page-table-more-trigger"
            @click.stop
          >
            {{ btn.dynamicText?.(record) ?? btn.text }}
            <component
              :is="moreOpen ? UpOutlined : DownOutlined"
              class="page-table-more-trigger__suffix"
            />
          </a-button>
        </a-dropdown>

        <!-- 默认 primary button -->
        <a-button
          v-else
          :type="btn.buttonType ?? DEFAULT_BUTTON_TYPE"
          size="small"
          :danger="getBtnDanger(btn, record)"
          :style="getBtnColorStyle(btn, record)"
          :disabled="btn.btnDisabled?.(record)"
          @click="btn.handle?.(record, index)"
        >
          <template v-if="resolveIcon(btn, record)" #icon>
            <component :is="resolveIcon(btn, record)" />
          </template>
          {{ btn.dynamicText?.(record) ?? btn.text }}
        </a-button>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UpOutlined, DownOutlined } from '@ant-design/icons-vue'
import type { PageTableColumnConfig, PageTableOperationBtn } from './types'

defineProps<{
  column: PageTableColumnConfig
  record: Record<string, unknown>
  index: number
}>()

const moreOpen = ref(false)

const DEFAULT_BUTTON_TYPE = 'link'
const WARNING_COLOR = '#faad14'
const SUCCESS_COLOR = '#52c41a'

function resolveIcon(btn: PageTableOperationBtn, record: Record<string, unknown>): unknown {
  return btn.dynamicIcon?.(record) ?? btn.icon
}

function getBtnDanger(btn: PageTableOperationBtn, record: Record<string, unknown>): boolean {
  const color = btn.dynamicColor?.(record) ?? btn.color
  return color === 'danger'
}

function getBtnColorStyle(
  btn: PageTableOperationBtn,
  record: Record<string, unknown>
): Record<string, string> | undefined {
  const color = btn.dynamicColor?.(record) ?? btn.color
  if (!color || color === 'danger') return undefined
  if (color === 'warning') return { color: WARNING_COLOR }
  if (color === 'success') return { color: SUCCESS_COLOR }
  return { color }
}
</script>

<style scoped>
.page-table-more-trigger {
  display: inline-flex;
  align-items: center;
}
.page-table-more-trigger__suffix {
  margin-left: 4px;
  margin-inline-start: 2px !important;
}
.page-table-more-menu-item__icon {
  font-size: 14px;
  opacity: 0.85;
}
</style>
