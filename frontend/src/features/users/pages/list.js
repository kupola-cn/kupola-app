import { computed, signal } from '@kupola/platform';
import { useAuth } from '@kupola/auth';
import { Dialog } from '@kupola/components';
import { Message } from '@kupola/components/message';
import { useOverlay } from '@kupola/components/overlay';
import { validateSchema } from '@kupola/components/schemaform';
import { getApiErrorMessage } from '../../../api/client.js';
import {
  createUser as createUserRequest,
  deleteUser as deleteUserRequest,
  listUsers,
  updateUser as updateUserRequest,
} from '../../../api/users.js';
import { hasPermission } from '../../auth/access.js';
import { ListTable } from './listtable.js';
import { createListState, USER_STATUS_OPTIONS } from '../state.js';
import {
  createUserSchema,
  createFormView,
  detailPageView,
  listPageView,
  listToolbarView,
} from '../view.js';

const USER_STATUS_LABELS = Object.fromEntries(USER_STATUS_OPTIONS.map(option => [ option.value, option.label ]));

function normalizeUserInput(data, currentUser = null) {
  const roleCodes = Array.isArray(data.roleCodes)
    ? data.roleCodes
    : [ data.role || data.roleCodes ];
  return {
    name: String(data.name || '').trim(),
    email: String(data.email || '').trim().toLowerCase(),
    roleCodes: [ ...new Set(roleCodes.map(code => String(code || '').trim()).filter(Boolean)) ],
    status: data.status,
    phone: String(data.phone || '').trim(),
    address: String(data.address || '').trim(),
    orgId: Number(data.orgId || currentUser?.orgId) || null,
  };
}

function readUserFormData(formElement) {
  const formData = new FormData(formElement);
  return {
    name: formData.get('name'),
    email: formData.get('email'),
    orgId: formData.get('orgId'),
    roleCodes: formData.getAll('roleCodes'),
    status: formData.get('status'),
    phone: formData.get('phone'),
    address: formData.get('address'),
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') {
        index += 1;
      }
      row.push(field.trim());
      if (row.some(value => value)) {
        rows.push(row);
      }
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (field || row.length > 0) {
    row.push(field.trim());
    if (row.some(value => value)) {
      rows.push(row);
    }
  }

  if (rows.length < 2) {
    return [];
  }
  const headers = rows[0].map(header => header.replace(/^\uFEFF/, '').trim());
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [ header, values[index] || '' ])));
}

async function parseImportFile(file) {
  const text = await file.text();
  if (file.name.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : Array.isArray(parsed?.users) ? parsed.users : [];
  }
  return parseCsv(text);
}

function normalizeImportRow(row, currentUser) {
  const roleCodes = Array.isArray(row.roleCodes)
    ? row.roleCodes
    : String(row.roleCodes || row.role || '')
      .split(/[,，、|]/)
      .map(value => value.trim())
      .filter(Boolean);
  return normalizeUserInput({
    ...row,
    roleCodes,
    orgId: row.orgId || row.organizationId,
    status: row.status || 'active',
  }, currentUser);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([ content ], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function csvValue(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportUsersAsCsv(users) {
  const headers = [ 'name', 'email', 'orgId', 'roleCodes', 'status', 'phone', 'address' ];
  const rows = users.map(user => [
    user.name,
    user.email,
    user.orgId,
    user.roleCodes.join(','),
    user.status,
    user.phone,
    user.address,
  ]);
  return [ headers, ...rows ].map(row => row.map(csvValue).join(',')).join('\r\n');
}

function openUserFormDialog({ overlayService, userList, feedback, currentUser, user = null }) {
  const isEdit = Boolean(user);
  const formMessage = Message();
  let overlay = null;
  const close = () => {
    formMessage.destroy();
    overlay?.close();
  };

  overlay = overlayService.openModal(
    { title: isEdit ? '编辑用户' : '新增用户', width: '520px' },
    createFormView({
      user,
      currentUser,
      mode: isEdit ? 'edit' : 'create',
      onSubmit: async (data, _runtime, event) => {
        const roleCodes = event?.currentTarget
          ? new FormData(event.currentTarget).getAll('roleCodes')
          : data.roleCodes;
        const userInput = normalizeUserInput({ ...data, roleCodes }, currentUser);
        if (userInput.roleCodes.length === 0) {
          formMessage.error('请至少选择一个角色。');
          return;
        }

        if (userList.hasEmail(userInput.email, user?.id || null)) {
          formMessage.error('该邮箱已存在，请使用其他邮箱。');
          return;
        }

        try {
          if (isEdit) {
            await updateUserRequest(user.id, userInput);
            userList.updateUser(user.id, userInput);
            feedback.success('用户信息已保存。');
          } else {
            const createdUser = await createUserRequest(userInput);
            userList.addUser(createdUser);
            feedback.success('用户已新增。');
          }
          close();
        } catch (error) {
          formMessage.error(getApiErrorMessage(error, '用户保存失败，请稍后重试。'));
        }
      },
      onCancel: close,
    }),
  );
}

function openDetailDialog({
  overlayService,
  userList,
  feedback,
  userId,
  currentUser,
  canEdit,
  canDelete,
  onResetPassword,
  onChangeStatus,
  onDelete,
}) {
  const user = computed(() => userList.getUser(userId));
  const editing = signal(false);
  let overlay = null;
  const close = () => overlay?.close();
  const cancelEdit = () => {
    editing.value = false;
  };

  overlay = overlayService.openModal(
    { title: '用户详情', width: '760px' },
    detailPageView({
      user,
      editing,
      showHeader: false,
      showActions: true,
      onEdit: canEdit ? () => {
        if (!user.value) {
          feedback.warning('用户不存在或已删除。');
          return;
        }
        editing.value = true;
      } : null,
      onResetPassword: canEdit ? onResetPassword : null,
      onChangeStatus: canEdit ? onChangeStatus : null,
      onSubmitEdit: async event => {
        event?.preventDefault?.();
        const currentUser = user.value;
        if (!currentUser) {
          feedback.warning('用户不存在或已删除。');
          return;
        }

        const rawInput = readUserFormData(event.currentTarget);
        const validation = validateSchema(createUserSchema, rawInput);
        if (!validation.valid) {
          feedback.error(validation.firstError?.message || '表单内容有误，请检查后再提交。');
          return;
        }

        const userInput = normalizeUserInput(rawInput, currentUser);
        if (userList.hasEmail(userInput.email, currentUser.id)) {
          feedback.error('该邮箱已存在，请使用其他邮箱。');
          return;
        }

        try {
          await updateUserRequest(currentUser.id, userInput);
          userList.updateUser(currentUser.id, userInput);
          editing.value = false;
          feedback.success('用户信息已保存。');
        } catch (error) {
          feedback.error(getApiErrorMessage(error, '用户保存失败，请稍后重试。'));
        }
      },
      onCancelEdit: cancelEdit,
      onDelete: canDelete ? () => {
        const currentUser = user.value;
        if (currentUser) {
          onDelete(currentUser.id, { afterDelete: close });
        } else {
          feedback.warning('用户不存在或已删除。');
        }
      } : null,
    }),
  );
}

export default function ListPage() {
  const overlayService = useOverlay();
  const auth = useAuth();
  const authContext = auth.getContext?.() || null;
  const currentUser = authContext?.user || null;
  const userList = createListState({ initialUsers: [], currentUser });
  const feedback = Message({ maxCount: 3 });
  const selectedUserIds = signal([]);
  const selectedCount = computed(() => selectedUserIds.value.length);
  const bulkRoleCode = signal('');
  const canCreateUser = hasPermission(authContext, 'user:create');
  const canViewUser = hasPermission(authContext, 'user:view');
  const canEditUser = hasPermission(authContext, 'user:edit');
  const canDeleteUser = hasPermission(authContext, 'user:delete');
  const canImportUsers = hasPermission(authContext, 'user:create');
  const canExportUsers = canViewUser;

  async function loadUsers() {
    try {
      const records = await listUsers();
      userList.replaceUsers(records);
    } catch (error) {
      feedback.error(getApiErrorMessage(error, '用户数据加载失败，请稍后重试。'));
    }
  }

  void loadUsers();

  function warnNoPermission() {
    feedback.warning('当前账号没有执行该操作的权限。');
  }

  function handleViewUser(userId) {
    if (!canViewUser) {
      warnNoPermission();
      return;
    }
    openDetailDialog({
      overlayService,
      userList,
      feedback,
      userId,
      currentUser,
      canEdit: canEditUser,
      canDelete: canDeleteUser,
      onResetPassword: handleResetPassword,
      onChangeStatus: handleChangeUserStatus,
      onDelete: handleDeleteUser,
    });
  }

  function handleEditUser(userId) {
    if (!canEditUser) {
      warnNoPermission();
      return;
    }
    const user = userList.getUser(userId);
    if (!user) {
      feedback.warning('用户不存在或已删除。');
      return;
    }

    openUserFormDialog({ overlayService, userList, feedback, currentUser, user });
  }

  async function handleDeleteUser(userId, options = {}) {
    if (!canDeleteUser) {
      warnNoPermission();
      return;
    }
    const user = userList.getUser(userId);
    if (!user) {
      feedback.warning('用户不存在或已删除。');
      return;
    }

    const confirmed = await Dialog.confirm({
      title: '删除用户',
      content: `确认删除用户“${user.name}”？`,
      type: 'warning',
      confirmText: '删除',
      cancelText: '取消',
    });
    if (!confirmed) {
      return;
    }

    try {
      await deleteUserRequest(user.id);
    } catch (error) {
      feedback.error(getApiErrorMessage(error, '用户删除失败，请稍后重试。'));
      return;
    }

    if (userList.deleteUser(user.id)) {
      options.afterDelete?.();
      selectedUserIds.value = selectedUserIds.value.filter(id => String(id) !== String(user.id));
      feedback.success('用户已删除。');
    }
  }

  async function handleResetPassword(userId) {
    if (!canEditUser) {
      warnNoPermission();
      return;
    }
    const user = userList.getUser(userId);
    if (!user) {
      feedback.warning('用户不存在或已删除。');
      return;
    }

    const confirmed = await Dialog.confirm({
      title: '重置密码',
      content: `确认重置用户“${user.name}”的密码？`,
      type: 'warning',
      confirmText: '重置',
      cancelText: '取消',
    });
    if (!confirmed) {
      return;
    }

    feedback.warning('后端暂未提供重置密码接口。');
  }

  async function handleChangeUserStatus(userId, status) {
    if (!canEditUser) {
      warnNoPermission();
      return;
    }
    const user = userList.getUser(userId);
    if (!user) {
      feedback.warning('用户不存在或已删除。');
      return;
    }
    const statusLabel = USER_STATUS_LABELS[status] || '更新';
    const confirmed = await Dialog.confirm({
      title: `${statusLabel}用户`,
      content: `确认将用户“${user.name}”状态改为“${statusLabel}”？`,
      type: status === 'active' ? 'info' : 'warning',
      confirmText: statusLabel,
      cancelText: '取消',
    });
    if (!confirmed) {
      return;
    }

    try {
      await updateUserRequest(user.id, { ...user, status });
    } catch (error) {
      feedback.error(getApiErrorMessage(error, '用户状态更新失败，请稍后重试。'));
      return;
    }

    if (userList.updateUserStatus(user.id, status)) {
      feedback.success(`用户已${statusLabel}。`);
    }
  }

  function handleToggleSelectUser(userId, checked) {
    const id = Number(userId);
    if (!Number.isFinite(id)) {
      return;
    }
    const next = new Set(selectedUserIds.value);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    selectedUserIds.value = [ ...next ];
  }

  function getSelectedIds() {
    return selectedUserIds.value.filter(id => userList.getUser(id));
  }

  function ensureSelectedUsers() {
    const ids = getSelectedIds();
    if (ids.length === 0) {
      feedback.warning('请先选择用户。');
      return null;
    }
    return ids;
  }

  function clearSelection() {
    selectedUserIds.value = [];
    bulkRoleCode.value = '';
  }

  async function handleBulkStatus(status) {
    if (!canEditUser) {
      warnNoPermission();
      return;
    }
    const ids = ensureSelectedUsers();
    if (!ids) {
      return;
    }
    const statusLabel = USER_STATUS_LABELS[status] || '更新';
    const confirmed = await Dialog.confirm({
      title: `批量${statusLabel}`,
      content: `确认将选中的 ${ids.length} 个用户状态改为“${statusLabel}”？`,
      type: status === 'active' ? 'info' : 'warning',
      confirmText: statusLabel,
      cancelText: '取消',
    });
    if (!confirmed) {
      return;
    }

    try {
      await Promise.all(ids.map(id => {
        const user = userList.getUser(id);
        return updateUserRequest(id, { ...user, status });
      }));
    } catch (error) {
      feedback.error(getApiErrorMessage(error, '批量更新用户状态失败，请稍后重试。'));
      return;
    }

    clearSelection();
    const count = userList.updateUsersStatus(ids, status);
    feedback.success(`已${statusLabel} ${count} 个用户。`);
  }

  async function handleBulkDelete() {
    if (!canDeleteUser) {
      warnNoPermission();
      return;
    }
    const ids = ensureSelectedUsers();
    if (!ids) {
      return;
    }

    const confirmed = await Dialog.confirm({
      title: '批量删除用户',
      content: `确认删除选中的 ${ids.length} 个用户？`,
      type: 'warning',
      confirmText: '删除',
      cancelText: '取消',
    });
    if (!confirmed) {
      return;
    }

    clearSelection();
    const count = userList.deleteUsers(ids);
    feedback.success(`已删除 ${count} 个用户。`);
  }

  function handleSelectBulkRole(event) {
    bulkRoleCode.value = event.target.value;
  }

  async function handleBulkAssignRole() {
    if (!canEditUser) {
      warnNoPermission();
      return;
    }
    const ids = ensureSelectedUsers();
    if (!ids) {
      return;
    }
    if (!bulkRoleCode.value) {
      feedback.warning('请选择要分配的角色。');
      return;
    }

    const roleCode = bulkRoleCode.value;
    try {
      await Promise.all(ids.map(id => {
        const user = userList.getUser(id);
        return updateUserRequest(id, { ...user, roleCodes: [ roleCode ] });
      }));
    } catch (error) {
      feedback.error(getApiErrorMessage(error, '批量分配角色失败，请稍后重试。'));
      return;
    }

    clearSelection();
    const count = userList.assignRoleToUsers(ids, roleCode);
    feedback.success(`已为 ${count} 个用户分配角色。`);
  }

  function handleCreateUser() {
    if (!canCreateUser) {
      warnNoPermission();
      return;
    }
    openUserFormDialog({ overlayService, userList, feedback, currentUser });
  }

  function handleImportClick() {
    if (!canImportUsers) {
      warnNoPermission();
      return;
    }
    document.querySelector('.user-import-input')?.click();
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      const rows = await parseImportFile(file);
      if (rows.length === 0) {
        feedback.warning('导入文件没有可识别的数据行。');
        return;
      }
      let imported = 0;
      let skipped = 0;
      for (const row of rows.slice(0, 200)) {
        const userInput = normalizeImportRow(row, currentUser);
        const validation = validateSchema(createUserSchema, userInput);
        if (!validation.valid || !userInput.name || !userInput.email || !userInput.orgId
          || userInput.roleCodes.length === 0 || userList.hasEmail(userInput.email)) {
          skipped += 1;
          continue;
        }
        try {
          await createUserRequest(userInput);
          userList.addUser(userInput);
          imported += 1;
        } catch {
          skipped += 1;
        }
      }
      const truncated = rows.length > 200 ? `，超出上限的 ${rows.length - 200} 行未处理` : '';
      if (imported > 0) {
        feedback.success(`成功导入 ${imported} 人，跳过 ${skipped} 行${truncated}。`);
      } else {
        feedback.warning(`没有导入成功，跳过 ${skipped} 行${truncated}。`);
      }
    } catch {
      feedback.error('导入文件解析失败，请使用 CSV 或 JSON 格式。');
    }
  }

  function handleExport(event) {
    const format = event.target.value;
    event.target.value = '';
    if (!format) {
      return;
    }
    if (!canExportUsers) {
      warnNoPermission();
      return;
    }
    const users = userList.filteredUsers.value;
    if (format === 'csv') {
      downloadFile('kupola-users.csv', exportUsersAsCsv(users), 'text/csv;charset=utf-8');
      feedback.success(`已导出 ${users.length} 条用户记录。`);
      return;
    }
    downloadFile('kupola-users.json', JSON.stringify(users, null, 2), 'application/json;charset=utf-8');
    feedback.success(`已导出 ${users.length} 条用户记录。`);
  }

  return listPageView({
    toolbar: listToolbarView({
      searchKeyword: userList.searchKeyword,
      organizationFilter: userList.organizationFilter,
      roleFilter: userList.roleFilter,
      statusFilter: userList.statusFilter,
      selectedCount,
      bulkRoleCode,
      canCreate: canCreateUser,
      canBulkEdit: canEditUser,
      canBulkDelete: canDeleteUser,
      canImport: canImportUsers,
      canExport: canExportUsers,
      onSearch: event => {
        userList.setSearchKeyword(event.target.value);
      },
      onOrganizationFilter: event => {
        userList.setOrganizationFilter(event.target.value);
      },
      onRoleFilter: event => {
        userList.setRoleFilter(event.target.value);
      },
      onStatusFilter: value => {
        userList.setStatusFilter(value);
      },
      onSelectBulkRole: handleSelectBulkRole,
      onBulkStatus: handleBulkStatus,
      onBulkAssignRole: handleBulkAssignRole,
      onBulkDelete: handleBulkDelete,
      onImport: handleImportClick,
      onImportFile: handleImportFile,
      onExport: handleExport,
      onCreate: handleCreateUser,
    }),
    table: ListTable({
      data: userList.filteredUsers,
      canView: canViewUser,
      canEdit: canEditUser,
      canDelete: canDeleteUser,
      selectedIds: selectedUserIds,
      onToggleSelect: handleToggleSelectUser,
      onView: handleViewUser,
      onEdit: handleEditUser,
      onDelete: handleDeleteUser,
      onResetPassword: handleResetPassword,
      onChangeStatus: handleChangeUserStatus,
    }),
  });
}
