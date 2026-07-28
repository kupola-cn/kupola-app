import { html } from '@kupola/platform';
import { schema, schemaSubmit, select, text, textarea } from '@kupola/components/schemaform';
import { ORGANIZATION_TYPES } from '../organizations/state.js';
import { DATA_SCOPE_OPTIONS } from './state.js';

const roleFormSchema = schema({
  name: text('角色名称').required().maxlength(20).autocomplete('off'),
  code: text('角色编码')
    .required()
    .pattern('^[a-z][a-z0-9:_-]*$', '角色编码只能使用小写字母、数字、冒号、下划线或短横线，并以字母开头。')
    .autocomplete('off'),
  description: textarea('说明').maxlength(80),
  status: select('状态', { 启用: 'active', 停用: 'inactive' }).activate('active'),
});

function roleStatusText(status) {
  return status === 'active' ? '启用' : '停用';
}

function roleStatusType(status) {
  return status === 'active' ? 'success' : 'warning';
}

function dataScopeLabel(type) {
  return DATA_SCOPE_OPTIONS.find(option => option.type === type)?.label || '未设置';
}

function dataScopeShortLabel(type) {
  return DATA_SCOPE_OPTIONS.find(option => option.type === type)?.shortLabel || '未设置';
}

function dataScopeSummary(dataScope) {
  const scope = dataScope.value;
  if (scope.type === 'customOrgs') {
    return scope.organizationIds.length > 0
      ? `指定 ${scope.organizationIds.length} 个机构`
      : '指定机构';
  }
  return dataScopeLabel(scope.type);
}

function organizationTypeClass(type) {
  return type === 'group'
    ? 'org-type-tag--group'
    : type === 'branch'
      ? 'org-type-tag--branch'
      : 'org-type-tag--department';
}

function organizationTreeIconView(type) {
  if (type !== 'group' && type !== 'branch') {
    return '';
  }
  return html`
    <span class="org-tree-node__type-icon org-tree-node__type-icon--${type}" aria-hidden="true">
      <icon name="plus" size="11"></icon>
    </span>
  `;
}

function permissionKeysForGroup(group) {
  return group.permissions.map(permission => permission.key);
}

function countGroupSelected(group, draftPermissionKeys) {
  const currentKeys = draftPermissionKeys.value;
  return group.permissions.filter(permission => currentKeys.has(permission.key)).length;
}

function isGroupChecked(group, draftPermissionKeys) {
  const currentKeys = draftPermissionKeys.value;
  return group.permissions.every(permission => currentKeys.has(permission.key));
}

function isGroupPartial(group, draftPermissionKeys) {
  const selectedCount = countGroupSelected(group, draftPermissionKeys);
  return selectedCount > 0 && selectedCount < group.permissions.length;
}

export function listToolbarView({ stats, searchKeyword, canCreate = true, onSearch, onCreate }) {
  return html`
    <div class="permission-toolbar">
      <div class="permission-toolbar__summary">${stats}</div>
      <div class="permission-toolbar__actions">
        <div class="permission-search">
          <icon name="search" size="16"></icon>
          <input
            type="text"
            value="${searchKeyword}"
            oninput="${onSearch}"
            placeholder="搜索角色..."
            class="permission-search__input"
          />
        </div>
        ${canCreate
          ? html`
            <button type="button" class="add-btn permission-toolbar__create" onclick="${onCreate}">
              <icon name="plus" size="14"></icon>
              <span>新增角色</span>
            </button>
          `
          : ''}
      </div>
    </div>
  `;
}

export function statsView({ roleStats }) {
  return html`
    <div class="permission-stats">
      <div class="permission-stat">
        <span>角色</span>
        <strong>${() => roleStats.value.total}</strong>
      </div>
      <div class="permission-stat">
        <span>启用</span>
        <strong>${() => roleStats.value.active}</strong>
      </div>
      <div class="permission-stat">
        <span>停用</span>
        <strong>${() => roleStats.value.inactive}</strong>
      </div>
      <div class="permission-stat">
        <span>权限点</span>
        <strong>${() => roleStats.value.permissionTotal}</strong>
      </div>
    </div>
  `;
}

function roleCardView({
  role,
  selectedRoleId,
  totalPermissionCount,
  canEdit = true,
  canCopy = true,
  canDelete = true,
  onSelect,
  onEdit,
  onCopy,
  onDelete,
}) {
  return html`
    <div class="${() => selectedRoleId.value === role.id ? 'permission-role-card is-active' : 'permission-role-card'}">
      <button
        type="button"
        class="permission-role-card__main"
        onclick="${() => onSelect(role.id)}"
      >
        <span class="permission-role-card__title">
          <span>${role.name}</span>
          ${role.system ? html`<span class="ds-tag permission-role-card__system">系统</span>` : ''}
        </span>
        <span class="permission-role-card__code">${role.code}</span>
        <span class="permission-role-card__meta">
          <span>${role.userCount} 个用户</span>
          <span>${role.permissions.length}/${totalPermissionCount} 权限</span>
          <span>${dataScopeShortLabel(role.dataScope?.type)}</span>
        </span>
      </button>
      <div class="permission-role-card__actions">
        <span class="ds-tag ds-tag--${roleStatusType(role.status)}">${roleStatusText(role.status)}</span>
        ${canEdit
          ? html`
            <button
              type="button"
              class="permission-icon-btn"
              title="编辑"
              aria-label="编辑 ${role.name}"
              onclick="${() => onEdit(role)}"
            >
              <icon name="edit" size="14"></icon>
            </button>
          `
          : ''}
        ${canCopy
          ? html`
            <button
              type="button"
              class="permission-icon-btn"
              title="复制"
              aria-label="复制 ${role.name}"
              onclick="${() => onCopy(role)}"
            >
              <icon name="copy" size="14"></icon>
            </button>
          `
          : ''}
        ${canDelete
          ? html`
            <button
              type="button"
              class="permission-icon-btn permission-icon-btn--danger"
              title="删除"
              aria-label="删除 ${role.name}"
              disabled="${role.system ? 'disabled' : false}"
              onclick="${() => onDelete(role)}"
            >
              <icon name="trash" size="14"></icon>
            </button>
          `
          : ''}
      </div>
    </div>
  `;
}

export function roleListView({
  roles,
  selectedRoleId,
  totalPermissionCount,
  canEdit = true,
  canCopy = true,
  canDelete = true,
  onSelect,
  onEdit,
  onCopy,
  onDelete,
}) {
  return html`
    <aside class="permission-roles-panel">
      <div class="permission-panel__header">
        <h2>角色</h2>
      </div>
      <div class="permission-role-list">
        ${() => roles.value.length > 0
          ? roles.value.map(role => roleCardView({
            role,
            selectedRoleId,
            totalPermissionCount,
            canEdit,
            canCopy,
            canDelete,
            onSelect,
            onEdit,
            onCopy,
            onDelete,
          }))
          : html`<div class="permission-empty">没有匹配角色</div>`}
      </div>
    </aside>
  `;
}

function dataScopeOptionView({
  option,
  role,
  draftDataScope,
  canAssign,
  onChangeDataScopeType,
}) {
  return html`
    <label class="${() => draftDataScope.value.type === option.type ? 'permission-scope-option is-active' : 'permission-scope-option'}">
      <span class="ds-radio permission-scope-option__radio">
        <input
          type="radio"
          name="permission-data-scope"
          value="${option.type}"
          checked="${() => draftDataScope.value.type === option.type ? 'checked' : false}"
          disabled="${() => role.value?.system || !canAssign ? 'disabled' : false}"
          onchange="${() => onChangeDataScopeType(option.type)}"
        />
        <span class="ds-radio__dot"></span>
      </span>
      <span class="permission-scope-option__body">
        <strong>${option.label}</strong>
        <small>${option.description}</small>
      </span>
    </label>
  `;
}

function isOrganizationChecked(draftDataScope, organizationId) {
  return draftDataScope.value.organizationIds.includes(organizationId);
}

function dataScopeTreeNodeView({
  node,
  level,
  role,
  draftDataScope,
  expandedIds,
  canAssign,
  onToggleOrganizationExpanded,
  onToggleDataScopeOrganization,
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = () => expandedIds.value.has(node.id);

  return html`
    <li class="permission-scope-tree-node" style="--scope-level: ${level}">
      <div class="permission-scope-tree-node__row">
        <button
          type="button"
          class="permission-scope-tree-node__toggle"
          disabled="${hasChildren ? false : 'disabled'}"
          aria-label="${() => isExpanded() ? `折叠 ${node.name}` : `展开 ${node.name}`}"
          onclick="${event => {
            event.stopPropagation();
            onToggleOrganizationExpanded(node.id);
          }}"
        >
          ${hasChildren ? html`<icon name="${() => isExpanded() ? 'chevron-down' : 'chevron-right'}" size="14"></icon>` : ''}
        </button>

        <label class="ds-checkbox permission-scope-tree-node__label">
          <input
            type="checkbox"
            checked="${() => isOrganizationChecked(draftDataScope, node.id) ? 'checked' : false}"
            disabled="${() => role.value?.system || !canAssign ? 'disabled' : false}"
            onchange="${event => onToggleDataScopeOrganization(node.id, event.target.checked)}"
          />
          <span class="ds-checkbox__box"></span>
          <span class="permission-scope-tree-node__name">
            ${organizationTreeIconView(node.type)}
            <span>${node.name}</span>
            <small class="org-type-tag ${organizationTypeClass(node.type)}">${ORGANIZATION_TYPES[node.type]}</small>
          </span>
        </label>
      </div>

      ${() => hasChildren && isExpanded()
        ? html`
          <ul class="permission-scope-tree-node__children">
            ${node.children.map(child => dataScopeTreeNodeView({
              node: child,
              level: level + 1,
              role,
              draftDataScope,
              expandedIds,
              canAssign,
              onToggleOrganizationExpanded,
              onToggleDataScopeOrganization,
            }))}
          </ul>
        `
        : ''}
    </li>
  `;
}

function dataScopeSectionView({
  dataScopeOptions,
  role,
  draftDataScope,
  organizations,
  organizationExpandedIds,
  canAssign,
  onChangeDataScopeType,
  onToggleOrganizationExpanded,
  onExpandOrganizations,
  onCollapseOrganizations,
  onToggleDataScopeOrganization,
  onClearDataScopeOrganizations,
}) {
  return html`
    <section class="permission-config-section permission-scope-section">
      <div class="permission-config-section__header">
        <div>
          <h4>数据范围</h4>
          <span>${() => dataScopeSummary(draftDataScope)}</span>
        </div>
      </div>

      <div class="permission-scope-options">
        ${dataScopeOptions.map(option => dataScopeOptionView({
          option,
          role,
          draftDataScope,
          canAssign,
          onChangeDataScopeType,
        }))}
      </div>

      ${() => draftDataScope.value.type === 'customOrgs'
        ? html`
          <div class="permission-scope-tree">
            <div class="permission-scope-tree__header">
              <span>指定机构</span>
              <div class="permission-scope-tree__actions">
                <button
                  type="button"
                  class="ds-btn ds-btn--secondary permission-scope-tree__action"
                  onclick="${onExpandOrganizations}"
                >展开全部</button>
                <button
                  type="button"
                  class="ds-btn ds-btn--secondary permission-scope-tree__action"
                  onclick="${onCollapseOrganizations}"
                >折叠全部</button>
                <button
                  type="button"
                  class="ds-btn ds-btn--secondary permission-scope-tree__action"
                  disabled="${() => role.value?.system || !canAssign || draftDataScope.value.organizationIds.length === 0 ? 'disabled' : false}"
                  onclick="${onClearDataScopeOrganizations}"
                >清空</button>
              </div>
            </div>
            <ul class="permission-scope-tree__list">
              ${() => organizations.value.length > 0
                ? organizations.value.map(node => dataScopeTreeNodeView({
                  node,
                  level: 0,
                  role,
                  draftDataScope,
                  expandedIds: organizationExpandedIds,
                  canAssign,
                  onToggleOrganizationExpanded,
                  onToggleDataScopeOrganization,
                }))
                : html`<li class="permission-empty">暂无机构</li>`}
            </ul>
          </div>
        `
        : ''}
    </section>
  `;
}

function permissionItemView({
  role,
  permission,
  draftPermissionKeys,
  canAssign,
  onTogglePermission,
}) {
  return html`
    <label class="${() => draftPermissionKeys.value.has(permission.key) ? 'permission-item is-checked' : 'permission-item'}">
      <input
        type="checkbox"
        class="permission-item__checkbox"
        checked="${() => draftPermissionKeys.value.has(permission.key) ? 'checked' : false}"
        disabled="${() => role.value?.system || !canAssign ? 'disabled' : false}"
        onchange="${event => onTogglePermission(permission.key, event.target.checked)}"
      />
      <span class="permission-item__body">
        <span class="permission-item__title">${permission.label}</span>
        <span class="permission-item__key">${permission.key}</span>
        <span class="permission-item__desc">${permission.description}</span>
      </span>
    </label>
  `;
}

function permissionGroupView({
  group,
  role,
  draftPermissionKeys,
  canAssign,
  onToggleGroup,
  onTogglePermission,
}) {
  return html`
    <section class="${() => isGroupPartial(group, draftPermissionKeys) ? 'permission-group is-partial' : 'permission-group'}">
      <div class="permission-group__header">
        <label class="permission-group__check">
          <input
            type="checkbox"
            checked="${() => isGroupChecked(group, draftPermissionKeys) ? 'checked' : false}"
            disabled="${() => role.value?.system || !canAssign ? 'disabled' : false}"
            onchange="${event => onToggleGroup(
              group.key,
              event.target.checked,
              permissionKeysForGroup(group),
            )}"
          />
          <span>
            <strong>${group.title}</strong>
            <small>${group.description}</small>
          </span>
        </label>
        <span class="permission-group__count">
          ${() => countGroupSelected(group, draftPermissionKeys)}/${group.permissions.length}
        </span>
      </div>

      <div class="permission-group__items">
        ${permissionKeysForGroup(group).map(key => {
          const permission = group.permissions.find(item => item.key === key);
          return permissionItemView({
            role,
            permission,
            draftPermissionKeys,
            canAssign,
            onTogglePermission,
          });
        })}
      </div>
    </section>
  `;
}

function saveStatusText(status) {
  if (status === 'saving') {
    return '保存中...';
  }
  if (status === 'success') {
    return '已保存';
  }
  if (status === 'error') {
    return '保存失败';
  }
  return '保存';
}

function hasChangePreview(preview) {
  return preview.added.length > 0
    || preview.removed.length > 0
    || Boolean(preview.dataScope);
}

function permissionChangeListView({ title, items, type }) {
  return html`
    <div class="permission-preview__group permission-preview__group--${type}">
      <strong>${title}</strong>
      ${items.length > 0
        ? html`
          <div class="permission-preview__items">
            ${items.map(item => html`
              <span class="permission-preview__item">
                <span>${item.label}</span>
                <small>${item.key}</small>
              </span>
            `)}
          </div>
        `
        : html`<span class="permission-preview__empty">无</span>`}
    </div>
  `;
}

function permissionChangePreviewView({ preview }) {
  return html`
    <div class="permission-preview">
      <div class="permission-preview__header">
        <h4>变更预览</h4>
      </div>
      <div class="permission-preview__body">
        ${permissionChangeListView({ title: '新增权限', items: preview.added, type: 'added' })}
        ${permissionChangeListView({ title: '移除权限', items: preview.removed, type: 'removed' })}
        ${preview.dataScope
          ? html`
            <div class="permission-preview__group">
              <strong>数据范围</strong>
              <span class="permission-preview__scope">
                ${preview.dataScope.from} → ${preview.dataScope.to}
              </span>
            </div>
          `
          : ''}
      </div>
    </div>
  `;
}

export function permissionMatrixView({
  groups,
  role,
  permissionKeyword,
  draftPermissionKeys,
  draftDataScope,
  isPermissionDirty,
  permissionChangePreview,
  saveStatus,
  selectedPermissionCount,
  totalPermissionCount,
  matchedPermissionCount,
  dataScopeOptions,
  organizations,
  organizationExpandedIds,
  canAssign = true,
  onToggleGroup,
  onTogglePermission,
  onSearchPermissions,
  onChangeDataScopeType,
  onToggleOrganizationExpanded,
  onExpandOrganizations,
  onCollapseOrganizations,
  onToggleDataScopeOrganization,
  onClearDataScopeOrganizations,
  onSelectAll,
  onClear,
  onReset,
  onSave,
}) {
  return html`
    <section class="permission-matrix">
      <div class="permission-matrix__toolbar">
        <div>
          <h3>角色配置</h3>
          <span class="permission-matrix__summary">
            ${() => `${selectedPermissionCount.value}/${totalPermissionCount} 功能权限 · ${dataScopeSummary(draftDataScope)}`}
            ${() => permissionKeyword.value
              ? ` · 匹配 ${matchedPermissionCount.value} 个权限`
              : ''}
          </span>
        </div>
        <div class="permission-matrix__actions">
          <label class="permission-matrix-search">
            <icon name="search" size="15"></icon>
            <input
              type="text"
              value="${permissionKeyword}"
              oninput="${onSearchPermissions}"
              placeholder="搜索权限..."
              class="permission-matrix-search__input"
            />
          </label>
          <button
            type="button"
            class="ds-btn ds-btn--secondary"
            disabled="${() => role.value?.system || !canAssign || saveStatus.value === 'saving' ? 'disabled' : false}"
            onclick="${onSelectAll}"
          >全选</button>
          <button
            type="button"
            class="ds-btn ds-btn--secondary"
            disabled="${() => role.value?.system || !canAssign || saveStatus.value === 'saving' ? 'disabled' : false}"
            onclick="${onClear}"
          >清空</button>
          <button
            type="button"
            class="ds-btn ds-btn--secondary"
            disabled="${() => role.value?.system || !canAssign || saveStatus.value === 'saving' || !isPermissionDirty.value ? 'disabled' : false}"
            onclick="${onReset}"
          >重置</button>
          <button
            type="button"
            class="ds-btn ds-btn--primary"
            disabled="${() => role.value?.system || !canAssign || saveStatus.value === 'saving' || !isPermissionDirty.value ? 'disabled' : false}"
            onclick="${onSave}"
          >
            <icon name="check" size="14"></icon>
            <span>${() => saveStatusText(saveStatus.value)}</span>
          </button>
        </div>
      </div>

      ${() => role.value?.system
        ? html`<div class="permission-system-note">系统角色默认保留全部权限和全部数据范围。</div>`
        : ''}

      ${() => !role.value?.system && isPermissionDirty.value && hasChangePreview(permissionChangePreview.value)
        ? permissionChangePreviewView({ preview: permissionChangePreview.value })
        : ''}

      ${dataScopeSectionView({
        dataScopeOptions,
        role,
        draftDataScope,
        organizations,
        organizationExpandedIds,
        canAssign,
        onChangeDataScopeType,
        onToggleOrganizationExpanded,
        onExpandOrganizations,
        onCollapseOrganizations,
        onToggleDataScopeOrganization,
        onClearDataScopeOrganizations,
      })}

      <section class="permission-config-section permission-function-section">
        <div class="permission-config-section__header">
          <div>
            <h4>功能权限</h4>
            <span>${() => selectedPermissionCount.value}/${totalPermissionCount} 已选择</span>
          </div>
        </div>
        <div class="permission-groups">
          ${() => groups.value.length > 0
            ? groups.value.map(group => permissionGroupView({
              group,
              role,
              draftPermissionKeys,
              canAssign,
              onToggleGroup,
              onTogglePermission,
            }))
            : html`<div class="permission-empty">没有匹配权限</div>`}
        </div>
      </section>
    </section>
  `;
}

export function roleDetailView({
  role,
  totalPermissionCount,
  selectedPermissionCount,
  permissionMatrix,
}) {
  return html`
    <section class="permission-detail-panel">
      ${() => role.value
        ? html`
          <div class="permission-detail__header">
            <div>
              <div class="permission-detail__title-row">
                <h2>${role.value.name}</h2>
                <span class="ds-tag ds-tag--${roleStatusType(role.value.status)}">
                  ${roleStatusText(role.value.status)}
                </span>
              </div>
              <p class="permission-detail__code">${role.value.code}</p>
              <p class="permission-detail__desc">${role.value.description || '-'}</p>
            </div>
            <div class="permission-detail__meter">
              <strong>${() => Math.round((selectedPermissionCount.value / totalPermissionCount) * 100)}%</strong>
              <span>${() => selectedPermissionCount.value}/${totalPermissionCount}</span>
            </div>
          </div>
          ${permissionMatrix}
        `
        : html`<div class="permission-empty">暂无角色</div>`}
    </section>
  `;
}

export function listPageView({ toolbar, roleList, detail }) {
  return html`
    <div class="permission-page">
      <div class="permission-page__header">
        ${toolbar}
      </div>

      <div class="permission-page__layout">
        ${roleList}
        ${detail}
      </div>
    </div>
  `;
}

export function roleFormView({ role, mode = 'create', onSubmit, onCancel }) {
  const isEdit = mode === 'edit';
  const values = role
    ? {
      name: role.name,
      code: role.code,
      description: role.description,
      status: role.status,
    }
    : { status: 'active' };

  return html`
    <form
      class="ds-schema-form ds-schema-form--dialog permission-form"
      novalidate
      onsubmit="${schemaSubmit(roleFormSchema, onSubmit, { values })}"
    >
      <div class="ds-schema-form__fields permission-form__fields">
        <label class="ds-schema-form__field ds-form-field">
          <span class="ds-schema-form__label ds-form-label">角色名称</span>
          <input k-field="name" />
        </label>

        <div class="permission-form__row">
          <label class="ds-schema-form__field ds-form-field">
            <span class="ds-schema-form__label ds-form-label">角色编码</span>
            <input k-field="code" readonly="${isEdit && role?.system ? 'readonly' : false}" />
          </label>

          <label class="ds-schema-form__field ds-form-field">
            <span class="ds-schema-form__label ds-form-label">状态</span>
            <select k-field="status"></select>
          </label>
        </div>

        <label class="ds-schema-form__field ds-form-field">
          <span class="ds-schema-form__label ds-form-label">说明</span>
          <textarea k-field="description"></textarea>
        </label>
      </div>

      <div class="ds-schema-form__actions permission-form__actions">
        <button type="button" class="permission-form__cancel ds-btn ds-btn--secondary" onclick="${onCancel}">
          取消
        </button>
        <button type="submit" class="add-btn">${isEdit ? '保存' : '新增'}</button>
      </div>
    </form>
  `;
}
