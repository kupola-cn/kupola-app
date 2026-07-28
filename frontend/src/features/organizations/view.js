import { html } from '@kupola/platform';
import { number, schema, schemaSubmit, select, text, textarea } from '@kupola/components/schemaform';
import { ORGANIZATION_TYPES } from './state.js';

const ORGANIZATION_TYPE_OPTIONS = Object.freeze({
  集团: 'group',
  分机构: 'branch',
  部门: 'department',
});

const ORGANIZATION_STATUS_OPTIONS = Object.freeze({
  启用: 'active',
  停用: 'inactive',
});

const organizationFormSchema = schema({
  name: text('机构名称').required().maxlength(30).autocomplete('off'),
  code: text('机构编码')
    .required()
    .pattern('^[a-z][a-z0-9:_-]*$', '机构编码只能使用小写字母、数字、冒号、下划线或短横线，并以字母开头。')
    .autocomplete('off'),
  type: select('类型', ORGANIZATION_TYPE_OPTIONS).activate('department'),
  status: select('状态', ORGANIZATION_STATUS_OPTIONS).activate('active'),
  leader: text('负责人').maxlength(20).autocomplete('off'),
  memberCount: number('成员数').min(0).max(999999),
  address: text('办公地址').maxlength(60),
  description: textarea('说明').maxlength(120),
});

function statusText(status) {
  return status === 'active' ? '启用' : '停用';
}

function statusType(status) {
  return status === 'active' ? 'success' : 'warning';
}

function typeClass(type) {
  return type === 'group'
    ? 'org-type-tag--group'
    : type === 'branch'
      ? 'org-type-tag--branch'
      : 'org-type-tag--department';
}

function getFormValues(organization, parent) {
  if (organization) {
    return {
      name: organization.name,
      code: organization.code,
      type: organization.type,
      status: organization.status,
      leader: organization.leader,
      memberCount: organization.memberCount,
      address: organization.address,
      description: organization.description,
    };
  }

  return {
    type: parent?.type === 'group' ? 'branch' : 'department',
    status: 'active',
    memberCount: 0,
  };
}

export function listToolbarView({
  stats,
  searchKeyword,
  selectedOrganization,
  canCreate = true,
  onSearch,
  onCreateChild,
}) {
  return html`
    <div class="org-toolbar">
      <div class="org-toolbar__summary">${stats}</div>
      <div class="org-toolbar__actions">
        <div class="org-search">
          <icon name="search" size="16"></icon>
          <input
            type="text"
            value="${searchKeyword}"
            oninput="${onSearch}"
            placeholder="搜索机构..."
            class="org-search__input"
          />
        </div>
        ${canCreate
          ? html`
            <button
              type="button"
              class="add-btn org-toolbar__create"
              disabled="${() => selectedOrganization.value ? false : 'disabled'}"
              onclick="${() => onCreateChild(selectedOrganization.value)}"
            >
              <icon name="plus" size="14"></icon>
              <span>新增下级</span>
            </button>
          `
          : ''}
      </div>
    </div>
  `;
}

export function statsView({ organizationStats }) {
  return html`
    <div class="org-stats">
      <div class="org-stat">
        <span>机构</span>
        <strong>${() => organizationStats.value.total}</strong>
      </div>
      <div class="org-stat">
        <span>启用</span>
        <strong>${() => organizationStats.value.active}</strong>
      </div>
      <div class="org-stat">
        <span>分机构</span>
        <strong>${() => organizationStats.value.branches}</strong>
      </div>
      <div class="org-stat">
        <span>成员</span>
        <strong>${() => organizationStats.value.members}</strong>
      </div>
    </div>
  `;
}

function treeTypeIconView(type) {
  if (type !== 'group' && type !== 'branch') {
    return '';
  }
  return html`
    <span class="org-tree-node__type-icon org-tree-node__type-icon--${type}" aria-hidden="true">
      <icon name="plus" size="11"></icon>
    </span>
  `;
}

function organizationTreeNodeView({
  node,
  level,
  selectedOrganizationId,
  expandedIds,
  searchKeyword,
  onSelect,
  onToggle,
  canCreate,
  canEdit,
  canDelete,
  onMove,
  onCreateChild,
  onEdit,
  onDelete,
}) {
  const hasChildren = node.children.length > 0;
  const isSearchMode = () => Boolean(String(searchKeyword.value || '').trim());
  const isExpanded = () => isSearchMode() || expandedIds.value.has(node.id);

  return html`
    <div class="org-tree-node" style="--org-level: ${level}">
      <div class="${() => selectedOrganizationId.value === node.id ? 'org-tree-node__row is-active' : 'org-tree-node__row'}">
        <button
          type="button"
          class="org-tree-node__toggle"
          disabled="${hasChildren ? false : 'disabled'}"
          aria-label="${() => isExpanded() ? `折叠 ${node.name}` : `展开 ${node.name}`}"
          onclick="${event => {
            event.stopPropagation();
            onToggle(node.id);
          }}"
        >
          ${hasChildren ? html`<icon name="${() => isExpanded() ? 'chevron-down' : 'chevron-right'}" size="14"></icon>` : ''}
        </button>

        <button type="button" class="org-tree-node__main" onclick="${() => onSelect(node.id)}">
          <span class="org-tree-node__title">
            ${treeTypeIconView(node.type)}
            <span class="org-tree-node__name">${node.name}</span>
          </span>
          <span class="org-tree-node__meta">
            <span class="org-type-tag ${typeClass(node.type)}">${ORGANIZATION_TYPES[node.type]}</span>
            <span>${node.memberCount} 人</span>
          </span>
        </button>

        <div class="org-tree-node__actions">
          ${canCreate
            ? html`
              <button
                type="button"
                class="permission-icon-btn org-tree-node__create"
                title="新增下级"
                aria-label="新增 ${node.name} 的下级机构"
                onclick="${event => {
                  event.stopPropagation();
                  onCreateChild(node);
                }}"
              >
                <icon name="plus" size="14"></icon>
              </button>
            `
            : ''}
          ${canEdit
            ? html`
              <button
                type="button"
                class="permission-icon-btn"
                title="调整上级"
                aria-label="调整 ${node.name} 的上级机构"
                disabled="${node.parentId == null ? 'disabled' : false}"
                onclick="${event => {
                  event.stopPropagation();
                  onMove(node);
                }}"
              >
                <icon name="link" size="14"></icon>
              </button>
              <button
                type="button"
                class="permission-icon-btn"
                title="编辑"
                aria-label="编辑 ${node.name}"
                onclick="${event => {
                  event.stopPropagation();
                  onEdit(node);
                }}"
              >
                <icon name="edit" size="14"></icon>
              </button>
            `
            : ''}
          ${canDelete
            ? html`
              <button
                type="button"
                class="permission-icon-btn permission-icon-btn--danger"
                title="删除"
                aria-label="删除 ${node.name}"
                disabled="${node.parentId == null ? 'disabled' : false}"
                onclick="${event => {
                  event.stopPropagation();
                  onDelete(node);
                }}"
              >
                <icon name="trash" size="14"></icon>
              </button>
            `
            : ''}
        </div>
      </div>

      ${() => hasChildren && isExpanded()
        ? html`
          <div class="org-tree-node__children">
            ${node.children.map(child => organizationTreeNodeView({
              node: child,
              level: level + 1,
              selectedOrganizationId,
              expandedIds,
              searchKeyword,
              onSelect,
              onToggle,
              canCreate,
              canEdit,
              canDelete,
              onMove,
              onCreateChild,
              onEdit,
              onDelete,
            }))}
          </div>
        `
        : ''}
    </div>
  `;
}

export function organizationTreeView({
  organizations,
  selectedOrganizationId,
  expandedIds,
  searchKeyword,
  onSelect,
  onToggle,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  onMove,
  onCreateChild,
  onEdit,
  onDelete,
  onExpandAll,
  onCollapseAll,
}) {
  return html`
    <aside class="org-tree-panel">
      <div class="org-panel__header">
        <h2>组织架构</h2>
        <div class="org-panel__actions">
          <button type="button" class="ds-btn ds-btn--secondary org-panel__action-btn" onclick="${onExpandAll}">
            展开全部
          </button>
          <button type="button" class="ds-btn ds-btn--secondary org-panel__action-btn" onclick="${onCollapseAll}">
            折叠全部
          </button>
        </div>
      </div>
      <div class="org-tree">
        ${() => organizations.value.length > 0
          ? organizations.value.map(node => organizationTreeNodeView({
            node,
            level: 0,
            selectedOrganizationId,
            expandedIds,
            searchKeyword,
            onSelect,
            onToggle,
            canCreate,
            canEdit,
            canDelete,
            onMove,
            onCreateChild,
            onEdit,
            onDelete,
          }))
          : html`<div class="org-empty">没有匹配机构</div>`}
      </div>
    </aside>
  `;
}

function detailRowView({ label, value }) {
  return html`
    <div class="org-detail-row">
      <span>${label}</span>
      <strong>${value || '-'}</strong>
    </div>
  `;
}

function childItemView({ child, onSelect }) {
  return html`
    <button type="button" class="org-child-item" onclick="${() => onSelect(child.id)}">
      <span>
        <strong>${child.name}</strong>
        <small>${child.code}</small>
      </span>
      <span class="org-child-item__meta">
        <span class="org-type-tag ${typeClass(child.type)}">${ORGANIZATION_TYPES[child.type]}</span>
        <span>${child.memberCount} 人</span>
      </span>
    </button>
  `;
}

function memberItemView({ member }) {
  return html`
    <div class="org-member-item">
      <span class="org-member-item__identity">
        <span class="org-member-item__avatar" aria-hidden="true">${String(member.name || '?').slice(0, 1)}</span>
        <span>
        <strong>${member.name}</strong>
        <small>${member.email}</small>
        </span>
      </span>
      <span class="org-member-item__meta">
        <span>${member.role || '-'}</span>
        <span class="ds-tag ds-tag--${member.status === 'active' ? 'success' : member.status === 'locked' ? 'error' : 'warning'}">
          ${member.status === 'active' ? '启用' : member.status === 'locked' ? '锁定' : '停用'}
        </span>
      </span>
    </div>
  `;
}

export function organizationDetailView({
  organization,
  path,
  children,
  members,
  descendantCount,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  onMove,
  onCreateChild,
  onEdit,
  onDelete,
  onSelectChild,
}) {
  return html`
    <section class="org-detail-panel">
      ${() => organization.value
        ? html`
          <div class="org-detail__header">
            <div>
              <div class="org-detail__title-row">
                <h2>${organization.value.name}</h2>
                <span class="org-type-tag ${typeClass(organization.value.type)}">
                  ${ORGANIZATION_TYPES[organization.value.type]}
                </span>
                <span class="ds-tag ds-tag--${statusType(organization.value.status)}">
                  ${statusText(organization.value.status)}
                </span>
              </div>
              <p class="org-detail__code">${organization.value.code}</p>
              <p class="org-detail__path">${path.value}</p>
            </div>
            <div class="org-detail__actions">
              ${canCreate
                ? html`
                  <button
                    type="button"
                    class="ds-btn ds-btn--secondary org-create-child"
                    onclick="${() => onCreateChild(organization.value)}"
                  >
                    <icon name="plus" size="14"></icon>
                    <span>新增下级</span>
                  </button>
                `
                : ''}
              ${canEdit
                ? html`
                  <button
                    type="button"
                    class="ds-btn ds-btn--secondary org-move"
                    disabled="${() => organization.value?.parentId == null ? 'disabled' : false}"
                    onclick="${() => onMove(organization.value)}"
                  >
                    <icon name="link" size="14"></icon>
                    <span>调整上级</span>
                  </button>
                  <button type="button" class="ds-btn ds-btn--secondary org-edit" onclick="${() => onEdit(organization.value)}">
                    <icon name="edit" size="14"></icon>
                    <span>编辑</span>
                  </button>
                `
                : ''}
              ${canDelete
                ? html`
                  <button
                    type="button"
                    class="ds-btn ds-btn--danger org-delete"
                    disabled="${() => organization.value?.parentId == null ? 'disabled' : false}"
                    onclick="${() => onDelete(organization.value)}"
                  >
                    <icon name="trash" size="14"></icon>
                    <span>删除</span>
                  </button>
                `
                : ''}
            </div>
          </div>

          <div class="org-detail__body">
            <div class="org-detail-grid">
              ${detailRowView({ label: '负责人', value: organization.value.leader })}
              ${detailRowView({ label: '成员数', value: `${organization.value.memberCount} 人` })}
              ${detailRowView({ label: '直属下级', value: `${children.value.length} 个` })}
              ${detailRowView({ label: '全部下级', value: `${descendantCount.value} 个` })}
              ${detailRowView({ label: '办公地址', value: organization.value.address })}
              ${detailRowView({ label: '说明', value: organization.value.description })}
            </div>

            <div class="org-children-section">
              <div class="org-children-section__header">
                <h3>直属下级</h3>
                <span>${() => children.value.length} 个</span>
              </div>
              <div class="org-child-list">
                ${() => children.value.length > 0
                  ? children.value.map(child => childItemView({ child, onSelect: onSelectChild }))
                  : html`<div class="org-empty">暂无直属下级</div>`}
              </div>
            </div>

            <div class="org-members-section">
              <div class="org-children-section__header">
                <h3>直属成员</h3>
                <span>${() => members.value.length} 人</span>
              </div>
              <div class="org-member-list">
                ${() => members.value.length > 0
                  ? members.value.map(member => memberItemView({ member }))
                  : html`<div class="org-empty">暂无直属成员</div>`}
              </div>
            </div>
          </div>
        `
        : html`<div class="org-empty">暂无机构</div>`}
    </section>
  `;
}

export function listPageView({ toolbar, tree, detail }) {
  return html`
    <div class="org-page">
      <div class="org-page__header">${toolbar}</div>
      <div class="org-page__layout">
        ${tree}
        ${detail}
      </div>
    </div>
  `;
}

export function organizationFormView({ organization = null, parent = null, mode = 'create', onSubmit, onCancel }) {
  const isEdit = mode === 'edit';
  const isRoot = organization?.parentId == null && isEdit;
  const values = getFormValues(organization, parent);

  return html`
    <form
      class="ds-schema-form ds-schema-form--dialog org-form"
      novalidate
      onsubmit="${schemaSubmit(organizationFormSchema, onSubmit, { values })}"
    >
      <div class="org-form__parent">
        <span>${isEdit ? '当前机构' : '上级机构'}</span>
        <strong>${isEdit ? organization?.name : parent?.name}</strong>
      </div>

      <div class="ds-schema-form__fields org-form__fields">
        <label class="ds-schema-form__field ds-form-field">
          <span class="ds-schema-form__label ds-form-label">机构名称</span>
          <input k-field="name" />
        </label>

        <div class="org-form__row">
          <label class="ds-schema-form__field ds-form-field">
            <span class="ds-schema-form__label ds-form-label">机构编码</span>
            <input k-field="code" />
          </label>

          <label class="ds-schema-form__field ds-form-field">
            <span class="ds-schema-form__label ds-form-label">类型</span>
            <select k-field="type" disabled="${isRoot ? 'disabled' : false}"></select>
          </label>
        </div>

        <div class="org-form__row">
          <label class="ds-schema-form__field ds-form-field">
            <span class="ds-schema-form__label ds-form-label">状态</span>
            <select k-field="status"></select>
          </label>

          <label class="ds-schema-form__field ds-form-field">
            <span class="ds-schema-form__label ds-form-label">成员数</span>
            <input k-field="memberCount" />
          </label>
        </div>

        <label class="ds-schema-form__field ds-form-field">
          <span class="ds-schema-form__label ds-form-label">负责人</span>
          <input k-field="leader" />
        </label>

        <label class="ds-schema-form__field ds-form-field">
          <span class="ds-schema-form__label ds-form-label">办公地址</span>
          <input k-field="address" />
        </label>

        <label class="ds-schema-form__field ds-form-field">
          <span class="ds-schema-form__label ds-form-label">说明</span>
          <textarea k-field="description"></textarea>
        </label>
      </div>

      <div class="ds-schema-form__actions org-form__actions">
        <button type="button" class="org-form__cancel ds-btn ds-btn--secondary" onclick="${onCancel}">
          取消
        </button>
        <button type="submit" class="add-btn">${isEdit ? '保存' : '新增'}</button>
      </div>
    </form>
  `;
}

export function organizationMoveFormView({
  organization,
  parentOptions,
  onSubmit,
  onCancel,
}) {
  return html`
    <form class="org-move-form" onsubmit="${event => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      onSubmit({ parentId: formData.get('parentId') });
    }}">
      <div class="org-form__parent">
        <span>当前机构</span>
        <strong>${organization?.name || '-'}</strong>
      </div>
      <label class="ds-schema-form__field ds-form-field">
        <span class="ds-schema-form__label ds-form-label">新的上级机构</span>
        <select name="parentId" class="ds-schema-form__control ds-schema-form__select">
          ${parentOptions.map(option => html`
            <option
              value="${option.id}"
              selected="${String(option.id) === String(organization?.parentId) ? 'selected' : false}"
            >
              ${option.name}
            </option>
          `)}
        </select>
      </label>
      <div class="ds-schema-form__actions org-form__actions">
        <button type="button" class="org-form__cancel ds-btn ds-btn--secondary" onclick="${onCancel}">
          取消
        </button>
        <button type="submit" class="add-btn">保存</button>
      </div>
    </form>
  `;
}
