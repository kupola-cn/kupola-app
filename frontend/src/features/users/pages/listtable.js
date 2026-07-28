import { html } from '@kupola/platform';
import { TableView } from '@kupola/components/views';
import { USER_STATUS_OPTIONS } from '../state.js';

const STATUS_META = new Map(USER_STATUS_OPTIONS.map(option => [ option.value, option ]));

function statusMeta(status) {
  return STATUS_META.get(status) || STATUS_META.get('active');
}

function createActionButton({ className, text, onClick }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = text;
  button.addEventListener('click', onClick);
  return button;
}

function statusActionClass(status) {
  const tone = status === 'active' ? 'success' : status === 'inactive' ? 'warning' : 'danger';
  return `action-btn status-btn action-btn--${tone}`;
}

function compareDateTime(left, right, order) {
  const leftValue = Date.parse(String(left || '').replace(' ', 'T'));
  const rightValue = Date.parse(String(right || '').replace(' ', 'T'));
  const leftTime = Number.isFinite(leftValue) ? leftValue : 0;
  const rightTime = Number.isFinite(rightValue) ? rightValue : 0;
  return order === 'asc' ? leftTime - rightTime : rightTime - leftTime;
}

export function ListTable({
  data,
  canView = true,
  canEdit = true,
  canDelete = true,
  selectedIds = null,
  onToggleSelect = () => {},
  onView,
  onEdit,
  onDelete,
  onResetPassword,
  onChangeStatus,
}) {
  const table = TableView({
    ariaLabel: '用户列表',
    className: 'user-list-table',
    columns: [
      {
        key: 'selected',
        title: '选择',
        width: 54,
        align: 'center',
        render: (_value, user) => {
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'user-row-select';
          checkbox.checked = selectedIds?.value?.includes(user.id) || false;
          checkbox.addEventListener('change', () => onToggleSelect(user.id, checkbox.checked));
          return checkbox;
        },
      },
      { key: 'id', title: 'ID', width: 64 },
      { key: 'name', title: '姓名' },
      { key: 'email', title: '邮箱' },
      { key: 'orgName', title: '所属机构' },
      {
        key: 'role',
        title: '角色',
        render: role => {
          const tag = document.createElement('span');
          tag.className = 'ds-tag';
          tag.textContent = role;
          return tag;
        },
      },
      {
        key: 'status',
        title: '状态',
        render: status => {
          const tag = document.createElement('span');
          const meta = statusMeta(status);
          tag.className = `ds-tag ds-tag--${meta.tone}`;
          tag.textContent = meta.label;
          return tag;
        },
      },
      {
        key: 'createdAt',
        title: '创建时间',
        minWidth: 148,
        sortable: true,
        sorter: compareDateTime,
      },
      {
        key: 'lastLogin',
        title: '最后登录',
        minWidth: 148,
        sortable: true,
        sorter: compareDateTime,
      },
      {
        key: 'actions',
        title: '操作',
        render: (_value, user) => {
          const actions = document.createElement('div');
          actions.className = 'table-actions';
          const buttons = [];
          if (canEdit) {
            buttons.push(createActionButton({
              className: 'action-btn action-btn--neutral edit-btn',
              text: '编辑',
              onClick: () => onEdit(user.id),
            }));
            buttons.push(createActionButton({
              className: 'action-btn action-btn--info reset-btn',
              text: '重置密码',
              onClick: () => onResetPassword(user.id),
            }));
            if (user.status !== 'active') {
              buttons.push(createActionButton({
                className: statusActionClass('active'),
                text: '启用',
                onClick: () => onChangeStatus(user.id, 'active'),
              }));
            }
            if (user.status !== 'inactive') {
              buttons.push(createActionButton({
                className: statusActionClass('inactive'),
                text: '停用',
                onClick: () => onChangeStatus(user.id, 'inactive'),
              }));
            }
            if (user.status !== 'locked') {
              buttons.push(createActionButton({
                className: statusActionClass('locked'),
                text: '锁定',
                onClick: () => onChangeStatus(user.id, 'locked'),
              }));
            }
          }
          if (canDelete) {
            buttons.push(createActionButton({
              className: 'action-btn action-btn--danger delete-btn',
              text: '删除',
              onClick: () => onDelete(user.id),
            }));
          }
          actions.append(...buttons);
          return actions;
        },
      },
    ],
    data,
    options: {
      rowKey: 'id',
      showPagination: true,
      pageSize: 15,
      pageSizeOptions: [ 15 ],
    },
  });

  function handleDoubleClick(event) {
    if (!canView || event.target.closest('button, input, select, textarea, a, [role="button"]')) {
      return;
    }
    const row = event.target.closest('tr[data-row-key]');
    if (row) {
      onView?.(row.getAttribute('data-row-key'));
    }
  }

  return html`
    <div class="user-list-table-shell" ondblclick="${handleDoubleClick}">${table}</div>
  `;
}
