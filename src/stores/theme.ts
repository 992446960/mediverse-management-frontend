import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'auto';

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>((localStorage.getItem('theme-mode') as ThemeMode) || 'auto');
  const systemPrefersDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);

  const isDark = computed(() => {
    if (mode.value === 'auto') return systemPrefersDark.value;
    return mode.value === 'dark';
  });

  function setMode(newMode: ThemeMode) {
    mode.value = newMode;
    localStorage.setItem('theme-mode', newMode);
  }

  function toggleMode() {
    if (mode.value === 'light') setMode('dark');
    else if (mode.value === 'dark') setMode('auto');
    else setMode('light');
  }

  function applyTheme() {
    const root = document.documentElement;
    if (isDark.value) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    }
    else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    systemPrefersDark.value = e.matches;
  });

  watch(isDark, applyTheme, { immediate: true });

  return { mode, isDark, setMode, toggleMode };
});
