import { html } from '@kupola/platform';
import { computed } from '@kupola/core';
import { TableView } from '@kupola/components/views';
import { PERMISSION_GROUPS } from '../permissions/state.js';

function selectedOption(value, currentValue) {
  return String(value) === String(currentValue) ? 'selected' : false;
}

function statusTag(status) {
  const active = status === 'active';
  return html`<span class="ds-tag ds-tag--${active ? 'success' : 'warning'}">${active ? '启用' : '停用'}</span>`;
}

function statView(label, value) {
  return html`
    <div class="settings-stat">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>
  `;
}

function statusElement(status) {
  const tag = document.createElement('span');
  tag.className = `ds-tag ds-tag--${status === 'active' ? 'success' : 'warning'}`;
  tag.textContent = status === 'active' ? '启用' : '停用';
  return tag;
}

function actionButton(text, onClick, tone = 'neutral') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `settings-link-button settings-action--${tone}`;
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

function statusAction(status, onClick) {
  return actionButton(
    status === 'active' ? '停用' : '启用',
    onClick,
    status === 'active' ? 'warning' : 'success',
  );
}

function actionGroup(buttons) {
  const group = document.createElement('div');
  group.className = 'settings-row-actions';
  group.append(...buttons.filter(Boolean));
  return group;
}

function menuNameElement(menu) {
  const wrapper = document.createElement('div');
  wrapper.className = 'settings-menu-name';
  wrapper.style.setProperty('--menu-level', menu.parentId ? '1' : '0');
  const icon = document.createElement('icon');
  icon.setAttribute('name', menu.parentId ? 'corner-down-right' : 'folder');
  icon.setAttribute('size', '14');
  const name = document.createElement('strong');
  name.textContent = menu.name;
  wrapper.append(icon, name);
  if (menu.system) {
    const tag = document.createElement('span');
    tag.className = 'ds-tag';
    tag.textContent = '系统';
    wrapper.append(tag);
  }
  return wrapper;
}

function dictionaryItemsTable({ items, selectedDictionary, canManage, onToggle, onEdit, onDelete }) {
  return TableView({
    ariaLabel: '字典项列表',
    className: 'settings-table settings-component-table',
    columns: [
      { key: 'label', title: '显示名称' },
      { key: 'value', title: '字典值', render: value => {
        const code = document.createElement('code');
        code.textContent = value;
        return code;
      } },
      { key: 'sort', title: '排序', sortable: true },
      { key: 'status', title: '状态', render: statusElement },
      {
        key: 'actions',
        title: '操作',
        render: (_value, item) => actionGroup(canManage ? [
          statusAction(item.status, () => onToggle(selectedDictionary.value, item)),
          actionButton('编辑', () => onEdit(selectedDictionary.value, item)),
          actionButton('删除', () => onDelete(selectedDictionary.value, item), 'danger'),
        ] : []),
      },
    ],
    data: items,
    options: { rowKey: 'id', showPagination: true, pageSize: 8, pageSizeOptions: [ 8, 16, 32 ], emptyText: '暂无字典项' },
  });
}

function menuTable({ menus, canManage, onEdit, onToggle }) {
  return TableView({
    ariaLabel: '菜单列表',
    className: 'settings-table settings-component-table',
    columns: [
      { key: 'name', title: '菜单名称', render: (_value, menu) => menuNameElement(menu) },
      { key: 'route', title: '路由', render: value => {
        const code = document.createElement('code');
        code.textContent = value;
        return code;
      } },
      { key: 'routeKey', title: '路由 Key', render: value => {
        const code = document.createElement('code');
        code.textContent = value;
        return code;
      } },
      { key: 'permission', title: '权限 Key', render: value => {
        const code = document.createElement('code');
        code.textContent = value;
        return code;
      } },
      { key: 'status', title: '状态', render: statusElement },
      {
        key: 'actions',
        title: '操作',
        render: (_value, menu) => actionGroup(canManage ? [
          statusAction(menu.status, () => onToggle(menu)),
          actionButton('编辑', () => onEdit(menu)),
        ] : []),
      },
    ],
    data: menus,
    options: { rowKey: 'id', showPagination: true, pageSize: 8, pageSizeOptions: [ 8, 16, 32 ], emptyText: '没有匹配菜单' },
  });
}

function permissionPointTable({ points, pageSize, canManage, onEdit, onToggle, onDelete }) {
  const options = computed(() => ({
    rowKey: 'id',
    showPagination: true,
    pageSize: pageSize.value,
    pageSizeOptions: [ 10, 30, 50 ],
    emptyText: '没有匹配权限点',
  }));

  return TableView({
    ariaLabel: '权限点列表',
    className: 'settings-table settings-component-table',
    columns: [
      { key: 'groupName', title: '分组', render: value => {
        const label = document.createElement('span');
        label.className = 'settings-group-label';
        label.textContent = value;
        return label;
      } },
      { key: 'name', title: '权限名称' },
      { key: 'key', title: '权限 Key', render: value => {
        const code = document.createElement('code');
        code.textContent = value;
        return code;
      } },
      { key: 'description', title: '说明', render: value => {
        const description = document.createElement('span');
        description.className = 'settings-table__description';
        description.textContent = value || '-';
        return description;
      } },
      { key: 'status', title: '状态', render: statusElement },
      {
        key: 'actions',
        title: '操作',
        render: (_value, point) => actionGroup(canManage ? [
          statusAction(point.status, () => onToggle(point)),
          actionButton('编辑', () => onEdit(point)),
          point.system ? null : actionButton('删除', () => onDelete(point), 'danger'),
        ] : []),
      },
    ],
    data: points,
    options,
  });
}

export function settingsHeaderView({ activeTab, stats, onSelectTab }) {
  return html`
    <div class="settings-page__summary">
      <div class="settings-stats">
        ${() => activeTab.value === 'dictionary'
          ? html`${statView('字典', stats.dictionary.value.total)}${statView('启用', stats.dictionary.value.active)}${statView('字典项', stats.dictionary.value.items)}`
          : activeTab.value === 'menu'
            ? html`${statView('菜单', stats.menu.value.total)}${statView('启用', stats.menu.value.active)}${statView('系统菜单', stats.menu.value.system)}`
            : html`${statView('权限点', stats.permission.value.total)}${statView('启用', stats.permission.value.active)}${statView('分组', stats.permission.value.groups)}`}
      </div>
    </div>
    <nav class="settings-tabs" aria-label="系统设置分类">
      ${[ 'dictionary', 'menu', 'permission' ].map(tabKey => {
        const label = tabKey === 'dictionary' ? '字典管理' : tabKey === 'menu' ? '菜单管理' : '权限点管理';
        return html`
          <button
            type="button"
            class="${() => activeTab.value === tabKey ? 'settings-tab is-active' : 'settings-tab'}"
            aria-selected="${() => activeTab.value === tabKey ? 'true' : 'false'}"
            onclick="${() => onSelectTab(tabKey)}"
          >${label}</button>
        `;
      })}
    </nav>
  `;
}

function dictionaryListItem({ dictionary, selectedId, onSelect }) {
  return html`
    <button
      type="button"
      class="${() => selectedId.value === dictionary.id ? 'settings-dictionary-item is-active' : 'settings-dictionary-item'}"
      onclick="${() => onSelect(dictionary.id)}"
    >
      <span class="settings-dictionary-item__main">
        <strong>${dictionary.name}</strong>
        <small>${dictionary.code}</small>
      </span>
      ${statusTag(dictionary.status)}
    </button>
  `;
}

export function dictionaryView({
  dictionaries,
  dictionaryKeyword,
  selectedDictionary,
  selectedDictionaryId,
  dictionaryItemKeyword,
  filteredDictionaryItems,
  canManage,
  onSearch,
  onSelect,
  onItemSearch,
  onToggleDictionary,
  onEditDictionary,
  onAddDictionary,
  onAddItem,
  onEditItem,
  onToggleItem,
  onDeleteItem,
}) {
  return html`
    <section class="${() => selectedDictionary.value ? 'settings-tab-content settings-dictionary-content' : 'settings-tab-content settings-dictionary-content is-empty'}">
      <aside class="settings-side-panel">
        <div class="settings-side-panel__header">
          <div>
            <strong>字典目录</strong>
            <small>${() => `${dictionaries.value.length} 个字典`}</small>
          </div>
          ${canManage ? html`
            <button type="button" class="settings-icon-button" title="新增字典" aria-label="新增字典" onclick="${onAddDictionary}">
              <icon name="plus" size="16"></icon>
            </button>
          ` : ''}
        </div>
        <label class="settings-search">
          <icon name="search" size="16"></icon>
          <input class="settings-search__input" value="${dictionaryKeyword}" oninput="${onSearch}" placeholder="搜索字典" />
        </label>
        <div class="settings-dictionary-list">
          ${() => dictionaries.value.length > 0
            ? dictionaries.value.map(dictionary => dictionaryListItem({
              dictionary,
              selectedId: selectedDictionaryId,
              onSelect,
            }))
            : ''}
          ${() => dictionaries.value.length === 0 ? html`<div class="settings-empty">没有匹配字典</div>` : ''}
        </div>
      </aside>
      <div class="settings-main-panel">
        ${() => selectedDictionary.value
          ? html`
            <div class="settings-panel-heading">
              <div>
                <div class="settings-panel-heading__title">
                  <h2>${() => selectedDictionary.value.name}</h2>
                  ${() => statusTag(selectedDictionary.value.status)}
                </div>
                <p>${() => selectedDictionary.value.description || '暂无描述'}</p>
              </div>
              <div class="settings-panel-actions">
                ${canManage ? html`
                  <button type="button" class="ds-btn ds-btn--secondary" onclick="${() => onToggleDictionary(selectedDictionary.value)}">
                    ${() => selectedDictionary.value.status === 'active' ? '停用字典' : '启用字典'}
                  </button>
                  <button type="button" class="ds-btn ds-btn--secondary" onclick="${() => onEditDictionary(selectedDictionary.value)}">编辑</button>
                  <button type="button" class="ds-btn ds-btn--primary" onclick="${() => onAddItem(selectedDictionary.value)}">
                    <icon name="plus" size="14"></icon><span>新增字典项</span>
                  </button>
                ` : ''}
              </div>
            </div>
            <div class="settings-subtoolbar">
              <span class="settings-subtoolbar__summary">字典项</span>
              <label class="settings-search settings-search--compact">
                <icon name="search" size="15"></icon>
                <input class="settings-search__input" value="${dictionaryItemKeyword}" oninput="${onItemSearch}" placeholder="搜索名称或值" />
              </label>
            </div>
            ${dictionaryItemsTable({
              items: filteredDictionaryItems,
              selectedDictionary,
              canManage,
              onToggle: onToggleItem,
              onEdit: onEditItem,
              onDelete: onDeleteItem,
            })}
          `
          : html`<div class="settings-empty settings-empty--large">没有匹配字典</div>`}
      </div>
    </section>
  `;
}

export function menuView({ menus, menuKeyword, canManage, onSearch, onEdit, onToggle }) {
  return html`
    <section class="settings-tab-content">
      <div class="settings-content-toolbar">
        <div>
          <strong>菜单与路由</strong>
          <span>控制菜单显示状态及其访问权限</span>
        </div>
        <label class="settings-search">
          <icon name="search" size="16"></icon>
          <input class="settings-search__input" value="${menuKeyword}" oninput="${onSearch}" placeholder="搜索菜单、路由或权限" />
        </label>
      </div>
      <div class="settings-table-wrap">
        ${menuTable({ menus, canManage, onEdit, onToggle })}
      </div>
    </section>
  `;
}

export function permissionPointView({ points, permissionKeyword, pageSize, canManage, onSearch, onPageSizeChange, onEdit, onToggle, onDelete, onAdd }) {
  return html`
    <section class="settings-tab-content">
      <div class="settings-content-toolbar">
        <div>
          <strong>权限点</strong>
          <span>角色配置使用的功能权限清单</span>
        </div>
        <div class="settings-content-toolbar__actions">
          <div class="settings-page-size" aria-label="每页显示数量">
            ${[ 10, 30, 50 ].map(size => html`
              <button
                type="button"
                class="${() => pageSize.value === size ? 'settings-page-size__button is-active' : 'settings-page-size__button'}"
                aria-pressed="${() => pageSize.value === size ? 'true' : 'false'}"
                onclick="${() => onPageSizeChange(size)}"
              >${size}条/页</button>
            `)}
          </div>
          <label class="settings-search">
            <icon name="search" size="16"></icon>
            <input class="settings-search__input" value="${permissionKeyword}" oninput="${onSearch}" placeholder="搜索权限点" />
          </label>
          ${canManage ? html`
            <button type="button" class="ds-btn ds-btn--primary" onclick="${onAdd}"><icon name="plus" size="14"></icon><span>新增权限点</span></button>
          ` : ''}
        </div>
      </div>
      <div class="settings-table-wrap">
        ${permissionPointTable({ points, pageSize, canManage, onEdit, onToggle, onDelete })}
      </div>
    </section>
  `;
}

function field(label, name, value, type = 'text', options = null) {
  return html`
    <label class="settings-form__field">
      <span>${label}</span>
      ${options
        ? html`<select name="${name}">${options.map(option => html`<option value="${option.value}" selected="${selectedOption(option.value, value)}">${option.label}</option>`)}</select>`
        : html`<input type="${type}" name="${name}" value="${value || ''}" />`}
    </label>
  `;
}

export function dictionaryFormView({ dictionary, onSubmit, onCancel }) {
  const isEdit = Boolean(dictionary);
  return html`
    <form class="settings-form" onsubmit="${onSubmit}">
      ${field('字典名称', 'name', dictionary?.name)}
      ${field('字典编码', 'code', dictionary?.code)}
      <label class="settings-form__field"><span>描述</span><textarea name="description" maxlength="120">${dictionary?.description || ''}</textarea></label>
      ${field('状态', 'status', dictionary?.status || 'active', 'text', [ { value: 'active', label: '启用' }, { value: 'inactive', label: '停用' } ])}
      <div class="settings-form__actions">
        <button type="button" class="ds-btn ds-btn--secondary" onclick="${onCancel}">取消</button>
        <button type="submit" class="ds-btn ds-btn--primary">${isEdit ? '保存' : '新增'}</button>
      </div>
    </form>
  `;
}

export function dictionaryItemFormView({ item, onSubmit, onCancel }) {
  return html`
    <form class="settings-form" onsubmit="${onSubmit}">
      ${field('显示名称', 'label', item?.label)}
      ${field('字典值', 'value', item?.value)}
      ${field('排序', 'sort', item?.sort || 1, 'number')}
      ${field('状态', 'status', item?.status || 'active', 'text', [ { value: 'active', label: '启用' }, { value: 'inactive', label: '停用' } ])}
      <div class="settings-form__actions">
        <button type="button" class="ds-btn ds-btn--secondary" onclick="${onCancel}">取消</button>
        <button type="submit" class="ds-btn ds-btn--primary">${item ? '保存' : '新增'}</button>
      </div>
    </form>
  `;
}

export function menuFormView({ menu, onSubmit, onCancel }) {
  return html`
    <form class="settings-form" onsubmit="${onSubmit}">
      ${field('菜单名称', 'name', menu?.name)}
      <div class="settings-form__row">${field('路由', 'route', menu?.route)}${field('排序', 'sort', menu?.sort || 1, 'number')}</div>
      <div class="settings-form__row">${field('路由 Key', 'routeKey', menu?.routeKey)}${field('图标 Key', 'icon', menu?.icon)}</div>
      ${field('权限 Key', 'permission', menu?.permission)}
      ${field('状态', 'status', menu?.status || 'active', 'text', [ { value: 'active', label: '启用' }, { value: 'inactive', label: '停用' } ])}
      <div class="settings-form__actions">
        <button type="button" class="ds-btn ds-btn--secondary" onclick="${onCancel}">取消</button>
        <button type="submit" class="ds-btn ds-btn--primary">保存</button>
      </div>
    </form>
  `;
}

export function permissionFormView({ point, onSubmit, onCancel }) {
  return html`
    <form class="settings-form" onsubmit="${onSubmit}">
      <label class="settings-form__field">
        <span>权限分组</span>
        <select name="groupKey">
          ${PERMISSION_GROUPS.map(group => html`<option value="${group.key}" selected="${selectedOption(group.key, point?.groupKey)}">${group.title}</option>`)}
        </select>
      </label>
      ${field('权限名称', 'name', point?.name)}
      ${field('权限 Key', 'key', point?.key)}
      <label class="settings-form__field"><span>说明</span><textarea name="description" maxlength="120">${point?.description || ''}</textarea></label>
      ${field('状态', 'status', point?.status || 'active', 'text', [ { value: 'active', label: '启用' }, { value: 'inactive', label: '停用' } ])}
      <div class="settings-form__actions">
        <button type="button" class="ds-btn ds-btn--secondary" onclick="${onCancel}">取消</button>
        <button type="submit" class="ds-btn ds-btn--primary">${point ? '保存' : '新增'}</button>
      </div>
    </form>
  `;
}

export function settingsPageView({ activeTab, header, dictionary, menu, permission }) {
  return html`
    <div class="settings-page">
      ${header}
      <div class="settings-panels">
        <div class="${() => activeTab.value === 'dictionary' ? 'settings-panel settings-panel--dictionary is-active' : 'settings-panel settings-panel--dictionary'}">${dictionary}</div>
        <div class="${() => activeTab.value === 'menu' ? 'settings-panel settings-panel--menu is-active' : 'settings-panel settings-panel--menu'}">${menu}</div>
        <div class="${() => activeTab.value === 'permission' ? 'settings-panel settings-panel--permission is-active' : 'settings-panel settings-panel--permission'}">${permission}</div>
      </div>
    </div>
  `;
}
