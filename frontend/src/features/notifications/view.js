import { html } from '@kupola/platform';

function priorityTag(priority) {
  return priority === 'high'
    ? html`<span class="ds-tag ds-tag--error">重要</span>`
    : '';
}

function notificationItemView({ item, onMarkRead, onRemove }) {
  const icon = item.category === 'security'
    ? 'shield'
    : item.category === 'audit'
      ? 'file-text'
      : item.category === 'organization'
        ? 'users'
        : 'bell';
  return html`
    <article class="${() => item.read ? 'notification-item is-read' : 'notification-item is-unread'}" data-notification-id="${item.id}">
      <div class="notification-item__icon"><icon name="${icon}" size="17"></icon></div>
      <div class="notification-item__body">
        <div class="notification-item__heading">
          <strong>${item.title}</strong>
          ${priorityTag(item.priority)}
          <span class="notification-item__category">${item.categoryLabel}</span>
        </div>
        <p>${item.content}</p>
        <time>${item.createdAt}</time>
      </div>
      <div class="notification-item__actions">
        ${item.read ? '' : html`
          <button type="button" class="notification-link-button" onclick="${() => onMarkRead(item)}">标记已读</button>
        `}
        <button type="button" class="notification-icon-button" title="删除消息" aria-label="删除消息" onclick="${() => onRemove(item)}">
          <icon name="trash" size="15"></icon>
        </button>
      </div>
    </article>
  `;
}

export function notificationStatsView({ stats }) {
  return html`
    <div class="notification-stats">
      <div class="notification-stat"><span>全部</span><strong>${() => stats.value.total}</strong></div>
      <div class="notification-stat notification-stat--unread"><span>未读</span><strong>${() => stats.value.unread}</strong></div>
      <div class="notification-stat"><span>重要</span><strong>${() => stats.value.high}</strong></div>
    </div>
  `;
}

export function notificationPageView({
  activeTab,
  keyword,
  notifications,
  stats,
  onSelectTab,
  onSearch,
  onMarkAllRead,
  onMarkRead,
  onRemove,
}) {
  return html`
    <div class="notification-page">
      <div class="notification-toolbar">
        <div class="notification-toolbar__left">
          ${notificationStatsView({ stats })}
          <div class="notification-tabs" role="tablist" aria-label="通知筛选">
            <button type="button" class="${() => activeTab.value === 'all' ? 'notification-tab is-active' : 'notification-tab'}" aria-selected="${() => activeTab.value === 'all' ? 'true' : 'false'}" onclick="${() => onSelectTab('all')}">全部消息</button>
            <button type="button" class="${() => activeTab.value === 'unread' ? 'notification-tab is-active' : 'notification-tab'}" aria-selected="${() => activeTab.value === 'unread' ? 'true' : 'false'}" onclick="${() => onSelectTab('unread')}">未读消息</button>
          </div>
        </div>
        <div class="notification-toolbar__right">
          <label class="notification-search">
            <icon name="search" size="16"></icon>
            <input class="notification-search__input" value="${keyword}" oninput="${onSearch}" placeholder="搜索通知" />
          </label>
          <button
            type="button"
            class="ds-btn ds-btn--secondary"
            disabled="${() => stats.value.unread > 0 ? false : 'disabled'}"
            onclick="${onMarkAllRead}"
          >全部标为已读</button>
        </div>
      </div>
      <div class="notification-list">
        ${() => notifications.value.length > 0
          ? notifications.value.map(item => notificationItemView({ item, onMarkRead, onRemove }))
          : html`<div class="notification-empty"><icon name="bell-off" size="28"></icon><strong>暂无通知</strong><span>当前筛选条件下没有消息</span></div>`}
      </div>
    </div>
  `;
}
