import {
  attachBrandColorPicker,
  computed,
  getPreferredTheme,
  signal,
  toggleTheme,
} from '@kupola/platform';

const BRAND_COLORS = [
  { id: 'green', label: '绿色', color: '#22C55E' },
  { id: 'teal', label: '青绿', color: '#14B8A6' },
  { id: 'cyan', label: '青色', color: '#06B6D4' },
  { id: 'blue', label: '蓝色', color: '#3B82F6' },
  { id: 'indigo', label: '靛蓝', color: '#6366F1' },
  { id: 'violet', label: '紫色', color: '#8B5CF6' },
  { id: 'rose', label: '玫红', color: '#F43F5E' },
  { id: 'orange', label: '橙色', color: '#F97316' },
];

export function useThemeControls() {
  const currentTheme = signal(getPreferredTheme());
  const themeIcon = computed(() => currentTheme.value === 'dark' ? 'sun' : 'moon');
  let brandPicker = null;

  function handleThemeToggle() {
    currentTheme.value = toggleTheme();
  }

  function handleBrandColorClick(event) {
    if (brandPicker) {return;}
    brandPicker = attachBrandColorPicker(event.currentTarget, {
      colors: BRAND_COLORS,
      title: '品牌色',
      customLabel: '自定义颜色',
    });
    brandPicker.open();
  }

  function destroy() {
    brandPicker?.destroy();
    brandPicker = null;
  }

  return {
    themeIcon,
    handleThemeToggle,
    handleBrandColorClick,
    destroy,
  };
}
