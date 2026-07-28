import { computed, signal } from '@kupola/platform';

export const ORGANIZATION_TYPES = Object.freeze({
  group: '集团',
  branch: '分机构',
  department: '部门',
});

export const INITIAL_ORGANIZATIONS = Object.freeze([
  {
    id: 1,
    parentId: null,
    name: '星河集团',
    code: 'galaxy_group',
    type: 'group',
    status: 'active',
    leader: '陈明',
    memberCount: 286,
    address: '上海市浦东新区世纪大道 100 号',
    description: '集团总部，负责整体经营、战略与资源配置。',
    sort: 1,
  },
  {
    id: 2,
    parentId: 1,
    name: '集团办公室',
    code: 'group_office',
    type: 'department',
    status: 'active',
    leader: '林晓',
    memberCount: 18,
    address: '上海市浦东新区世纪大道 100 号 12F',
    description: '负责集团行政、档案、会议和跨部门协同。',
    sort: 1,
  },
  {
    id: 3,
    parentId: 1,
    name: '财务中心',
    code: 'finance_center',
    type: 'department',
    status: 'active',
    leader: '周宁',
    memberCount: 32,
    address: '上海市浦东新区世纪大道 100 号 10F',
    description: '负责集团预算、结算、税务和经营分析。',
    sort: 2,
  },
  {
    id: 4,
    parentId: 1,
    name: '华东分公司',
    code: 'east_branch',
    type: 'branch',
    status: 'active',
    leader: '王磊',
    memberCount: 96,
    address: '杭州市西湖区文三路 18 号',
    description: '负责华东区域销售、交付和客户运营。',
    sort: 3,
  },
  {
    id: 5,
    parentId: 4,
    name: '华东销售部',
    code: 'east_sales',
    type: 'department',
    status: 'active',
    leader: '赵倩',
    memberCount: 42,
    address: '杭州市西湖区文三路 18 号 6F',
    description: '负责华东区域商机、渠道和重点客户跟进。',
    sort: 1,
  },
  {
    id: 6,
    parentId: 4,
    name: '华东交付部',
    code: 'east_delivery',
    type: 'department',
    status: 'active',
    leader: '刘晨',
    memberCount: 31,
    address: '杭州市西湖区文三路 18 号 7F',
    description: '负责华东客户项目实施、上线和验收。',
    sort: 2,
  },
  {
    id: 7,
    parentId: 1,
    name: '华南分公司',
    code: 'south_branch',
    type: 'branch',
    status: 'active',
    leader: '何雨',
    memberCount: 74,
    address: '深圳市南山区科技园 12 号',
    description: '负责华南区域经营和客户服务。',
    sort: 4,
  },
  {
    id: 8,
    parentId: 7,
    name: '华南运营部',
    code: 'south_ops',
    type: 'department',
    status: 'inactive',
    leader: '许佳',
    memberCount: 16,
    address: '深圳市南山区科技园 12 号 4F',
    description: '负责区域运营支持，目前处于调整中。',
    sort: 1,
  },
]);

function normalizeKeyword(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeCode(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeType(value, parentId) {
  if (parentId == null) {
    return 'group';
  }
  return value === 'branch' ? 'branch' : 'department';
}

function normalizeOrganizationInput(input, parentId) {
  return {
    name: String(input.name || '').trim(),
    code: normalizeCode(input.code),
    type: normalizeType(input.type, parentId),
    status: input.status === 'inactive' ? 'inactive' : 'active',
    leader: String(input.leader || '').trim(),
    memberCount: Math.max(0, Number(input.memberCount) || 0),
    address: String(input.address || '').trim(),
    description: String(input.description || '').trim(),
  };
}

function createOrganizationSnapshot(organization) {
  return {
    leader: '',
    memberCount: 0,
    address: '',
    description: '',
    sort: 0,
    ...organization,
    code: normalizeCode(organization.code),
    type: normalizeType(organization.type, organization.parentId),
    status: organization.status === 'inactive' ? 'inactive' : 'active',
  };
}

function getNextOrganizationId(organizations) {
  return Math.max(0, ...organizations.map(item => item.id)) + 1;
}

function sortOrganizations(left, right) {
  return (left.sort || 0) - (right.sort || 0)
    || String(left.name).localeCompare(String(right.name), 'zh-CN');
}

function matchesOrganization(organization, keyword) {
  return organization.name.toLowerCase().includes(keyword)
    || organization.code.toLowerCase().includes(keyword)
    || ORGANIZATION_TYPES[organization.type]?.includes(keyword)
    || organization.leader.toLowerCase().includes(keyword)
    || organization.address.toLowerCase().includes(keyword);
}

function buildOrganizationTree(organizations, keyword = '') {
  const nodesById = new Map(organizations.map(item => [
    item.id,
    { ...item, children: [] },
  ]));
  const roots = [];

  for (const node of nodesById.values()) {
    const parent = nodesById.get(node.parentId);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  for (const node of nodesById.values()) {
    node.children.sort(sortOrganizations);
  }
  roots.sort(sortOrganizations);

  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) {
    return roots;
  }

  function filterNode(node) {
    const children = node.children.map(filterNode).filter(Boolean);
    if (matchesOrganization(node, normalizedKeyword) || children.length > 0) {
      return { ...node, children };
    }
    return null;
  }

  return roots.map(filterNode).filter(Boolean);
}

export function createOrganizationState(initialOrganizations = INITIAL_ORGANIZATIONS) {
  const organizations = signal(initialOrganizations.map(createOrganizationSnapshot));
  const searchKeyword = signal('');
  const selectedOrganizationId = signal(organizations.value[0]?.id || null);
  const expandedIds = signal(new Set(organizations.value
    .filter(item => item.parentId == null || organizations.value.some(child => child.parentId === item.id))
    .map(item => item.id)));

  const visibleTree = computed(() => buildOrganizationTree(organizations.value, searchKeyword.value));

  const selectedOrganization = computed(() => {
    return organizations.value.find(item => item.id === selectedOrganizationId.value)
      || organizations.value[0]
      || null;
  });

  const selectedChildren = computed(() => {
    const selected = selectedOrganization.value;
    if (!selected) {
      return [];
    }
    return organizations.value
      .filter(item => item.parentId === selected.id)
      .sort(sortOrganizations);
  });

  const organizationStats = computed(() => {
    const total = organizations.value.length;
    const active = organizations.value.filter(item => item.status === 'active').length;
    const branches = organizations.value.filter(item => item.type === 'branch').length;
    const departments = organizations.value.filter(item => item.type === 'department').length;
    const members = organizations.value.reduce((sum, item) => sum + item.memberCount, 0);
    return { total, active, branches, departments, members };
  });

  const selectedPath = computed(() => {
    const path = [];
    let current = selectedOrganization.value;
    const guard = new Set();
    while (current && !guard.has(current.id)) {
      guard.add(current.id);
      path.unshift(current.name);
      current = organizations.value.find(item => item.id === current.parentId) || null;
    }
    return path.join(' / ');
  });

  const selectedDescendantCount = computed(() => {
    const selected = selectedOrganization.value;
    if (!selected) {
      return 0;
    }
    return countDescendants(selected.id);
  });

  function setSearchKeyword(value) {
    searchKeyword.value = value;
  }

  function getOrganization(organizationId) {
    return organizations.value.find(item => String(item.id) === String(organizationId)) || null;
  }

  function getParent(organizationId) {
    const organization = getOrganization(organizationId);
    return organization ? getOrganization(organization.parentId) : null;
  }

  function getChildren(organizationId) {
    return organizations.value
      .filter(item => item.parentId === organizationId)
      .sort(sortOrganizations);
  }

  function getDescendantIds(organizationId) {
    return getChildren(organizationId).flatMap(child => [ child.id, ...getDescendantIds(child.id) ]);
  }

  function countDescendants(organizationId) {
    const children = getChildren(organizationId);
    return children.length + children.reduce((sum, child) => sum + countDescendants(child.id), 0);
  }

  function selectOrganization(organizationId) {
    const organization = getOrganization(organizationId);
    if (!organization) {
      return;
    }
    selectedOrganizationId.value = organization.id;
  }

  function toggleExpanded(organizationId) {
    const next = new Set(expandedIds.value);
    if (next.has(organizationId)) {
      next.delete(organizationId);
    } else {
      next.add(organizationId);
    }
    expandedIds.value = next;
  }

  function expandAll() {
    expandedIds.value = new Set(organizations.value
      .filter(item => getChildren(item.id).length > 0)
      .map(item => item.id));
  }

  function collapseAll() {
    expandedIds.value = new Set(organizations.value
      .filter(item => item.parentId == null)
      .map(item => item.id));
  }

  function hasOrganizationCode(code, exceptOrganizationId = null) {
    const normalizedCode = normalizeCode(code);
    return organizations.value.some(item => item.code === normalizedCode
      && String(item.id) !== String(exceptOrganizationId));
  }

  function addOrganization(parentId, input) {
    const parent = getOrganization(parentId);
    if (!parent) {
      return null;
    }
    const siblings = getChildren(parent.id);
    const organization = createOrganizationSnapshot({
      id: getNextOrganizationId(organizations.value),
      parentId: parent.id,
      ...normalizeOrganizationInput(input, parent.id),
      sort: siblings.length + 1,
    });
    organizations.value = [ ...organizations.value, organization ];
    expandedIds.value = new Set([ ...expandedIds.value, parent.id ]);
    selectedOrganizationId.value = organization.id;
    searchKeyword.value = '';
    return organization;
  }

  function updateOrganization(organizationId, input) {
    const current = getOrganization(organizationId);
    if (!current) {
      return null;
    }
    let updatedOrganization = null;
    organizations.value = organizations.value.map(item => {
      if (item.id !== current.id) {
        return item;
      }
      updatedOrganization = createOrganizationSnapshot({
        ...item,
        ...normalizeOrganizationInput(input, item.parentId),
        type: item.parentId == null ? 'group' : normalizeType(input.type, item.parentId),
      });
      return updatedOrganization;
    });
    return updatedOrganization;
  }

  function deleteOrganization(organizationId) {
    const organization = getOrganization(organizationId);
    if (!organization) {
      return { ok: false, reason: 'not-found' };
    }
    if (organization.parentId == null) {
      return { ok: false, reason: 'root' };
    }
    if (getChildren(organization.id).length > 0) {
      return { ok: false, reason: 'has-children' };
    }

    organizations.value = organizations.value.filter(item => item.id !== organization.id);
    expandedIds.value = new Set([ ...expandedIds.value ].filter(id => id !== organization.id));
    if (selectedOrganizationId.value === organization.id) {
      selectedOrganizationId.value = organization.parentId;
    }
    return { ok: true, organization };
  }

  function getMovableParents(organizationId) {
    const organization = getOrganization(organizationId);
    if (!organization || organization.parentId == null) {
      return [];
    }

    const blockedIds = new Set([ organization.id, ...getDescendantIds(organization.id) ]);
    return organizations.value
      .filter(item => !blockedIds.has(item.id))
      .sort(sortOrganizations);
  }

  function moveOrganization(organizationId, parentId) {
    const organization = getOrganization(organizationId);
    const parent = getOrganization(parentId);
    if (!organization) {
      return { ok: false, reason: 'not-found' };
    }
    if (organization.parentId == null) {
      return { ok: false, reason: 'root' };
    }
    if (!parent) {
      return { ok: false, reason: 'parent-not-found' };
    }
    if (organization.id === parent.id || getDescendantIds(organization.id).includes(parent.id)) {
      return { ok: false, reason: 'invalid-parent' };
    }
    if (organization.parentId === parent.id) {
      return { ok: true, organization };
    }

    const siblings = getChildren(parent.id).filter(item => item.id !== organization.id);
    let movedOrganization = null;
    organizations.value = organizations.value.map(item => {
      if (item.id !== organization.id) {
        return item;
      }
      movedOrganization = createOrganizationSnapshot({
        ...item,
        parentId: parent.id,
        type: normalizeType(item.type, parent.id),
        sort: siblings.length + 1,
      });
      return movedOrganization;
    });
    expandedIds.value = new Set([ ...expandedIds.value, parent.id ]);
    selectedOrganizationId.value = organization.id;
    return { ok: true, organization: movedOrganization };
  }

  return {
    organizations,
    searchKeyword,
    selectedOrganizationId,
    expandedIds,
    visibleTree,
    selectedOrganization,
    selectedChildren,
    selectedPath,
    selectedDescendantCount,
    organizationStats,
    setSearchKeyword,
    getOrganization,
    getParent,
    getChildren,
    getDescendantIds,
    selectOrganization,
    toggleExpanded,
    expandAll,
    collapseAll,
    hasOrganizationCode,
    addOrganization,
    updateOrganization,
    deleteOrganization,
    getMovableParents,
    moveOrganization,
  };
}
