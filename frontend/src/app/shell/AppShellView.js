import { html } from '@kupola/platform';

export function sidebarMenuView({ items, currentPath, onNavigate }) {
  return items.map(item => {
    if (item.type === 'divider') {
      return html`<div class="ds-dashboard__sidebar-divider"></div>`;
    }

    return html`
      <a
        class="ds-dashboard__sidebar-item ${currentPath.value === item.path ? 'is-active' : ''}"
        href="#"
        data-title="${item.title}"
        onclick="${event => {
          event.preventDefault();
          onNavigate(item.path);
        }}"
      >
        <icon name="${item.icon}" size="18"></icon>
      </a>
    `;
  });
}

export function appShellView({
  headerTitle,
  userName,
  onProfileClick,
  onNotificationsClick,
  sidebarMenu,
  themeIcon,
  onBrandColorClick,
  onThemeToggle,
  onLogout,
}) {
  return html`
    <div class="ds-dashboard">
      <header class="ds-dashboard__header">
        <div class="ds-dashboard__header-left">
          <div class="ds-dashboard__logo">
            <div class="ds-dashboard__logo-icon"></div>
            <span>Kupola</span>
          </div>
        </div>
        <div class="ds-dashboard__header-center">
          <span class="ds-text-secondary ds-text-sm">${headerTitle}</span>
        </div>
        <div class="ds-dashboard__header-right">
          <button
            type="button"
            class="ds-dashboard__notification-button"
            data-title="通知消息"
            aria-label="通知消息"
            onclick="${onNotificationsClick}"
          >
            <icon name="bell" size="18"></icon>
            <span class="ds-dashboard__notification-dot" aria-hidden="true"></span>
          </button>
          <button
            type="button"
            class="ds-dashboard__account-button"
            data-title="当前用户资料"
            onclick="${onProfileClick}"
          >
            <span class="ds-dashboard__account-avatar" aria-hidden="true">${() => String(userName()).slice(0, 1)}</span>
            <span class="ds-text-xs ds-text-secondary">${userName}</span>
          </button>
        </div>
      </header>

      <div class="ds-dashboard__main">
        <aside class="ds-dashboard__sidebar">
          <nav class="ds-dashboard__sidebar-nav">${sidebarMenu}</nav>
          <nav class="ds-dashboard__sidebar-bottom">
            <button
              type="button"
              class="ds-dashboard__sidebar-item"
              data-title="品牌色"
              onclick="${onBrandColorClick}"
            >
              <icon name="star" size="16"></icon>
            </button>
            <button
              type="button"
              class="ds-dashboard__sidebar-item"
              data-title="切换主题"
              onclick="${onThemeToggle}"
            >
              <icon name="${themeIcon}" size="18"></icon>
            </button>
            <a
              href="#"
              class="ds-dashboard__sidebar-item"
              data-title="退出登录"
              onclick="${event => {
                event.preventDefault();
                onLogout();
              }}"
            >
              <icon name="log-out" size="18"></icon>
            </a>
          </nav>
        </aside>

        <main class="ds-dashboard__content">
          <div k-router-view></div>
        </main>
      </div>

      <footer class="ds-dashboard__footer">
        <div class="ds-dashboard__footer-left">
          <div class="ds-dashboard__status-item">
            <span class="ds-dashboard__status-dot"></span>
            <span>Kupola v3.4.0</span>
          </div>
        </div>
      </footer>
    </div>
  `;
}
