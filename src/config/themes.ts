import { theme } from 'ant-design-vue';
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#0EA5E9',
    colorInfo: '#0EA5E9',
    colorSuccess: '#059669',
    colorWarning: '#D97706',
    colorError: '#DC2626',
    colorBgBase: '#F8FAFC',
    colorBgLayout: '#F1F5F9',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorTextBase: '#0F172A',
    colorBorder: '#E2E8F0',
    colorBorderSecondary: '#F1F5F9',
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    wireframe: false,
    fontFamily:
      "'Figtree', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    lineHeight: 1.6,
  },
  components: {
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
    } as Record<string, string>,
    Layout: {
      // @ts-ignore
      siderBg: '#FFFFFF',
      // @ts-ignore
      triggerBg: '#F1F5F9',
      // @ts-ignore
      triggerColor: '#64748B',
    },
  },
  algorithm: theme.defaultAlgorithm,
};

export const darkThemeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#38BDF8',
    colorInfo: '#38BDF8',
    colorSuccess: '#10B981',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorBgBase: '#020617',
    colorBgLayout: '#020617',
    colorBgContainer: '#111827',
    colorBgElevated: '#1E293B',
    colorTextBase: '#F1F5F9',
    colorBorder: '#1E293B',
    colorBorderSecondary: '#0F172A',
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    wireframe: false,
    fontFamily:
      "'Figtree', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    lineHeight: 1.6,
  },
  components: {
    Menu: {
      // @ts-ignore
      darkItemBg: '#0B1120',
      // @ts-ignore
      darkSubMenuItemBg: '#080E1C',
      // @ts-ignore
      darkItemSelectedBg: '#38BDF8',
    },
    Layout: {
      // @ts-ignore
      siderBg: '#0B1120',
      // @ts-ignore
      triggerBg: '#080E1C',
      // @ts-ignore
      triggerColor: '#94A3B8',
    },
  },
  algorithm: theme.darkAlgorithm,
};
