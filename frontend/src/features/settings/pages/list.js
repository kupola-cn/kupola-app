import { signal } from '@kupola/platform';
import { useAuth } from '@kupola/auth';
import { Dialog } from '@kupola/components';
import { Message } from '@kupola/components/message';
import { useOverlay } from '@kupola/components/overlay';
import { hasPermission } from '../../auth/access.js';
import { createSettingsState } from '../state.js';
import {
  dictionaryFormView,
  dictionaryItemFormView,
  dictionaryView,
  menuFormView,
  menuView,
  permissionFormView,
  permissionPointView,
  settingsHeaderView,
  settingsPageView,
} from '../view.js';

function readFormData(event) {
  event.preventDefault();
  return Object.fromEntries(new FormData(event.currentTarget).entries());
}

function openSettingsModal(overlayService, options, content) {
  let overlay = null;
  const close = () => overlay?.close();
  overlay = overlayService.openModal(options, content(close));
}

function resolvePermissionGroup(groupKey) {
  const group = [
    { key: 'dashboard', name: '仪表盘' },
    { key: 'user', name: '用户管理' },
    { key: 'organization', name: '机构管理' },
    { key: 'permission', name: '权限管理' },
    { key: 'audit', name: '审计日志' },
    { key: 'settings', name: '系统设置' },
  ].find(item => item.key === groupKey);
  return group || { key: groupKey, name: groupKey };
}

export default function SettingsListPage() {
  const overlayService = useOverlay();
  const authContext = useAuth().getContext?.() || null;
  const settingsState = createSettingsState();
  const permissionPageSize = signal(10);
  const feedback = Message({ maxCount: 3 });
  const canDictionary = hasPermission(authContext, 'settings:dictionary');
  const canMenu = hasPermission(authContext, 'settings:menu');
  const canPermission = hasPermission(authContext, 'settings:permission');

  function warnNoPermission() {
    feedback.warning('当前账号没有执行该操作的权限。');
  }

  function openDictionaryForm(dictionary = null) {
    if (!canDictionary) {
      warnNoPermission();
      return;
    }
    openSettingsModal(overlayService, {
      title: dictionary ? '编辑字典' : '新增字典',
      width: '520px',
    }, close => dictionaryFormView({
      dictionary,
      onSubmit: event => {
        const data = readFormData(event);
        const name = String(data.name || '').trim();
        const code = String(data.code || '').trim().toLowerCase();
        if (!name || !code) {
          feedback.error('请填写字典名称和编码。');
          return;
        }
        if (!dictionary && settingsState.hasDictionaryCode(code)) {
          feedback.error('字典编码已存在，请换一个编码。');
          return;
        }
        if (dictionary) {
          settingsState.updateDictionary(dictionary.id, data);
          feedback.success('字典已保存。');
        } else {
          settingsState.addDictionary({ ...data, code });
          feedback.success('字典已新增。');
        }
        close();
      },
      onCancel: close,
    }));
  }

  async function handleToggleDictionary(dictionary) {
    if (!canDictionary) {
      warnNoPermission();
      return;
    }
    const nextStatus = dictionary.status === 'active' ? '停用' : '启用';
    if (!await Dialog.confirm({
      title: `${nextStatus}字典`,
      content: `确认${nextStatus}字典“${dictionary.name}”？`,
      type: dictionary.status === 'active' ? 'warning' : 'info',
      confirmText: nextStatus,
      cancelText: '取消',
    })) {
      return;
    }
    settingsState.toggleDictionaryStatus(dictionary.id);
    feedback.success(`字典已${nextStatus}。`);
  }

  function openDictionaryItemForm(dictionary, item = null) {
    if (!canDictionary) {
      warnNoPermission();
      return;
    }
    openSettingsModal(overlayService, {
      title: item ? '编辑字典项' : `新增字典项 · ${dictionary.name}`,
      width: '480px',
    }, close => dictionaryItemFormView({
      item,
      onSubmit: event => {
        const data = readFormData(event);
        const value = String(data.value || '').trim().toLowerCase();
        const label = String(data.label || '').trim();
        if (!value || !label) {
          feedback.error('请填写显示名称和字典值。');
          return;
        }
        if (settingsState.hasDictionaryItemValue(dictionary.id, value, item?.id || null)) {
          feedback.error('字典值已存在，请换一个值。');
          return;
        }
        if (item) {
          settingsState.updateDictionaryItem(dictionary.id, item.id, { ...data, value });
          feedback.success('字典项已保存。');
        } else {
          settingsState.addDictionaryItem(dictionary.id, { ...data, value });
          feedback.success('字典项已新增。');
        }
        close();
      },
      onCancel: close,
    }));
  }

  async function handleDeleteDictionaryItem(dictionary, item) {
    if (!canDictionary) {
      warnNoPermission();
      return;
    }
    if (!await Dialog.confirm({
      title: '删除字典项',
      content: `确认删除“${item.label}”吗？`,
      type: 'warning',
      confirmText: '删除',
      cancelText: '取消',
    })) {
      return;
    }
    settingsState.deleteDictionaryItem(dictionary.id, item.id);
    feedback.success('字典项已删除。');
  }

  function openMenuForm(menu) {
    if (!canMenu) {
      warnNoPermission();
      return;
    }
    openSettingsModal(overlayService, {
      title: '编辑菜单',
      width: '560px',
    }, close => menuFormView({
      menu,
      onSubmit: event => {
        const data = readFormData(event);
        if (!String(data.name || '').trim() || !String(data.route || '').trim()) {
          feedback.error('请填写菜单名称和路由。');
          return;
        }
        settingsState.updateMenu(menu.id, data);
        feedback.success('菜单已保存。');
        close();
      },
      onCancel: close,
    }));
  }

  async function handleToggleMenu(menu) {
    if (!canMenu) {
      warnNoPermission();
      return;
    }
    const nextStatus = menu.status === 'active' ? '停用' : '启用';
    if (!await Dialog.confirm({
      title: `${nextStatus}菜单`,
      content: `确认${nextStatus}菜单“${menu.name}”？`,
      type: menu.status === 'active' ? 'warning' : 'info',
      confirmText: nextStatus,
      cancelText: '取消',
    })) {
      return;
    }
    settingsState.toggleMenuStatus(menu.id);
    feedback.success(`菜单已${nextStatus}。`);
  }

  function openPermissionForm(point = null) {
    if (!canPermission) {
      warnNoPermission();
      return;
    }
    openSettingsModal(overlayService, {
      title: point ? '编辑权限点' : '新增权限点',
      width: '540px',
    }, close => permissionFormView({
      point,
      onSubmit: event => {
        const data = readFormData(event);
        const key = String(data.key || '').trim().toLowerCase();
        const name = String(data.name || '').trim();
        if (!key || !name) {
          feedback.error('请填写权限名称和 Key。');
          return;
        }
        if (settingsState.hasPermissionKey(key, point?.id || null)) {
          feedback.error('权限 Key 已存在，请换一个 Key。');
          return;
        }
        const group = resolvePermissionGroup(data.groupKey);
        const input = { ...data, key, groupKey: group.key, groupName: group.name };
        if (point) {
          settingsState.updatePermissionPoint(point.id, input);
          feedback.success('权限点已保存。');
        } else {
          settingsState.addPermissionPoint(input);
          feedback.success('权限点已新增。');
        }
        close();
      },
      onCancel: close,
    }));
  }

  async function handleDeletePermission(point) {
    if (!canPermission) {
      warnNoPermission();
      return;
    }
    if (point.system) {
      feedback.warning('系统权限点不能删除。');
      return;
    }
    if (!await Dialog.confirm({
      title: '删除权限点',
      content: `确认删除“${point.name}”吗？`,
      type: 'warning',
      confirmText: '删除',
      cancelText: '取消',
    })) {
      return;
    }
    settingsState.deletePermissionPoint(point.id);
    feedback.success('权限点已删除。');
  }

  function handleTogglePermission(point) {
    if (!canPermission) {
      warnNoPermission();
      return;
    }
    settingsState.togglePermissionPointStatus(point.id);
    feedback.success(`权限点已${point.status === 'active' ? '停用' : '启用'}。`);
  }

  function handlePermissionPageSize(size) {
    permissionPageSize.value = size;
  }

  const header = settingsHeaderView({
    activeTab: settingsState.activeTab,
    stats: {
      dictionary: settingsState.dictionaryStats,
      menu: settingsState.menuStats,
      permission: settingsState.permissionStats,
    },
    onSelectTab: settingsState.setActiveTab,
  });

  const dictionary = dictionaryView({
    dictionaries: settingsState.filteredDictionaries,
    dictionaryKeyword: settingsState.dictionaryKeyword,
    selectedDictionary: settingsState.selectedDictionary,
    selectedDictionaryId: settingsState.selectedDictionaryId,
    dictionaryItemKeyword: settingsState.dictionaryItemKeyword,
    filteredDictionaryItems: settingsState.filteredDictionaryItems,
    canManage: canDictionary,
    onSearch: event => settingsState.setDictionaryKeyword(event.target.value),
    onSelect: settingsState.setSelectedDictionary,
    onItemSearch: event => settingsState.setDictionaryItemKeyword(event.target.value),
    onToggleDictionary: handleToggleDictionary,
    onEditDictionary: openDictionaryForm,
    onAddDictionary: () => openDictionaryForm(),
    onAddItem: dictionaryItem => openDictionaryItemForm(dictionaryItem),
    onEditItem: (dictionary, item) => openDictionaryItemForm(dictionary, item),
    onToggleItem: (dictionary, item) => {
      settingsState.toggleDictionaryItemStatus(dictionary.id, item.id);
      feedback.success(`字典项已${item.status === 'active' ? '停用' : '启用'}。`);
    },
    onDeleteItem: handleDeleteDictionaryItem,
  });

  const menu = menuView({
    menus: settingsState.filteredMenus,
    menuKeyword: settingsState.menuKeyword,
    canManage: canMenu,
    onSearch: event => settingsState.setMenuKeyword(event.target.value),
    onEdit: openMenuForm,
    onToggle: handleToggleMenu,
  });

  const permission = permissionPointView({
    points: settingsState.filteredPermissionPoints,
    permissionKeyword: settingsState.permissionKeyword,
    pageSize: permissionPageSize,
    canManage: canPermission,
    onSearch: event => settingsState.setPermissionKeyword(event.target.value),
    onPageSizeChange: handlePermissionPageSize,
    onEdit: openPermissionForm,
    onAdd: () => openPermissionForm(),
    onToggle: handleTogglePermission,
    onDelete: handleDeletePermission,
  });

  return settingsPageView({
    activeTab: settingsState.activeTab,
    header,
    dictionary,
    menu,
    permission,
  });
}
