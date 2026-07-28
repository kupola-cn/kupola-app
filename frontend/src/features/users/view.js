import { html } from '@kupola/platform';
import { checkbox, email, schema, schemaSubmit, select, text, textarea } from '@kupola/components/schemaform';
import { getActiveRoles } from '../auth/access.js';
import { INITIAL_ORGANIZATIONS } from '../organizations/state.js';
import { USER_STATUS_OPTIONS } from './state.js';

const ROLE_OPTIONS = getActiveRoles().map(role => ({
  label: role.name,
  value: role.code,
  description: role.description,
  system: role.system,
}));
const ORGANIZATION_OPTIONS = INITIAL_ORGANIZATIONS.map(organization => ({
  label: organization.name,
  value: organization.id,
}));
const STATUS_VALUE_TO_OPTION = new Map(USER_STATUS_OPTIONS.map(option => [ option.value, option ]));

export const createUserSchema = schema({
  name: text('姓名').required().autocomplete('name'),
  email: email('邮箱').required().autocomplete('email'),
  orgId: select('所属机构', ORGANIZATION_OPTIONS).required(),
  roleCodes: checkbox('角色', ROLE_OPTIONS).required('请至少选择一个角色。'),
  status: select('状态', Object.fromEntries(USER_STATUS_OPTIONS.map(item => [ item.label, item.value ]))).activate('active'),
  phone: text('手机号').autocomplete('tel'),
  address: textarea('地址').maxlength(80),
});

function getUserFormValues(user, currentUser) {
  return user
    ? {
      name: user.name,
      email: user.email,
      orgId: user.orgId,
      roleCodes: user.roleCodes,
      status: user.status,
      phone: user.phone,
      address: user.address,
    }
    : { orgId: currentUser?.orgId || 1, roleCodes: [ 'viewer' ], status: 'active' };
}

function selectedOption(value, currentValue) {
  return String(value) === String(currentValue) ? 'selected' : false;
}

export function getUserStatusMeta(status) {
  return STATUS_VALUE_TO_OPTION.get(status) || STATUS_VALUE_TO_OPTION.get('active');
}

function filterOptionView({ label, value, currentValue }) {
  return html`
    <option value="${value}" selected="${() => selectedOption(value, currentValue.value)}">${label}</option>
  `;
}

function bulkRoleOptionView({ option, currentValue }) {
  return html`
    <option
      value="${option.value}"
      selected="${() => selectedOption(option.value, currentValue.value)}"
    >${option.label}</option>
  `;
}

function statusFilterButton({ label, value, currentValue, onChange }) {
  return html`
    <button
      type="button"
      class="${() => currentValue.value === value ? 'user-status-filter__button is-active' : 'user-status-filter__button'}"
      aria-pressed="${() => currentValue.value === value ? 'true' : 'false'}"
      onclick="${() => onChange(value)}"
    >${label}</button>
  `;
}

export function listToolbarView({
  searchKeyword,
  organizationFilter,
  roleFilter,
  statusFilter,
  selectedCount,
  bulkRoleCode,
  canCreate = true,
  canBulkEdit = true,
  canBulkDelete = true,
  canImport = false,
  canExport = false,
  onSearch,
  onOrganizationFilter,
  onRoleFilter,
  onStatusFilter,
  onSelectBulkRole,
  onBulkStatus,
  onBulkAssignRole,
  onBulkDelete,
  onImport,
  onImportFile,
  onExport,
  onCreate,
}) {
  return html`
    <div class="user-toolbar">
      <div class="user-toolbar__filters">
        <label class="user-search">
          <icon name="search" size="16"></icon>
          <input
            type="text"
            value="${searchKeyword}"
            oninput="${onSearch}"
            placeholder="搜索姓名、邮箱、机构、角色..."
            class="user-search__input"
          />
        </label>

        <select class="user-filter-select" onchange="${onOrganizationFilter}">
          <option value="" selected="${() => organizationFilter.value ? false : 'selected'}">全部机构</option>
          ${ORGANIZATION_OPTIONS.map(option => filterOptionView({
            label: option.label,
            value: option.value,
            currentValue: organizationFilter,
          }))}
        </select>

        <select class="user-filter-select" onchange="${onRoleFilter}">
          <option value="" selected="${() => roleFilter.value ? false : 'selected'}">全部角色</option>
          ${ROLE_OPTIONS.map(option => filterOptionView({
            label: option.label,
            value: option.value,
            currentValue: roleFilter,
          }))}
        </select>

        <div class="user-status-filter" aria-label="用户状态筛选">
          ${statusFilterButton({ label: '全部状态', value: '', currentValue: statusFilter, onChange: onStatusFilter })}
          ${USER_STATUS_OPTIONS.map(option => statusFilterButton({
            label: option.label,
            value: option.value,
            currentValue: statusFilter,
            onChange: onStatusFilter,
          }))}
        </div>
      </div>

      <div class="user-toolbar__actions">
        <div class="${() => selectedCount.value > 0 ? 'user-bulk-actions is-active' : 'user-bulk-actions'}">
          <span>${() => `已选 ${selectedCount.value} 人`}</span>
          ${canBulkEdit
            ? html`
              <button type="button" class="ds-btn ds-btn--secondary" onclick="${() => onBulkStatus('active')}">
                启用
              </button>
              <button type="button" class="ds-btn ds-btn--secondary" onclick="${() => onBulkStatus('inactive')}">
                停用
              </button>
              <button type="button" class="ds-btn ds-btn--secondary" onclick="${() => onBulkStatus('locked')}">
                锁定
              </button>
              <select class="user-bulk-role" onchange="${onSelectBulkRole}">
                <option value="" selected="${() => bulkRoleCode.value ? false : 'selected'}">分配角色</option>
                ${ROLE_OPTIONS.map(option => bulkRoleOptionView({ option, currentValue: bulkRoleCode }))}
              </select>
              <button
                type="button"
                class="ds-btn ds-btn--secondary"
                disabled="${() => bulkRoleCode.value ? false : 'disabled'}"
                onclick="${onBulkAssignRole}"
              >
                应用
              </button>
            `
            : ''}
          ${canBulkDelete
            ? html`
              <button type="button" class="ds-btn ds-btn--danger" onclick="${onBulkDelete}">
                删除
              </button>
            `
            : ''}
        </div>

        ${(canImport || canExport) ? html`
          <div class="user-data-actions">
            ${canImport ? html`
              <button type="button" class="ds-btn ds-btn--secondary" onclick="${onImport}">
                <icon name="upload" size="14"></icon><span>导入用户</span>
              </button>
              <input
                type="file"
                class="user-import-input"
                accept=".csv,.json,application/json,text/csv"
                aria-label="选择用户导入文件"
                onchange="${onImportFile}"
              />
            ` : ''}
            ${canExport ? html`
              <select class="user-export-select" aria-label="导出格式" onchange="${onExport}">
                <option value="">导出用户</option>
                <option value="csv">导出 CSV</option>
                <option value="json">导出 JSON</option>
              </select>
            ` : ''}
          </div>
        ` : ''}

        ${canCreate
          ? html`
            <button type="button" class="add-btn user-toolbar__create" onclick="${onCreate}">
              <icon name="plus" size="14"></icon>
              <span>新增用户</span>
            </button>
          `
          : ''}
      </div>
    </div>
  `;
}

export function listPageView({ toolbar, table }) {
  return html`
    <div class="user-list">
      <div class="page-header">
        ${toolbar}
      </div>
      <div class="table-container">${table}</div>
    </div>
  `;
}

function roleCheckboxView({ option, currentValues }) {
  const checked = currentValues.includes(option.value);
  return html`
    <label class="ds-checkbox user-role-option">
      <input
        type="checkbox"
        name="roleCodes"
        value="${option.value}"
        data-kupola-ignore
        checked="${checked ? 'checked' : false}"
      />
      <span class="ds-checkbox__box"></span>
      <span class="user-role-option__body">
        <strong>${option.label}</strong>
        <small>${option.value}</small>
      </span>
    </label>
  `;
}

export function createFormView({ user = null, currentUser = null, mode = 'create', onSubmit, onCancel }) {
  const isEdit = mode === 'edit';
  const values = getUserFormValues(user, currentUser);
  const currentRoleCodes = Array.isArray(values.roleCodes) ? values.roleCodes : [];

  return html`
    <form
      class="ds-schema-form ds-schema-form--dialog user-form"
      novalidate
      onsubmit="${schemaSubmit(createUserSchema, onSubmit, { values })}"
    >
      <div class="ds-schema-form__fields user-form__fields">
        <label class="ds-schema-form__field ds-form-field">
          <span class="ds-schema-form__label ds-form-label">姓名</span>
          <input k-field="name" />
        </label>

        <label class="ds-schema-form__field ds-form-field">
          <span class="ds-schema-form__label ds-form-label">邮箱</span>
          <input k-field="email" />
        </label>

        <label class="ds-schema-form__field ds-form-field">
          <span class="ds-schema-form__label ds-form-label">所属机构</span>
          <select k-field="orgId"></select>
        </label>

        <div class="user-form__row">
          <label class="ds-schema-form__field ds-form-field">
            <span class="ds-schema-form__label ds-form-label">状态</span>
            <select k-field="status"></select>
          </label>

          <label class="ds-schema-form__field ds-form-field">
            <span class="ds-schema-form__label ds-form-label">手机号</span>
            <input k-field="phone" />
          </label>
        </div>

        <fieldset class="ds-schema-form__field ds-form-field user-form__roles">
          <legend class="ds-schema-form__label ds-form-label">角色</legend>
          <div class="user-role-options">
            ${ROLE_OPTIONS.map(option => roleCheckboxView({
              option,
              currentValues: currentRoleCodes,
            }))}
          </div>
        </fieldset>

        <label class="ds-schema-form__field ds-form-field">
          <span class="ds-schema-form__label ds-form-label">地址</span>
          <textarea k-field="address"></textarea>
        </label>
      </div>

      <div class="ds-schema-form__actions user-form__actions">
        <button type="button" class="user-form__cancel ds-btn ds-btn--secondary" onclick="${onCancel}">
          取消
        </button>
        <button type="submit" class="add-btn">${isEdit ? '保存' : '新增'}</button>
      </div>
    </form>
  `;
}

function detailFieldView({ label, control }) {
  return html`
    <div class="detail-row detail-row--field ds-form-field">
      <label>${label}</label>
      ${control}
    </div>
  `;
}

function detailOptionView({ label, value, currentValue }) {
  return String(value) === String(currentValue)
    ? html`<option value="${value}" selected>${label}</option>`
    : html`<option value="${value}">${label}</option>`;
}

function detailRoleCheckboxView({ option, currentValues }) {
  const checked = currentValues.includes(option.value);
  return html`
    <label class="ds-checkbox user-role-option">
      <input
        type="checkbox"
        name="roleCodes"
        value="${option.value}"
        checked="${checked ? 'checked' : false}"
      />
      <span class="ds-checkbox__box"></span>
      <span class="user-role-option__body">
        <strong>${option.label}</strong>
        <small>${option.value}</small>
      </span>
    </label>
  `;
}

function detailRowView({ label, content }) {
  return html`
    <div class="detail-row">
      <label>${label}</label>
      <span>${content}</span>
    </div>
  `;
}

function detailEditFormView({ currentUser, onSubmit, onCancel }) {
  return html`
    <form
      class="ds-schema-form user-detail-form"
      novalidate
      onsubmit="${onSubmit}"
    >
      <div class="detail-card">
        <div class="detail-section">
          <h2>基本信息</h2>
          ${detailRowView({ label: '用户ID', content: currentUser.id })}
          ${detailFieldView({
            label: '所属机构',
            control: html`
              <select name="orgId" class="ds-schema-form__control ds-schema-form__select">
                ${ORGANIZATION_OPTIONS.map(option => detailOptionView({
                  label: option.label,
                  value: option.value,
                  currentValue: currentUser.orgId,
                }))}
              </select>
            `,
          })}
          ${detailFieldView({
            label: '姓名',
            control: html`
              <input
                type="text"
                name="name"
                value="${currentUser.name || ''}"
                autocomplete="name"
                class="ds-schema-form__control ds-schema-form__input"
              />
            `,
          })}
          ${detailFieldView({
            label: '邮箱',
            control: html`
              <input
                type="email"
                name="email"
                value="${currentUser.email || ''}"
                autocomplete="email"
                class="ds-schema-form__control ds-schema-form__input"
              />
            `,
          })}
          ${detailFieldView({
            label: '状态',
            control: html`
              <select name="status" class="ds-schema-form__control ds-schema-form__select">
                ${USER_STATUS_OPTIONS.map(option => detailOptionView({
                  ...option,
                  currentValue: currentUser.status,
                }))}
              </select>
            `,
          })}
          ${detailFieldView({
            label: '角色',
            control: html`
              <div class="user-role-options user-role-options--detail">
                ${ROLE_OPTIONS.map(option => detailRoleCheckboxView({
                  option,
                  currentValues: currentUser.roleCodes || [],
                }))}
              </div>
            `,
          })}
        </div>

        <div class="detail-section">
          <h2>联系方式</h2>
          ${detailFieldView({
            label: '手机号',
            control: html`
              <input
                type="tel"
                name="phone"
                value="${currentUser.phone || ''}"
                autocomplete="tel"
                class="ds-schema-form__control ds-schema-form__input"
              />
            `,
          })}
          ${detailFieldView({
            label: '地址',
            control: html`
              <textarea
                name="address"
                class="ds-schema-form__control ds-schema-form__textarea ds-textarea"
              >${currentUser.address || ''}</textarea>
            `,
          })}
        </div>

        <div class="detail-section">
          <h2>时间信息</h2>
          ${detailRowView({ label: '创建时间', content: currentUser.createdAt || '-' })}
          ${detailRowView({ label: '最后登录', content: currentUser.lastLogin || '-' })}
        </div>
      </div>

      <div class="user-detail__actions">
        <button type="button" class="ds-btn ds-btn--secondary" onclick="${onCancel}">取消</button>
        <button type="submit" class="ds-btn ds-btn--primary">保存</button>
      </div>
    </form>
  `;
}

function detailHeaderView({ onBack }) {
  return html`
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" onclick="${onBack}">← 返回</button>
        <h1>用户详情</h1>
      </div>
    </div>
  `;
}

function statusTagView(status) {
  const meta = getUserStatusMeta(status);
  return html`<span class="ds-tag ds-tag--${meta.tone}">${meta.label}</span>`;
}

function detailActionsView({
  currentUser,
  onEdit,
  onDelete,
  onResetPassword,
  onChangeStatus,
}) {
  return html`
    <div class="user-detail__actions">
      ${onChangeStatus && currentUser.status !== 'active'
        ? html`<button type="button" class="ds-btn ds-btn--secondary" onclick="${() => onChangeStatus(currentUser.id, 'active')}">启用</button>`
        : ''}
      ${onChangeStatus && currentUser.status !== 'inactive'
        ? html`<button type="button" class="ds-btn ds-btn--secondary" onclick="${() => onChangeStatus(currentUser.id, 'inactive')}">停用</button>`
        : ''}
      ${onChangeStatus && currentUser.status !== 'locked'
        ? html`<button type="button" class="ds-btn ds-btn--secondary" onclick="${() => onChangeStatus(currentUser.id, 'locked')}">锁定</button>`
        : ''}
      ${onResetPassword
        ? html`<button type="button" class="ds-btn ds-btn--secondary" onclick="${() => onResetPassword(currentUser.id)}">重置密码</button>`
        : ''}
      ${onEdit
        ? html`<button type="button" class="ds-btn ds-btn--secondary edit-btn" onclick="${onEdit}">编辑用户</button>`
        : ''}
      ${onDelete
        ? html`<button type="button" class="ds-btn ds-btn--danger delete-btn" onclick="${onDelete}">删除用户</button>`
        : ''}
    </div>
  `;
}

function userDetailContentView({
  currentUser,
  onBack,
  onEdit,
  onDelete,
  onResetPassword,
  onChangeStatus,
  showHeader,
  showActions,
}) {
  return html`
    ${showHeader ? detailHeaderView({ onBack }) : ''}
    <div class="detail-card">
      <div class="detail-section">
        <h2>基本信息</h2>
        ${detailRowView({ label: '用户ID', content: currentUser.id })}
        ${detailRowView({ label: '所属机构', content: currentUser.orgName || '-' })}
        ${detailRowView({ label: '姓名', content: currentUser.name })}
        ${detailRowView({ label: '邮箱', content: currentUser.email })}
        <div class="detail-row">
          <label>状态</label>
          ${statusTagView(currentUser.status)}
        </div>
        <div class="detail-row">
          <label>角色</label>
          <span class="role-tag">${currentUser.role || '-'}</span>
        </div>
      </div>

      <div class="detail-section">
        <h2>联系方式</h2>
        ${detailRowView({ label: '手机号', content: currentUser.phone || '-' })}
        ${detailRowView({ label: '地址', content: currentUser.address || '-' })}
      </div>

      <div class="detail-section">
        <h2>时间信息</h2>
        ${detailRowView({ label: '创建时间', content: currentUser.createdAt || '-' })}
        ${detailRowView({ label: '最后登录', content: currentUser.lastLogin || '-' })}
      </div>
    </div>
    ${showActions ? detailActionsView({
      currentUser,
      onEdit,
      onDelete,
      onResetPassword,
      onChangeStatus,
    }) : ''}
  `;
}

export function detailPageView({
  user,
  onBack = () => {},
  onEdit = null,
  onDelete = null,
  onResetPassword = null,
  onChangeStatus = null,
  onSubmitEdit = null,
  onCancelEdit = null,
  editing = null,
  showHeader = true,
  showActions = Boolean(onEdit || onDelete),
} = {}) {
  return html`
    <div class="user-detail">
      ${() => {
        const currentUser = user.value;
        const isEditing = Boolean(editing?.value);
        if (currentUser && isEditing) {
          return detailEditFormView({
            currentUser,
            onSubmit: onSubmitEdit,
            onCancel: onCancelEdit,
          });
        }
        return currentUser
          ? userDetailContentView({
            currentUser,
            onBack,
            onEdit,
            onDelete,
            onResetPassword,
            onChangeStatus,
            showHeader,
            showActions,
          })
          : html`<div class="detail-card detail-empty">用户不存在或已删除</div>`;
      }}
    </div>
  `;
}
