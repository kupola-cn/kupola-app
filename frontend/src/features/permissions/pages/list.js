import { useAuth } from '@kupola/auth';
import { Dialog } from '@kupola/components';
import { Message } from '@kupola/components/message';
import { useOverlay } from '@kupola/components/overlay';
import { hasPermission } from '../../auth/access.js';
import { createOrganizationState } from '../../organizations/state.js';
import { createPermissionState } from '../state.js';
import {
  listPageView,
  listToolbarView,
  permissionMatrixView,
  roleDetailView,
  roleFormView,
  roleListView,
  statsView,
} from '../view.js';

function normalizeRoleInput(data) {
  return {
    name: String(data.name || '').trim(),
    code: String(data.code || '').trim().toLowerCase(),
    description: String(data.description || '').trim(),
    status: data.status === 'inactive' ? 'inactive' : 'active',
  };
}

function createRoleCopyDraft(permissionState, sourceRole) {
  const baseCode = `${sourceRole.code}_copy`;
  let code = baseCode;
  let index = 2;
  while (permissionState.hasRoleCode(code)) {
    code = `${baseCode}_${index}`;
    index += 1;
  }
  return {
    name: `${sourceRole.name} 副本`,
    code,
    description: sourceRole.description,
    status: sourceRole.status,
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function openRoleDialog({
  overlayService,
  permissionState,
  feedback,
  role = null,
  copyFromRole = null,
}) {
  const formMessage = Message();
  const isCopy = Boolean(copyFromRole);
  const isEdit = Boolean(role) && !isCopy;
  const draftRole = isCopy ? createRoleCopyDraft(permissionState, copyFromRole) : role;
  let overlay = null;
  const close = () => {
    formMessage.destroy();
    overlay?.close();
  };

  overlay = overlayService.openModal(
    {
      title: isEdit ? '编辑角色' : isCopy ? '复制角色' : '新增角色',
      width: '560px',
    },
    roleFormView({
      role: draftRole,
      mode: isEdit ? 'edit' : isCopy ? 'copy' : 'create',
      onSubmit: data => {
        const roleInput = normalizeRoleInput(data);
        const duplicateCode = permissionState.hasRoleCode(roleInput.code, isEdit ? role?.id || null : null);

        if (duplicateCode) {
          formMessage.error('角色编码已存在，请换一个编码。');
          return;
        }

        if (isEdit) {
          permissionState.updateRole(role.id, roleInput);
          feedback.success('角色已保存。');
        } else if (isCopy) {
          permissionState.copyRole(copyFromRole.id, roleInput);
          feedback.success('角色已复制。');
        } else {
          permissionState.addRole(roleInput);
          feedback.success('角色已新增。');
        }
        close();
      },
      onCancel: close,
    }),
  );
}

async function confirmDiscardPermissionDraft(permissionState) {
  if (!permissionState.isRoleConfigDirty.value) {
    return true;
  }

  return Dialog.confirm({
    title: '切换角色',
    content: '当前角色配置尚未保存，切换后会丢失。',
    type: 'warning',
    confirmText: '切换',
    cancelText: '取消',
  });
}

export default function ListPage() {
  const overlayService = useOverlay();
  const auth = useAuth();
  const authContext = auth.getContext?.() || null;
  const permissionState = createPermissionState();
  const organizationState = createOrganizationState();
  const feedback = Message({ maxCount: 3 });
  const canCreateRole = hasPermission(authContext, 'permission:create');
  const canEditRole = hasPermission(authContext, 'permission:edit');
  const canAssignRole = hasPermission(authContext, 'permission:assign');
  const canDeleteRole = hasPermission(authContext, 'permission:delete');

  function warnNoPermission() {
    feedback.warning('当前账号没有执行该操作的权限。');
  }

  async function handleSelectRole(roleId) {
    if (permissionState.selectedRoleId.value === roleId) {
      return;
    }
    if (!await confirmDiscardPermissionDraft(permissionState)) {
      return;
    }
    permissionState.selectRole(roleId);
  }

  function handleCreateRole() {
    if (!canCreateRole) {
      warnNoPermission();
      return;
    }
    openRoleDialog({ overlayService, permissionState, feedback });
  }

  function handleEditRole(role) {
    if (!canEditRole) {
      warnNoPermission();
      return;
    }
    openRoleDialog({ overlayService, permissionState, feedback, role });
  }

  async function handleCopyRole(role) {
    if (!canCreateRole) {
      warnNoPermission();
      return;
    }
    if (!await confirmDiscardPermissionDraft(permissionState)) {
      return;
    }
    openRoleDialog({ overlayService, permissionState, feedback, copyFromRole: role });
  }

  async function handleDeleteRole(role) {
    if (!canDeleteRole) {
      warnNoPermission();
      return;
    }
    if (role.system) {
      feedback.warning('系统角色不能删除。');
      return;
    }

    const confirmed = await Dialog.confirm({
      title: '删除角色',
      content: `确认删除角色“${role.name}”？`,
      type: 'warning',
      confirmText: '删除',
      cancelText: '取消',
    });
    if (!confirmed) {
      return;
    }

    if (permissionState.deleteRole(role.id)) {
      feedback.success('角色已删除。');
    }
  }

  function canEditPermissions() {
    return canAssignRole && !permissionState.selectedRole.value?.system;
  }

  function handleTogglePermission(permissionKey, checked) {
    if (!canEditPermissions()) {
      return;
    }
    permissionState.togglePermission(permissionKey, checked);
  }

  function handleToggleGroup(groupKey, checked, permissionKeys = null) {
    if (!canEditPermissions()) {
      return;
    }
    permissionState.togglePermissionGroup(groupKey, checked, permissionKeys);
  }

  function handleSelectAll() {
    if (!canEditPermissions()) {
      return;
    }
    permissionState.selectAllPermissions();
  }

  function handleClearPermissions() {
    if (!canEditPermissions()) {
      return;
    }
    permissionState.clearPermissions();
  }

  function handleResetPermissions() {
    permissionState.resetPermissionDraft();
  }

  function handleChangeDataScopeType(type) {
    if (!canEditPermissions()) {
      return;
    }
    permissionState.setDataScopeType(type);
  }

  function handleToggleDataScopeOrganization(organizationId, checked) {
    if (!canEditPermissions()) {
      return;
    }
    permissionState.toggleDataScopeOrganization(organizationId, checked);
  }

  function handleClearDataScopeOrganizations() {
    if (!canEditPermissions()) {
      return;
    }
    permissionState.clearDataScopeOrganizations();
  }

  async function handleSavePermissions() {
    if (!canEditPermissions()) {
      feedback.warning(canAssignRole ? '系统角色权限不可修改。' : '当前账号没有分配权限的权限。');
      return;
    }

    const scope = permissionState.draftDataScope.value;
    if (scope.type === 'customOrgs' && scope.organizationIds.length === 0) {
      feedback.warning('请选择至少一个机构作为数据范围。');
      return;
    }

    permissionState.setSaveStatus('saving');
    await delay(360);
    try {
      const role = permissionState.saveRoleConfigDraft();
      if (!role) {
        permissionState.setSaveStatus('error');
        feedback.error('角色配置保存失败。');
        return;
      }
      permissionState.setSaveStatus('success');
      feedback.success('角色配置已保存。');
    } catch {
      permissionState.setSaveStatus('error');
      feedback.error('角色配置保存失败。');
    }
  }

  const permissionMatrix = permissionMatrixView({
    groups: permissionState.filteredPermissionGroups,
    role: permissionState.selectedRole,
    permissionKeyword: permissionState.permissionKeyword,
    draftPermissionKeys: permissionState.draftPermissionKeys,
    draftDataScope: permissionState.draftDataScope,
    isPermissionDirty: permissionState.isRoleConfigDirty,
    permissionChangePreview: permissionState.permissionChangePreview,
    saveStatus: permissionState.saveStatus,
    selectedPermissionCount: permissionState.selectedPermissionCount,
    totalPermissionCount: permissionState.allPermissionKeys.length,
    matchedPermissionCount: permissionState.matchedPermissionCount,
    dataScopeOptions: permissionState.dataScopeOptions,
    organizations: organizationState.visibleTree,
    organizationExpandedIds: organizationState.expandedIds,
    canAssign: canAssignRole,
    onToggleGroup: handleToggleGroup,
    onTogglePermission: handleTogglePermission,
    onSearchPermissions: event => {
      permissionState.setPermissionKeyword(event.target.value);
    },
    onChangeDataScopeType: handleChangeDataScopeType,
    onToggleOrganizationExpanded: organizationState.toggleExpanded,
    onExpandOrganizations: organizationState.expandAll,
    onCollapseOrganizations: organizationState.collapseAll,
    onToggleDataScopeOrganization: handleToggleDataScopeOrganization,
    onClearDataScopeOrganizations: handleClearDataScopeOrganizations,
    onSelectAll: handleSelectAll,
    onClear: handleClearPermissions,
    onReset: handleResetPermissions,
    onSave: handleSavePermissions,
  });

  return listPageView({
    toolbar: listToolbarView({
      stats: statsView({ roleStats: permissionState.roleStats }),
      searchKeyword: permissionState.searchKeyword,
      canCreate: canCreateRole,
      onSearch: event => {
        permissionState.setSearchKeyword(event.target.value);
      },
      onCreate: handleCreateRole,
    }),
    roleList: roleListView({
      roles: permissionState.filteredRoles,
      selectedRoleId: permissionState.selectedRoleId,
      totalPermissionCount: permissionState.allPermissionKeys.length,
      canEdit: canEditRole,
      canCopy: canCreateRole,
      canDelete: canDeleteRole,
      onSelect: handleSelectRole,
      onEdit: handleEditRole,
      onCopy: handleCopyRole,
      onDelete: handleDeleteRole,
    }),
    detail: roleDetailView({
      role: permissionState.selectedRole,
      totalPermissionCount: permissionState.allPermissionKeys.length,
      selectedPermissionCount: permissionState.selectedPermissionCount,
      permissionMatrix,
    }),
  });
}
