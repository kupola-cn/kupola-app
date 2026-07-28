import { computed } from '@kupola/platform';
import { useAuth } from '@kupola/auth';
import { Dialog } from '@kupola/components';
import { Message } from '@kupola/components/message';
import { useOverlay } from '@kupola/components/overlay';
import { hasPermission } from '../../auth/access.js';
import { createListState } from '../../users/state.js';
import { createOrganizationState } from '../state.js';
import {
  listPageView,
  listToolbarView,
  organizationDetailView,
  organizationFormView,
  organizationMoveFormView,
  organizationTreeView,
  statsView,
} from '../view.js';

function normalizeOrganizationInput(data) {
  return {
    name: String(data.name || '').trim(),
    code: String(data.code || '').trim().toLowerCase(),
    type: data.type,
    status: data.status === 'inactive' ? 'inactive' : 'active',
    leader: String(data.leader || '').trim(),
    memberCount: Math.max(0, Number(data.memberCount) || 0),
    address: String(data.address || '').trim(),
    description: String(data.description || '').trim(),
  };
}

function deleteFailureMessage(reason) {
  if (reason === 'root') {
    return '集团根节点不能删除。';
  }
  if (reason === 'has-children') {
    return '该机构下还有子机构或部门，请先处理下级机构。';
  }
  return '机构不存在或已删除。';
}

function openOrganizationDialog({
  overlayService,
  organizationState,
  userList,
  feedback,
  organization = null,
  parent = null,
}) {
  const formMessage = Message();
  const isEdit = Boolean(organization);
  let overlay = null;
  const close = () => {
    formMessage.destroy();
    overlay?.close();
  };

  overlay = overlayService.openModal(
    {
      title: isEdit ? '编辑机构' : '新增机构',
      width: '620px',
    },
    organizationFormView({
      organization,
      parent,
      mode: isEdit ? 'edit' : 'create',
      onSubmit: async data => {
        const organizationInput = normalizeOrganizationInput(data);
        const duplicateCode = organizationState.hasOrganizationCode(
          organizationInput.code,
          organization?.id || null,
        );

        if (duplicateCode) {
          formMessage.error('机构编码已存在，请换一个编码。');
          return;
        }

        if (isEdit) {
          if (organization.status === 'active' && organizationInput.status === 'inactive') {
            const descendantCount = organizationState.getDescendantIds(organization.id).length;
            const memberCount = userList.getUsersByOrganization(organization.id).length;
            const confirmed = await Dialog.confirm({
              title: '停用机构',
              content: `停用“${organization.name}”会影响 ${descendantCount} 个下级机构和 ${memberCount} 个直属成员，确认继续？`,
              type: 'warning',
              confirmText: '停用',
              cancelText: '取消',
            });
            if (!confirmed) {
              return;
            }
          }
          organizationState.updateOrganization(organization.id, organizationInput);
          feedback.success('机构已保存。');
        } else {
          const created = organizationState.addOrganization(parent?.id, organizationInput);
          if (!created) {
            formMessage.error('请选择有效的上级机构。');
            return;
          }
          feedback.success('机构已新增。');
        }
        close();
      },
      onCancel: close,
    }),
  );
}

function moveFailureMessage(reason) {
  if (reason === 'root') {
    return '集团根节点不能调整上级。';
  }
  if (reason === 'parent-not-found') {
    return '请选择有效的上级机构。';
  }
  if (reason === 'invalid-parent') {
    return '不能移动到自身或下级机构下面。';
  }
  return '机构不存在或已删除。';
}

function openMoveOrganizationDialog({
  overlayService,
  organizationState,
  feedback,
  organization,
}) {
  if (!organization) {
    feedback.warning('机构不存在或已删除。');
    return;
  }
  const parentOptions = organizationState.getMovableParents(organization.id);
  if (parentOptions.length === 0) {
    feedback.warning('当前机构没有可调整的上级机构。');
    return;
  }

  let overlay = null;
  const close = () => overlay?.close();
  overlay = overlayService.openModal(
    {
      title: '调整上级机构',
      width: '520px',
    },
    organizationMoveFormView({
      organization,
      parentOptions,
      onSubmit: data => {
        const result = organizationState.moveOrganization(organization.id, data.parentId);
        if (!result.ok) {
          feedback.warning(moveFailureMessage(result.reason));
          return;
        }
        feedback.success('上级机构已调整。');
        close();
      },
      onCancel: close,
    }),
  );
}

export default function ListPage() {
  const overlayService = useOverlay();
  const auth = useAuth();
  const authContext = auth.getContext?.() || null;
  const organizationState = createOrganizationState();
  const userList = createListState({ currentUser: authContext?.user || null });
  const feedback = Message({ maxCount: 3 });
  const canCreateOrganization = hasPermission(authContext, 'organization:create');
  const canEditOrganization = hasPermission(authContext, 'organization:edit');
  const canDeleteOrganization = hasPermission(authContext, 'organization:delete');
  const selectedMembers = computed(() => {
    const organization = organizationState.selectedOrganization.value;
    return organization ? userList.getUsersByOrganization(organization.id) : [];
  });

  function warnNoPermission() {
    feedback.warning('当前账号没有执行该操作的权限。');
  }

  function handleCreateChild(parent = organizationState.selectedOrganization.value) {
    if (!canCreateOrganization) {
      warnNoPermission();
      return;
    }
    if (!parent) {
      feedback.warning('请先选择一个上级机构。');
      return;
    }
    openOrganizationDialog({
      overlayService,
      organizationState,
      userList,
      feedback,
      parent,
    });
  }

  function handleEditOrganization(organization) {
    if (!canEditOrganization) {
      warnNoPermission();
      return;
    }
    if (!organization) {
      feedback.warning('机构不存在或已删除。');
      return;
    }
    openOrganizationDialog({
      overlayService,
      organizationState,
      userList,
      feedback,
      organization,
      parent: organizationState.getParent(organization.id),
    });
  }

  function handleMoveOrganization(organization) {
    if (!canEditOrganization) {
      warnNoPermission();
      return;
    }
    openMoveOrganizationDialog({
      overlayService,
      organizationState,
      feedback,
      organization,
    });
  }

  async function handleDeleteOrganization(organization) {
    if (!canDeleteOrganization) {
      warnNoPermission();
      return;
    }
    if (!organization) {
      feedback.warning('机构不存在或已删除。');
      return;
    }

    const children = organizationState.getChildren(organization.id);
    if (organization.parentId == null || children.length > 0) {
      const result = organizationState.deleteOrganization(organization.id);
      feedback.warning(deleteFailureMessage(result.reason));
      return;
    }

    const confirmed = await Dialog.confirm({
      title: '删除机构',
      content: `确认删除机构“${organization.name}”？`,
      type: 'warning',
      confirmText: '删除',
      cancelText: '取消',
    });
    if (!confirmed) {
      return;
    }

    const result = organizationState.deleteOrganization(organization.id);
    if (result.ok) {
      feedback.success('机构已删除。');
    } else {
      feedback.warning(deleteFailureMessage(result.reason));
    }
  }

  return listPageView({
    toolbar: listToolbarView({
      stats: statsView({ organizationStats: organizationState.organizationStats }),
      searchKeyword: organizationState.searchKeyword,
      selectedOrganization: organizationState.selectedOrganization,
      canCreate: canCreateOrganization,
      onSearch: event => {
        organizationState.setSearchKeyword(event.target.value);
      },
      onCreateChild: handleCreateChild,
    }),
    tree: organizationTreeView({
      organizations: organizationState.visibleTree,
      selectedOrganizationId: organizationState.selectedOrganizationId,
      expandedIds: organizationState.expandedIds,
      searchKeyword: organizationState.searchKeyword,
      canCreate: canCreateOrganization,
      canEdit: canEditOrganization,
      canDelete: canDeleteOrganization,
      onSelect: organizationState.selectOrganization,
      onToggle: organizationState.toggleExpanded,
      onMove: handleMoveOrganization,
      onCreateChild: handleCreateChild,
      onEdit: handleEditOrganization,
      onDelete: handleDeleteOrganization,
      onExpandAll: organizationState.expandAll,
      onCollapseAll: organizationState.collapseAll,
    }),
    detail: organizationDetailView({
      organization: organizationState.selectedOrganization,
      path: organizationState.selectedPath,
      children: organizationState.selectedChildren,
      members: selectedMembers,
      descendantCount: organizationState.selectedDescendantCount,
      canCreate: canCreateOrganization,
      canEdit: canEditOrganization,
      canDelete: canDeleteOrganization,
      onMove: handleMoveOrganization,
      onCreateChild: handleCreateChild,
      onEdit: handleEditOrganization,
      onDelete: handleDeleteOrganization,
      onSelectChild: organizationState.selectOrganization,
    }),
  });
}
