import { computed, signal } from '@kupola/platform';

export const PERMISSION_GROUPS = Object.freeze([
  {
    key: 'dashboard',
    title: '仪表盘',
    description: '查看工作台和统计数据',
    permissions: Object.freeze([
      { key: 'dashboard:view', label: '查看仪表盘', description: '访问首页概览和统计卡片' },
    ]),
  },
  {
    key: 'user',
    title: '用户管理',
    description: '维护用户资料和用户状态',
    permissions: Object.freeze([
      { key: 'user:list', label: '用户列表', description: '查看用户列表和搜索用户' },
      { key: 'user:view', label: '用户详情', description: '查看用户详情页' },
      { key: 'user:create', label: '新增用户', description: '创建新的系统用户' },
      { key: 'user:edit', label: '编辑用户', description: '修改用户基础资料' },
      { key: 'user:delete', label: '删除用户', description: '删除或停用用户' },
    ]),
  },
  {
    key: 'organization',
    title: '机构管理',
    description: '维护集团、分机构和部门架构',
    permissions: Object.freeze([
      { key: 'organization:list', label: '查看机构', description: '访问机构管理页面和组织架构树' },
      { key: 'organization:create', label: '新增机构', description: '创建直属部门、分机构或下级部门' },
      { key: 'organization:edit', label: '编辑机构', description: '修改机构基础资料、负责人和状态' },
      { key: 'organization:delete', label: '删除机构', description: '删除无下级的机构或部门' },
    ]),
  },
  {
    key: 'permission',
    title: '权限管理',
    description: '维护角色和权限分配',
    permissions: Object.freeze([
      { key: 'permission:list', label: '查看权限', description: '访问权限管理页面' },
      { key: 'permission:create', label: '新增角色', description: '创建业务角色' },
      { key: 'permission:edit', label: '编辑角色', description: '修改角色资料' },
      { key: 'permission:assign', label: '分配权限', description: '调整角色权限范围' },
      { key: 'permission:delete', label: '删除角色', description: '删除非系统角色' },
    ]),
  },
  {
    key: 'audit',
    title: '审计日志',
    description: '查看后台关键操作记录',
    permissions: Object.freeze([
      { key: 'audit:list', label: '查看操作日志', description: '访问操作日志页面并筛选审计记录' },
    ]),
  },
  {
    key: 'settings',
    title: '系统设置',
    description: '维护字典、菜单和权限点定义',
    permissions: Object.freeze([
      { key: 'settings:list', label: '查看系统设置', description: '访问系统设置页面和配置概览' },
      { key: 'settings:dictionary', label: '管理字典', description: '新增、编辑和停用系统字典项' },
      { key: 'settings:menu', label: '管理菜单', description: '调整侧边栏菜单和路由权限关系' },
      { key: 'settings:permission', label: '管理权限点', description: '维护权限点分组、名称和启用状态' },
    ]),
  },
]);

export const ALL_PERMISSION_KEYS = Object.freeze(
  PERMISSION_GROUPS.flatMap(group => group.permissions.map(permission => permission.key)),
);

export const DATA_SCOPE_OPTIONS = Object.freeze([
  {
    type: 'all',
    label: '全部机构',
    shortLabel: '全部',
    description: '可访问集团下全部机构和部门的数据。',
  },
  {
    type: 'currentOrg',
    label: '本机构',
    shortLabel: '本机构',
    description: '仅访问当前登录用户所属机构的数据。',
  },
  {
    type: 'currentAndChildren',
    label: '本机构及下级',
    shortLabel: '本级+下级',
    description: '访问当前所属机构及其下级机构的数据。',
  },
  {
    type: 'customOrgs',
    label: '指定机构',
    shortLabel: '指定',
    description: '访问勾选机构及其下级机构的数据。',
  },
  {
    type: 'self',
    label: '仅本人',
    shortLabel: '本人',
    description: '仅访问本人创建、负责或被分配的数据。',
  },
]);

export const DEFAULT_DATA_SCOPE = Object.freeze({
  type: 'currentAndChildren',
  organizationIds: Object.freeze([]),
});

export const INITIAL_ROLES = Object.freeze([
  {
    id: 1,
    name: '超级管理员',
    code: 'admin',
    description: '拥有系统全部功能权限，作为内置角色不可删除。',
    status: 'active',
    system: true,
    userCount: 1,
    permissions: ALL_PERMISSION_KEYS,
    dataScope: {
      type: 'all',
      organizationIds: [],
    },
  },
  {
    id: 2,
    name: '运营管理员',
    code: 'operator',
    description: '负责日常用户维护和基础数据查看。',
    status: 'active',
    system: false,
    userCount: 3,
    permissions: [
      'dashboard:view',
      'user:list',
      'user:view',
      'user:create',
      'user:edit',
    ],
    dataScope: {
      type: 'currentAndChildren',
      organizationIds: [],
    },
  },
  {
    id: 3,
    name: '只读成员',
    code: 'viewer',
    description: '只能查看基础信息，不能执行写操作。',
    status: 'active',
    system: false,
    userCount: 8,
    permissions: [ 'dashboard:view', 'user:list', 'user:view' ],
    dataScope: {
      type: 'self',
      organizationIds: [],
    },
  },
  {
    id: 4,
    name: '审计员',
    code: 'auditor',
    description: '用于检查权限配置和用户访问范围。',
    status: 'active',
    system: false,
    userCount: 0,
    permissions: [ 'dashboard:view', 'permission:list' ],
    dataScope: {
      type: 'customOrgs',
      organizationIds: [ 1, 3 ],
    },
  },
]);

const VALID_PERMISSION_KEYS = new Set(ALL_PERMISSION_KEYS);
const VALID_DATA_SCOPE_TYPES = new Set(DATA_SCOPE_OPTIONS.map(option => option.type));
const PERMISSION_BY_KEY = new Map(
  PERMISSION_GROUPS.flatMap(group => group.permissions.map(permission => [ permission.key, permission ])),
);
const DATA_SCOPE_BY_TYPE = new Map(DATA_SCOPE_OPTIONS.map(option => [ option.type, option ]));

function normalizeKeyword(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRoleInput(input) {
  return {
    name: String(input.name || '').trim(),
    code: String(input.code || '').trim().toLowerCase(),
    description: String(input.description || '').trim(),
    status: input.status === 'inactive' ? 'inactive' : 'active',
  };
}

function normalizePermissionKeys(keys) {
  return [ ...new Set(keys || []) ].filter(key => VALID_PERMISSION_KEYS.has(key));
}

function normalizeDataScope(input = DEFAULT_DATA_SCOPE) {
  const type = VALID_DATA_SCOPE_TYPES.has(input?.type)
    ? input.type
    : DEFAULT_DATA_SCOPE.type;
  const organizationIds = type === 'customOrgs'
    ? [ ...new Set(input?.organizationIds || []) ]
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0)
    : [];

  return { type, organizationIds };
}

function getNextRoleId(roles) {
  return Math.max(0, ...roles.map(role => role.id)) + 1;
}

function samePermissionSet(left, right) {
  if (left.size !== right.size) {
    return false;
  }
  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }
  return true;
}

function sameValueSet(leftValues, rightValues) {
  const left = new Set(leftValues);
  const right = new Set(rightValues);
  if (left.size !== right.size) {
    return false;
  }
  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }
  return true;
}

function sameDataScope(left, right) {
  const leftScope = normalizeDataScope(left);
  const rightScope = normalizeDataScope(right);
  return leftScope.type === rightScope.type
    && sameValueSet(leftScope.organizationIds, rightScope.organizationIds);
}

function permissionChangeItem(key) {
  const permission = PERMISSION_BY_KEY.get(key);
  return {
    key,
    label: permission?.label || key,
  };
}

function dataScopeChangeSummary(left, right) {
  const leftScope = normalizeDataScope(left);
  const rightScope = normalizeDataScope(right);
  if (sameDataScope(leftScope, rightScope)) {
    return null;
  }

  const fromLabel = DATA_SCOPE_BY_TYPE.get(rightScope.type)?.label || '未设置';
  const toLabel = DATA_SCOPE_BY_TYPE.get(leftScope.type)?.label || '未设置';
  return {
    from: rightScope.type === 'customOrgs'
      ? `${fromLabel} ${rightScope.organizationIds.length} 个`
      : fromLabel,
    to: leftScope.type === 'customOrgs'
      ? `${toLabel} ${leftScope.organizationIds.length} 个`
      : toLabel,
  };
}

function createCopiedRoleCode(roles, sourceCode) {
  const baseCode = `${String(sourceCode || 'role').replace(/_copy(_\d+)?$/, '')}_copy`;
  const existingCodes = new Set(roles.map(role => role.code));
  if (!existingCodes.has(baseCode)) {
    return baseCode;
  }
  let index = 2;
  while (existingCodes.has(`${baseCode}_${index}`)) {
    index += 1;
  }
  return `${baseCode}_${index}`;
}

function createRoleSnapshot(role) {
  return {
    ...role,
    permissions: normalizePermissionKeys(role.permissions),
    dataScope: normalizeDataScope(role.dataScope),
  };
}

export function createPermissionState(initialRoles = INITIAL_ROLES) {
  const roles = signal(initialRoles.map(createRoleSnapshot));
  const searchKeyword = signal('');
  const permissionKeyword = signal('');
  const saveStatus = signal('idle');
  const selectedRoleId = signal(roles.value[0]?.id || null);
  const draftPermissionKeys = signal(new Set(roles.value[0]?.permissions || []));
  const draftDataScope = signal(normalizeDataScope(roles.value[0]?.dataScope));

  const filteredRoles = computed(() => {
    const keyword = normalizeKeyword(searchKeyword.value);
    if (!keyword) {
      return roles.value;
    }

    return roles.value.filter(role => role.name.toLowerCase().includes(keyword)
      || role.code.toLowerCase().includes(keyword)
      || role.description.toLowerCase().includes(keyword));
  });

  const selectedRole = computed(() => {
    return roles.value.find(role => role.id === selectedRoleId.value)
      || roles.value[0]
      || null;
  });

  const roleStats = computed(() => {
    const activeCount = roles.value.filter(role => role.status === 'active').length;
    return {
      total: roles.value.length,
      active: activeCount,
      inactive: roles.value.length - activeCount,
      permissionTotal: ALL_PERMISSION_KEYS.length,
    };
  });

  const isPermissionDirty = computed(() => {
    const role = selectedRole.value;
    if (!role) {
      return false;
    }
    return !samePermissionSet(draftPermissionKeys.value, new Set(role.permissions));
  });

  const isDataScopeDirty = computed(() => {
    const role = selectedRole.value;
    if (!role) {
      return false;
    }
    return !sameDataScope(draftDataScope.value, role.dataScope);
  });

  const isRoleConfigDirty = computed(() => isPermissionDirty.value || isDataScopeDirty.value);

  const selectedPermissionCount = computed(() => draftPermissionKeys.value.size);

  const filteredPermissionGroups = computed(() => {
    const keyword = normalizeKeyword(permissionKeyword.value);
    if (!keyword) {
      return PERMISSION_GROUPS;
    }

    return PERMISSION_GROUPS.map(group => {
      const groupMatches = group.key.toLowerCase().includes(keyword)
        || group.title.toLowerCase().includes(keyword)
        || group.description.toLowerCase().includes(keyword);
      const permissions = groupMatches
        ? group.permissions
        : group.permissions.filter(permission => permission.key.toLowerCase().includes(keyword)
          || permission.label.toLowerCase().includes(keyword)
          || permission.description.toLowerCase().includes(keyword));
      return permissions.length > 0 ? { ...group, permissions } : null;
    }).filter(Boolean);
  });

  const matchedPermissionCount = computed(() => {
    return filteredPermissionGroups.value.reduce((sum, group) => sum + group.permissions.length, 0);
  });

  const permissionChangePreview = computed(() => {
    const role = selectedRole.value;
    if (!role) {
      return { added: [], removed: [], dataScope: null };
    }

    const currentKeys = new Set(role.permissions || []);
    const draftKeys = draftPermissionKeys.value;
    return {
      added: [ ...draftKeys ]
        .filter(key => !currentKeys.has(key))
        .map(permissionChangeItem),
      removed: [ ...currentKeys ]
        .filter(key => !draftKeys.has(key))
        .map(permissionChangeItem),
      dataScope: dataScopeChangeSummary(draftDataScope.value, role.dataScope),
    };
  });

  function setSearchKeyword(value) {
    searchKeyword.value = value;
  }

  function setPermissionKeyword(value) {
    permissionKeyword.value = value;
  }

  function setSaveStatus(value) {
    saveStatus.value = [ 'idle', 'saving', 'success', 'error' ].includes(value) ? value : 'idle';
  }

  function resetDraftForRole(role) {
    draftPermissionKeys.value = new Set(role?.permissions || []);
    draftDataScope.value = normalizeDataScope(role?.dataScope);
    saveStatus.value = 'idle';
  }

  function selectRole(roleId) {
    const nextRole = roles.value.find(role => role.id === roleId) || null;
    if (!nextRole) {
      return;
    }
    selectedRoleId.value = nextRole.id;
    resetDraftForRole(nextRole);
  }

  function hasRoleCode(code, exceptRoleId = null) {
    const normalizedCode = String(code || '').trim().toLowerCase();
    return roles.value.some(role => role.code === normalizedCode && role.id !== exceptRoleId);
  }

  function addRole(input) {
    const roleInput = normalizeRoleInput(input);
    const role = {
      id: getNextRoleId(roles.value),
      ...roleInput,
      system: false,
      userCount: 0,
      permissions: [],
      dataScope: normalizeDataScope(DEFAULT_DATA_SCOPE),
    };
    roles.value = [ ...roles.value, role ];
    searchKeyword.value = '';
    selectRole(role.id);
    return role;
  }

  function copyRole(sourceRoleId, input = null) {
    const sourceRole = roles.value.find(role => role.id === sourceRoleId);
    if (!sourceRole) {
      return null;
    }
    const fallbackInput = {
      name: `${sourceRole.name} 副本`,
      code: createCopiedRoleCode(roles.value, sourceRole.code),
      description: sourceRole.description,
      status: sourceRole.status,
    };
    const roleInput = normalizeRoleInput(input || fallbackInput);
    const role = {
      id: getNextRoleId(roles.value),
      ...roleInput,
      system: false,
      userCount: 0,
      permissions: normalizePermissionKeys(sourceRole.permissions),
      dataScope: normalizeDataScope(sourceRole.dataScope),
    };
    roles.value = [ ...roles.value, role ];
    searchKeyword.value = '';
    selectRole(role.id);
    return role;
  }

  function updateRole(roleId, input) {
    const roleInput = normalizeRoleInput(input);
    let updatedRole = null;
    roles.value = roles.value.map(role => {
      if (role.id !== roleId) {
        return role;
      }
      updatedRole = {
        ...role,
        ...roleInput,
        code: role.system ? role.code : roleInput.code,
      };
      return updatedRole;
    });
    return updatedRole;
  }

  function deleteRole(roleId) {
    const role = roles.value.find(item => item.id === roleId);
    if (!role || role.system) {
      return false;
    }

    const nextRoles = roles.value.filter(item => item.id !== roleId);
    roles.value = nextRoles;
    if (selectedRoleId.value === roleId) {
      const nextRole = nextRoles[0] || null;
      selectedRoleId.value = nextRole?.id || null;
      resetDraftForRole(nextRole);
    }
    return true;
  }

  function togglePermission(permissionKey, checked) {
    if (!VALID_PERMISSION_KEYS.has(permissionKey)) {
      return;
    }
    const nextKeys = new Set(draftPermissionKeys.value);
    const shouldCheck = typeof checked === 'boolean' ? checked : !nextKeys.has(permissionKey);
    if (shouldCheck) {
      nextKeys.add(permissionKey);
    } else {
      nextKeys.delete(permissionKey);
    }
    draftPermissionKeys.value = nextKeys;
    saveStatus.value = 'idle';
  }

  function togglePermissionGroup(groupKey, checked, permissionKeys = null) {
    const group = PERMISSION_GROUPS.find(item => item.key === groupKey);
    if (!group) {
      return;
    }
    const keys = Array.isArray(permissionKeys) && permissionKeys.length > 0
      ? permissionKeys.filter(key => VALID_PERMISSION_KEYS.has(key))
      : group.permissions.map(permission => permission.key);
    const nextKeys = new Set(draftPermissionKeys.value);
    const shouldCheck = typeof checked === 'boolean'
      ? checked
      : !keys.every(key => nextKeys.has(key));

    for (const key of keys) {
      if (shouldCheck) {
        nextKeys.add(key);
      } else {
        nextKeys.delete(key);
      }
    }
    draftPermissionKeys.value = nextKeys;
    saveStatus.value = 'idle';
  }

  function selectAllPermissions() {
    draftPermissionKeys.value = new Set(ALL_PERMISSION_KEYS);
    saveStatus.value = 'idle';
  }

  function clearPermissions() {
    draftPermissionKeys.value = new Set();
    saveStatus.value = 'idle';
  }

  function resetPermissionDraft() {
    resetDraftForRole(selectedRole.value);
  }

  function setDataScopeType(type) {
    if (!VALID_DATA_SCOPE_TYPES.has(type)) {
      return;
    }
    draftDataScope.value = normalizeDataScope({
      ...draftDataScope.value,
      type,
    });
    saveStatus.value = 'idle';
  }

  function toggleDataScopeOrganization(organizationId, checked) {
    const id = Number(organizationId);
    if (!Number.isFinite(id) || id <= 0) {
      return;
    }

    const nextIds = new Set(draftDataScope.value.organizationIds || []);
    const shouldCheck = typeof checked === 'boolean' ? checked : !nextIds.has(id);
    if (shouldCheck) {
      nextIds.add(id);
    } else {
      nextIds.delete(id);
    }

    draftDataScope.value = normalizeDataScope({
      type: 'customOrgs',
      organizationIds: [ ...nextIds ],
    });
    saveStatus.value = 'idle';
  }

  function clearDataScopeOrganizations() {
    draftDataScope.value = normalizeDataScope({
      type: 'customOrgs',
      organizationIds: [],
    });
    saveStatus.value = 'idle';
  }

  function saveRoleConfigDraft() {
    const role = selectedRole.value;
    if (!role) {
      return null;
    }
    const nextPermissions = normalizePermissionKeys([ ...draftPermissionKeys.value ]);
    const nextDataScope = normalizeDataScope(draftDataScope.value);
    roles.value = roles.value.map(item => item.id === role.id
      ? { ...item, permissions: nextPermissions, dataScope: nextDataScope }
      : item);
    draftPermissionKeys.value = new Set(nextPermissions);
    draftDataScope.value = nextDataScope;
    return roles.value.find(item => item.id === role.id) || null;
  }

  function savePermissionDraft() {
    return saveRoleConfigDraft();
  }

  return {
    roles,
    searchKeyword,
    permissionKeyword,
    saveStatus,
    filteredRoles,
    filteredPermissionGroups,
    selectedRoleId,
    selectedRole,
    draftPermissionKeys,
    draftDataScope,
    roleStats,
    isPermissionDirty,
    isDataScopeDirty,
    isRoleConfigDirty,
    selectedPermissionCount,
    matchedPermissionCount,
    permissionChangePreview,
    permissionGroups: PERMISSION_GROUPS,
    allPermissionKeys: ALL_PERMISSION_KEYS,
    dataScopeOptions: DATA_SCOPE_OPTIONS,
    setSearchKeyword,
    setPermissionKeyword,
    setSaveStatus,
    selectRole,
    hasRoleCode,
    addRole,
    copyRole,
    updateRole,
    deleteRole,
    togglePermission,
    togglePermissionGroup,
    selectAllPermissions,
    clearPermissions,
    resetPermissionDraft,
    setDataScopeType,
    toggleDataScopeOrganization,
    clearDataScopeOrganizations,
    saveRoleConfigDraft,
    savePermissionDraft,
  };
}
