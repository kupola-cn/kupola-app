import { computed, signal } from '@kupola/platform';
import { PERMISSION_GROUPS } from '../permissions/state.js';

export const SETTINGS_TABS = Object.freeze([
  { key: 'dictionary', label: '字典管理', description: '维护状态、机构类型和业务标签等选项' },
  { key: 'menu', label: '菜单管理', description: '维护侧边栏菜单、路由和权限点关系' },
  { key: 'permission', label: '权限点管理', description: '维护可分配给角色的功能权限点' },
]);

export const DICTIONARY_STATUS_OPTIONS = Object.freeze([
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
]);

export const INITIAL_DICTIONARIES = Object.freeze([
  {
    id: 1,
    code: 'user_status',
    name: '用户状态',
    description: '控制用户是否可以正常登录和使用系统。',
    status: 'active',
    system: true,
    items: [
      { id: 11, value: 'active', label: '启用', sort: 1, status: 'active' },
      { id: 12, value: 'inactive', label: '停用', sort: 2, status: 'active' },
      { id: 13, value: 'locked', label: '锁定', sort: 3, status: 'active' },
    ],
  },
  {
    id: 2,
    code: 'organization_type',
    name: '机构类型',
    description: '用于标识集团、分公司和部门等组织节点。',
    status: 'active',
    system: true,
    items: [
      { id: 21, value: 'group', label: '集团', sort: 1, status: 'active' },
      { id: 22, value: 'branch', label: '分公司', sort: 2, status: 'active' },
      { id: 23, value: 'department', label: '部门', sort: 3, status: 'active' },
    ],
  },
  {
    id: 3,
    code: 'role_tag',
    name: '角色标签',
    description: '用于给角色增加业务侧可读标签。',
    status: 'active',
    system: false,
    items: [
      { id: 31, value: 'internal', label: '内部员工', sort: 1, status: 'active' },
      { id: 32, value: 'external', label: '外部协作', sort: 2, status: 'active' },
      { id: 33, value: 'temporary', label: '临时角色', sort: 3, status: 'inactive' },
    ],
  },
]);

export const INITIAL_MENU_ITEMS = Object.freeze([
  { id: 1, parentId: null, parentName: '-', name: '首页', route: '/', routeKey: 'dashboard', icon: 'dashboard', permission: 'dashboard:view', sort: 1, status: 'active', system: true },
  { id: 2, parentId: null, parentName: '-', name: '用户管理', route: '/users', routeKey: 'user-list', icon: 'user', permission: 'user:list', sort: 2, status: 'active', system: true },
  { id: 3, parentId: null, parentName: '-', name: '机构管理', route: '/organizations', routeKey: 'organization-list', icon: 'users', permission: 'organization:list', sort: 3, status: 'active', system: true },
  { id: 4, parentId: null, parentName: '-', name: '权限管理', route: '/permissions', routeKey: 'permission-list', icon: 'shield', permission: 'permission:list', sort: 4, status: 'active', system: true },
  { id: 5, parentId: null, parentName: '-', name: '审计日志', route: '/audit', routeKey: 'audit-log', icon: 'file-text', permission: 'audit:list', sort: 5, status: 'active', system: true },
  { id: 6, parentId: 5, parentName: '审计日志', name: '登录日志', route: '/audit/login', routeKey: 'audit-login-log', icon: 'key', permission: 'audit:list', sort: 1, status: 'active', system: true },
  { id: 7, parentId: null, parentName: '-', name: '系统设置', route: '/settings', routeKey: 'settings', icon: 'settings', permission: 'settings:list', sort: 6, status: 'active', system: true },
  { id: 8, parentId: null, parentName: '-', name: '通知消息', route: '/notifications', routeKey: 'notifications', icon: 'bell', permission: '', sort: 7, status: 'active', system: true },
]);

export const INITIAL_PERMISSION_POINTS = Object.freeze(
  PERMISSION_GROUPS.flatMap(group => group.permissions.map(permission => ({
    id: permission.key,
    groupKey: group.key,
    groupName: group.title,
    key: permission.key,
    name: permission.label,
    description: permission.description,
    status: 'active',
    system: true,
  }))),
);

const STATUS_LABELS = Object.freeze({ active: '启用', inactive: '停用' });

function normalizeKeyword(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeStatus(value) {
  return value === 'inactive' ? 'inactive' : 'active';
}

function cloneDictionary(dictionary) {
  return {
    ...dictionary,
    items: (dictionary.items || []).map(item => ({ ...item, status: normalizeStatus(item.status) })),
  };
}

function nextId(items) {
  return Math.max(0, ...items.map(item => Number(item.id) || 0)) + 1;
}

function nextPermissionPointId(points) {
  const customIds = points
    .map(point => String(point.id || ''))
    .filter(id => id.startsWith('custom-'))
    .map(id => Number(id.slice(7)))
    .filter(id => Number.isFinite(id));
  return `custom-${Math.max(0, ...customIds) + 1}`;
}

function toggleItemStatus(items, id) {
  return items.map(item => item.id === id
    ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' }
    : item);
}

function createPermissionSnapshot(point) {
  return { ...point, status: normalizeStatus(point.status) };
}

export function createSettingsState({
  dictionaries = INITIAL_DICTIONARIES,
  menus = INITIAL_MENU_ITEMS,
  permissionPoints = INITIAL_PERMISSION_POINTS,
} = {}) {
  const activeTab = signal('dictionary');
  const dictionariesState = signal(dictionaries.map(cloneDictionary));
  const dictionaryKeyword = signal('');
  const selectedDictionaryId = signal(dictionariesState.value[0]?.id || null);
  const dictionaryItemKeyword = signal('');
  const menusState = signal(menus.map(item => ({ ...item, status: normalizeStatus(item.status) })));
  const menuKeyword = signal('');
  const permissionPointsState = signal(permissionPoints.map(createPermissionSnapshot));
  const permissionKeyword = signal('');

  const filteredDictionaries = computed(() => {
    const keyword = normalizeKeyword(dictionaryKeyword.value);
    if (!keyword) {
      return dictionariesState.value;
    }
    return dictionariesState.value.filter(dictionary => [
      dictionary.code,
      dictionary.name,
      dictionary.description,
    ].some(value => String(value).toLowerCase().includes(keyword)));
  });

  const selectedDictionary = computed(() => filteredDictionaries.value.find(
    dictionary => dictionary.id === selectedDictionaryId.value,
  ) || filteredDictionaries.value[0] || null);

  const filteredDictionaryItems = computed(() => {
    const keyword = normalizeKeyword(dictionaryItemKeyword.value);
    const items = selectedDictionary.value?.items || [];
    return items
      .filter(item => !keyword
        || item.value.toLowerCase().includes(keyword)
        || item.label.toLowerCase().includes(keyword))
      .sort((left, right) => left.sort - right.sort);
  });

  const dictionaryStats = computed(() => ({
    total: dictionariesState.value.length,
    active: dictionariesState.value.filter(item => item.status === 'active').length,
    items: dictionariesState.value.reduce((sum, item) => sum + item.items.length, 0),
  }));

  const filteredMenus = computed(() => {
    const keyword = normalizeKeyword(menuKeyword.value);
    return menusState.value
      .filter(item => !keyword || [ item.name, item.route, item.routeKey, item.permission, item.parentName ]
        .some(value => String(value).toLowerCase().includes(keyword)))
      .sort((left, right) => left.sort - right.sort || left.id - right.id);
  });

  const menuStats = computed(() => ({
    total: menusState.value.length,
    active: menusState.value.filter(item => item.status === 'active').length,
    system: menusState.value.filter(item => item.system).length,
  }));

  const filteredPermissionPoints = computed(() => {
    const keyword = normalizeKeyword(permissionKeyword.value);
    return permissionPointsState.value.filter(point => !keyword || [
      point.groupName,
      point.key,
      point.name,
      point.description,
    ].some(value => String(value).toLowerCase().includes(keyword)));
  });

  const permissionStats = computed(() => ({
    total: permissionPointsState.value.length,
    active: permissionPointsState.value.filter(item => item.status === 'active').length,
    groups: new Set(permissionPointsState.value.map(item => item.groupKey)).size,
  }));

  function setActiveTab(value) {
    if (SETTINGS_TABS.some(tab => tab.key === value)) {
      activeTab.value = value;
    }
  }

  function setDictionaryKeyword(value) {
    dictionaryKeyword.value = value;
  }

  function setSelectedDictionary(id) {
    if (dictionariesState.value.some(dictionary => dictionary.id === id)) {
      selectedDictionaryId.value = id;
      dictionaryItemKeyword.value = '';
    }
  }

  function setDictionaryItemKeyword(value) {
    dictionaryItemKeyword.value = value;
  }

  function hasDictionaryCode(code, exceptId = null) {
    const normalized = String(code || '').trim().toLowerCase();
    return dictionariesState.value.some(item => item.code === normalized && item.id !== exceptId);
  }

  function addDictionary(input) {
    const dictionary = {
      id: nextId(dictionariesState.value),
      code: String(input.code || '').trim().toLowerCase(),
      name: String(input.name || '').trim(),
      description: String(input.description || '').trim(),
      status: normalizeStatus(input.status),
      system: false,
      items: [],
    };
    dictionariesState.value = [ ...dictionariesState.value, dictionary ];
    selectedDictionaryId.value = dictionary.id;
    return dictionary;
  }

  function updateDictionary(id, input) {
    let updated = null;
    dictionariesState.value = dictionariesState.value.map(dictionary => {
      if (dictionary.id !== id) {
        return dictionary;
      }
      updated = {
        ...dictionary,
        name: String(input.name || '').trim(),
        description: String(input.description || '').trim(),
        status: normalizeStatus(input.status),
      };
      return updated;
    });
    return updated;
  }

  function toggleDictionaryStatus(id) {
    dictionariesState.value = dictionariesState.value.map(dictionary => dictionary.id === id
      ? { ...dictionary, status: dictionary.status === 'active' ? 'inactive' : 'active' }
      : dictionary);
  }

  function hasDictionaryItemValue(dictionaryId, value, exceptId = null) {
    const normalized = String(value || '').trim().toLowerCase();
    return Boolean(dictionariesState.value.find(dictionary => dictionary.id === dictionaryId)
      ?.items.some(item => item.value === normalized && item.id !== exceptId));
  }

  function addDictionaryItem(dictionaryId, input) {
    const item = {
      id: nextId(dictionariesState.value.flatMap(dictionary => dictionary.items)),
      value: String(input.value || '').trim().toLowerCase(),
      label: String(input.label || '').trim(),
      sort: Math.max(1, Number(input.sort) || 1),
      status: normalizeStatus(input.status),
    };
    dictionariesState.value = dictionariesState.value.map(dictionary => dictionary.id === dictionaryId
      ? { ...dictionary, items: [ ...dictionary.items, item ] }
      : dictionary);
    return item;
  }

  function updateDictionaryItem(dictionaryId, itemId, input) {
    let updated = null;
    dictionariesState.value = dictionariesState.value.map(dictionary => {
      if (dictionary.id !== dictionaryId) {
        return dictionary;
      }
      return {
        ...dictionary,
        items: dictionary.items.map(item => {
          if (item.id !== itemId) {
            return item;
          }
          updated = {
            ...item,
            value: String(input.value || '').trim().toLowerCase(),
            label: String(input.label || '').trim(),
            sort: Math.max(1, Number(input.sort) || 1),
            status: normalizeStatus(input.status),
          };
          return updated;
        }),
      };
    });
    return updated;
  }

  function toggleDictionaryItemStatus(dictionaryId, itemId) {
    dictionariesState.value = dictionariesState.value.map(dictionary => dictionary.id === dictionaryId
      ? { ...dictionary, items: toggleItemStatus(dictionary.items, itemId) }
      : dictionary);
  }

  function deleteDictionaryItem(dictionaryId, itemId) {
    dictionariesState.value = dictionariesState.value.map(dictionary => dictionary.id === dictionaryId
      ? { ...dictionary, items: dictionary.items.filter(item => item.id !== itemId) }
      : dictionary);
  }

  function setMenuKeyword(value) {
    menuKeyword.value = value;
  }

  function updateMenu(id, input) {
    let updated = null;
    menusState.value = menusState.value.map(item => {
      if (item.id !== id) {
        return item;
      }
      updated = {
        ...item,
        name: String(input.name || '').trim(),
        route: String(input.route || '').trim(),
        routeKey: String(input.routeKey || '').trim(),
        icon: String(input.icon || '').trim(),
        permission: String(input.permission || '').trim(),
        sort: Math.max(1, Number(input.sort) || 1),
        status: normalizeStatus(input.status),
      };
      return updated;
    });
    return updated;
  }

  function toggleMenuStatus(id) {
    menusState.value = menusState.value.map(item => item.id === id
      ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' }
      : item);
  }

  function setPermissionKeyword(value) {
    permissionKeyword.value = value;
  }

  function hasPermissionKey(key, exceptId = null) {
    const normalized = String(key || '').trim().toLowerCase();
    return permissionPointsState.value.some(item => item.key === normalized && item.id !== exceptId);
  }

  function addPermissionPoint(input) {
    const point = {
      id: nextPermissionPointId(permissionPointsState.value),
      groupKey: String(input.groupKey || '').trim(),
      groupName: String(input.groupName || '').trim(),
      key: String(input.key || '').trim().toLowerCase(),
      name: String(input.name || '').trim(),
      description: String(input.description || '').trim(),
      status: normalizeStatus(input.status),
      system: false,
    };
    permissionPointsState.value = [ ...permissionPointsState.value, point ];
    return point;
  }

  function updatePermissionPoint(id, input) {
    let updated = null;
    permissionPointsState.value = permissionPointsState.value.map(point => {
      if (point.id !== id) {
        return point;
      }
      updated = {
        ...point,
        groupKey: String(input.groupKey || '').trim(),
        groupName: String(input.groupName || '').trim(),
        key: String(input.key || '').trim().toLowerCase(),
        name: String(input.name || '').trim(),
        description: String(input.description || '').trim(),
        status: normalizeStatus(input.status),
      };
      return updated;
    });
    return updated;
  }

  function togglePermissionPointStatus(id) {
    permissionPointsState.value = permissionPointsState.value.map(point => point.id === id
      ? { ...point, status: point.status === 'active' ? 'inactive' : 'active' }
      : point);
  }

  function deletePermissionPoint(id) {
    permissionPointsState.value = permissionPointsState.value.filter(point => point.id !== id);
  }

  return {
    activeTab,
    dictionaries: dictionariesState,
    dictionaryKeyword,
    selectedDictionaryId,
    selectedDictionary,
    dictionaryItemKeyword,
    filteredDictionaries,
    filteredDictionaryItems,
    dictionaryStats,
    menus: menusState,
    menuKeyword,
    filteredMenus,
    menuStats,
    permissionPoints: permissionPointsState,
    permissionKeyword,
    filteredPermissionPoints,
    permissionStats,
    statusLabels: STATUS_LABELS,
    setActiveTab,
    setDictionaryKeyword,
    setSelectedDictionary,
    setDictionaryItemKeyword,
    hasDictionaryCode,
    addDictionary,
    updateDictionary,
    toggleDictionaryStatus,
    hasDictionaryItemValue,
    addDictionaryItem,
    updateDictionaryItem,
    toggleDictionaryItemStatus,
    deleteDictionaryItem,
    setMenuKeyword,
    updateMenu,
    toggleMenuStatus,
    setPermissionKeyword,
    hasPermissionKey,
    addPermissionPoint,
    updatePermissionPoint,
    togglePermissionPointStatus,
    deletePermissionPoint,
  };
}
