import { html } from '@kupola/platform';
import { TableView } from '@kupola/components/views';

const RESULT_META = Object.freeze({
  success: { label: '成功', tone: 'success' },
  failed: { label: '失败', tone: 'error' },
  warning: { label: '警告', tone: 'warning' },
});

function selectedOption(value, currentValue) {
  return String(value) === String(currentValue) ? 'selected' : false;
}

function resultTag(result) {
  const meta = RESULT_META[result] || RESULT_META.warning;
  const tag = document.createElement('span');
  tag.className = `ds-tag ds-tag--${meta.tone}`;
  tag.textContent = meta.label;
  return tag;
}

function statCard({ label, value, result, resultFilter, onResultFilter }) {
  return html`
    <button
      type="button"
      class="${() => resultFilter.value === result ? 'audit-stat is-active' : 'audit-stat'}"
      aria-pressed="${() => resultFilter.value === result ? 'true' : 'false'}"
      onclick="${() => onResultFilter(result)}"
    >
      <span>${label}</span>
      <strong>${value}</strong>
    </button>
  `;
}

export function statsView({ stats, resultFilter, onResultFilter }) {
  return html`
    <div class="audit-stats">
      ${statCard({ label: '日志', value: () => stats.value.total, result: '', resultFilter, onResultFilter })}
      ${statCard({ label: '成功', value: () => stats.value.success, result: 'success', resultFilter, onResultFilter })}
      ${statCard({ label: '失败', value: () => stats.value.failed, result: 'failed', resultFilter, onResultFilter })}
      ${statCard({ label: '警告', value: () => stats.value.warning, result: 'warning', resultFilter, onResultFilter })}
    </div>
  `;
}

export function toolbarView({
  stats,
  searchKeyword,
  moduleFilter,
  modules,
  onSearch,
  onModuleFilter,
  onResetFilters,
}) {
  return html`
    <div class="audit-toolbar">
      <div class="audit-toolbar__summary">${stats}</div>
      <div class="audit-toolbar__actions">
        <label class="audit-search">
          <icon name="search" size="16"></icon>
          <input
            type="text"
            value="${searchKeyword}"
            oninput="${onSearch}"
            placeholder="搜索操作、对象、人员、IP..."
            class="audit-search__input"
          />
        </label>
        <select class="audit-filter-select" onchange="${onModuleFilter}">
          <option value="" selected="${() => moduleFilter.value ? false : 'selected'}">全部模块</option>
          ${() => modules.value.map(module => html`
            <option
              value="${module}"
              selected="${() => selectedOption(module, moduleFilter.value)}"
            >${module}</option>
          `)}
        </select>
        <button type="button" class="ds-btn ds-btn--secondary audit-filter-reset" onclick="${onResetFilters}">
          重置
        </button>
      </div>
    </div>
  `;
}

export function loginToolbarView({ stats, searchKeyword, onSearch, onResetFilters }) {
  return html`
    <div class="audit-toolbar">
      <div class="audit-toolbar__summary">${stats}</div>
      <div class="audit-toolbar__actions">
        <label class="audit-search">
          <icon name="search" size="16"></icon>
          <input
            type="text"
            value="${searchKeyword}"
            oninput="${onSearch}"
            placeholder="搜索账号、人员、IP、设备..."
            class="audit-search__input"
          />
        </label>
        <button type="button" class="ds-btn ds-btn--secondary audit-filter-reset" onclick="${onResetFilters}">重置</button>
      </div>
    </div>
  `;
}

export function loginTableView({ logs }) {
  return TableView({
    ariaLabel: '登录日志',
    className: 'audit-table login-table',
    columns: [
      { key: 'createdAt', title: '时间', minWidth: 150, sortable: true },
      { key: 'username', title: '账号' },
      { key: 'name', title: '用户' },
      { key: 'result', title: '结果', render: resultTag },
      { key: 'ip', title: 'IP' },
      { key: 'device', title: '设备' },
      { key: 'location', title: '位置' },
    ],
    data: logs,
    options: {
      rowKey: 'id',
      showPagination: true,
      pageSize: 6,
      pageSizeOptions: [ 6, 12, 24 ],
    },
  });
}

export function auditTableView({ logs }) {
  return TableView({
    ariaLabel: '操作日志',
    className: 'audit-table',
    columns: [
      { key: 'createdAt', title: '时间', minWidth: 150, sortable: true },
      { key: 'module', title: '模块' },
      { key: 'action', title: '操作' },
      { key: 'operator', title: '操作人' },
      { key: 'target', title: '对象' },
      {
        key: 'result',
        title: '结果',
        render: resultTag,
      },
      { key: 'ip', title: 'IP' },
    ],
    data: logs,
    options: {
      rowKey: 'id',
      showPagination: true,
      pageSize: 20,
      pageSizeOptions: [ 20 ],
    },
  });
}

export function listPageView({ toolbar, table }) {
  return html`
    <div class="audit-page">
      <div class="audit-page__header">${toolbar}</div>
      <div class="audit-page__body">${table}</div>
    </div>
  `;
}
