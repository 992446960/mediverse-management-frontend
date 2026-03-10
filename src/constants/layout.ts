/**
 * 布局尺寸常量，用于动态计算 PageTree 等组件的可视高度。
 * 与 MainLayout 中 .header 及 .content 的样式保持一致。
 */

/** 主布局顶栏高度（与 ant-design-vue a-layout-header 默认一致） */
export const LAYOUT_HEADER_HEIGHT_PX = 64

/** 主内容区垂直 margin（与 variables.css --spacing-lg 一致，上下各 24px） */
export const LAYOUT_CONTENT_MARGIN_TOP_PX = 24
export const LAYOUT_CONTENT_MARGIN_BOTTOM_PX = 24

/** PageTree 可用高度：100vh - header - content 上下 margin，用于 CSS calc */
export const TABLE_TREE_HEIGHT_CALC = `calc(100vh - ${LAYOUT_HEADER_HEIGHT_PX + LAYOUT_CONTENT_MARGIN_TOP_PX + LAYOUT_CONTENT_MARGIN_BOTTOM_PX}px)`
