import { computed, signal } from '@kupola/platform';
import {
  filterRecordsByDataScope,
  getRoleNames,
  getOrganizationName,
} from '../auth/access.js';

export const USER_STATUS_OPTIONS = Object.freeze([
  { label: '启用', value: 'active', tone: 'success' },
  { label: '停用', value: 'inactive', tone: 'warning' },
  { label: '锁定', value: 'locked', tone: 'error' },
]);

const VALID_USER_STATUSES = new Set(USER_STATUS_OPTIONS.map(option => option.value));

export const INITIAL_USERS = Object.freeze([
  {
    id: 1,
    orgId: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    roleCodes: [ 'admin' ],
    status: 'active',
    phone: '13800138000',
    address: '北京市朝阳区望京街道 88 号',
    createdAt: '2024-01-01 10:00:00',
    lastLogin: '2026-07-25 09:30:00',
  },
  {
    id: 2,
    orgId: 3,
    name: '李四',
    email: 'lisi@example.com',
    roleCodes: [ 'auditor' ],
    status: 'active',
    phone: '13900139000',
    address: '上海市徐汇区漕溪北路 66 号',
    createdAt: '2024-03-12 15:20:00',
    lastLogin: '2026-07-24 18:05:00',
  },
  {
    id: 3,
    orgId: 5,
    name: '王五',
    email: 'wangwu@example.com',
    roleCodes: [ 'viewer' ],
    status: 'inactive',
    phone: '13700137000',
    address: '杭州市西湖区文三路 18 号',
    createdAt: '2024-05-20 09:10:00',
    lastLogin: '2026-06-30 11:12:00',
  },
  {
    id: 4,
    orgId: 8,
    name: '赵六',
    email: 'zhaoliu@example.com',
    roleCodes: [ 'viewer' ],
    status: 'active',
    phone: '13600136000',
    address: '深圳市南山区科技园 12 号',
    createdAt: '2025-01-08 13:45:00',
    lastLogin: '2026-07-26 08:40:00',
  },
  {
    id: 5,
    orgId: 6,
    name: '钱七',
    email: 'qianqi@example.com',
    roleCodes: [ 'operator' ],
    status: 'active',
    phone: '13500135000',
    address: '成都市高新区天府大道 28 号',
    createdAt: '2025-09-16 17:30:00',
    lastLogin: '2026-07-22 16:15:00',
  },
  {
    id: 6,
    orgId: 2,
    name: '孙八',
    email: 'sunba@example.com',
    roleCodes: [ 'viewer' ],
    status: 'locked',
    phone: '13400134000',
    address: '上海市浦东新区世纪大道 100 号 12F',
    createdAt: '2025-11-02 10:18:00',
    lastLogin: '2026-07-10 12:20:00',
  },
  {
    id: 7,
    orgId: 7,
    name: '周九',
    email: 'zhoujiu@example.com',
    roleCodes: [ 'operator' ],
    status: 'active',
    phone: '13300133000',
    address: '深圳市南山区科技园 12 号',
    createdAt: '2026-01-18 09:28:00',
    lastLogin: '2026-07-27 10:02:00',
  },
  {
    id: 8,
    orgId: 8,
    name: '吴十',
    email: 'wushi@example.com',
    roleCodes: [ 'viewer' ],
    status: 'inactive',
    phone: '13200132000',
    address: '深圳市南山区科技园 12 号 4F',
    createdAt: '2026-02-07 11:36:00',
    lastLogin: '2026-07-05 09:16:00',
  },
  {
    id: 9,
    orgId: 1,
    name: '郑一',
    email: 'zhengyi@example.com',
    roleCodes: [ 'admin' ],
    status: 'active',
    phone: '13100131000',
    address: '上海市浦东新区世纪大道 100 号',
    createdAt: '2026-03-22 14:08:00',
    lastLogin: '2026-07-26 21:44:00',
  },
  {
    id: 10,
    orgId: 3,
    name: '冯二',
    email: 'feng-er@example.com',
    roleCodes: [ 'auditor' ],
    status: 'active',
    phone: '13000130000',
    address: '上海市浦东新区世纪大道 100 号 10F',
    createdAt: '2026-05-06 08:52:00',
    lastLogin: '2026-07-23 13:35:00',
  },
  {
    id: 11,
    orgId: 2,
    name: '陈三',
    email: 'chensan@example.com',
    roleCodes: [ 'viewer' ],
    status: 'active',
    phone: '12900129000',
    address: '上海市浦东新区世纪大道 100 号 12F',
    createdAt: '2026-06-11 16:40:00',
    lastLogin: '2026-07-21 15:28:00',
  },
  {
    id: 12,
    orgId: 7,
    name: '褚四',
    email: 'chusi@example.com',
    roleCodes: [ 'operator' ],
    status: 'locked',
    phone: '12800128000',
    address: '深圳市南山区科技园 12 号',
    createdAt: '2026-07-01 18:04:00',
    lastLogin: '2026-07-18 19:12:00',
  },
]);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeKeyword(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeStatus(value) {
  return VALID_USER_STATUSES.has(value) ? value : 'active';
}

function getNextUserId(users) {
  return Math.max(0, ...users.map(user => user.id)) + 1;
}

function formatDateTime(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + ' ' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join(':');
}

function normalizeUserInput(userInput) {
  const roleCodes = Array.isArray(userInput.roleCodes)
    ? userInput.roleCodes
    : [ userInput.role || userInput.roleCodes ];
  return {
    name: String(userInput.name || '').trim(),
    email: normalizeEmail(userInput.email),
    roleCodes: [ ...new Set(roleCodes.map(code => String(code || '').trim()).filter(Boolean)) ],
    status: normalizeStatus(userInput.status),
    phone: String(userInput.phone || '').trim(),
    address: String(userInput.address || '').trim(),
    orgId: Number(userInput.orgId) || null,
  };
}

function createUserSnapshot(user) {
  const orgId = Number(user.orgId) || null;
  const roleCodes = Array.isArray(user.roleCodes) && user.roleCodes.length > 0
    ? user.roleCodes
    : [ user.role ].filter(Boolean);
  const roleNames = getRoleNames(roleCodes);
  return {
    phone: '',
    address: '',
    createdAt: formatDateTime(),
    lastLogin: '-',
    ...user,
    orgId,
    orgName: getOrganizationName(orgId),
    roleCodes,
    roleNames,
    role: roleNames.join('、') || '-',
    status: normalizeStatus(user.status),
    email: normalizeEmail(user.email),
  };
}

function matchesKeyword(user, keyword) {
  if (!keyword) {
    return true;
  }
  return user.name.toLowerCase().includes(keyword)
    || user.email.toLowerCase().includes(keyword)
    || user.role.toLowerCase().includes(keyword)
    || user.orgName.toLowerCase().includes(keyword)
    || user.roleCodes.some(code => code.toLowerCase().includes(keyword));
}

function normalizeStateOptions(input) {
  if (Array.isArray(input)) {
    return { initialUsers: input, currentUser: null };
  }
  return {
    initialUsers: input?.initialUsers || INITIAL_USERS,
    currentUser: input?.currentUser || null,
  };
}

export function createListState(options = {}) {
  const { initialUsers, currentUser } = normalizeStateOptions(options);
  const users = signal(initialUsers.map(createUserSnapshot));
  const searchKeyword = signal('');
  const organizationFilter = signal('');
  const roleFilter = signal('');
  const statusFilter = signal('active');
  const visibleUsers = computed(() => filterRecordsByDataScope(users.value, currentUser));
  const filteredUsers = computed(() => {
    const availableUsers = visibleUsers.value;
    const keyword = normalizeKeyword(searchKeyword.value);
    const organizationId = Number(organizationFilter.value);
    const roleCode = String(roleFilter.value || '').trim();
    const status = String(statusFilter.value || '').trim();

    return availableUsers.filter(user => matchesKeyword(user, keyword)
      && (!organizationId || user.orgId === organizationId)
      && (!roleCode || user.roleCodes.includes(roleCode))
      && (!status || user.status === status));
  });

  function setSearchKeyword(value) {
    searchKeyword.value = value;
  }

  function setOrganizationFilter(value) {
    organizationFilter.value = value ? String(value) : '';
  }

  function setRoleFilter(value) {
    roleFilter.value = value ? String(value) : '';
  }

  function setStatusFilter(value) {
    statusFilter.value = value ? String(value) : '';
  }

  function replaceUsers(nextUsers) {
    users.value = (Array.isArray(nextUsers) ? nextUsers : []).map(createUserSnapshot);
  }

  function resetFilters() {
    searchKeyword.value = '';
    organizationFilter.value = '';
    roleFilter.value = '';
    statusFilter.value = 'active';
  }

  function getUser(userId) {
    return visibleUsers.value.find(user => String(user.id) === String(userId)) || null;
  }

  function getRawUser(userId) {
    return users.value.find(user => String(user.id) === String(userId)) || null;
  }

  function hasEmail(email, exceptUserId = null) {
    const normalizedEmail = normalizeEmail(email);
    return users.value.some(user => normalizeEmail(user.email) === normalizedEmail
      && String(user.id) !== String(exceptUserId));
  }

  function addUser(userInput) {
    const user = createUserSnapshot({
      ...userInput,
      ...normalizeUserInput(userInput),
      id: Number(userInput.id) || getNextUserId(users.value),
      createdAt: userInput.createdAt || formatDateTime(),
      lastLogin: userInput.lastLogin || '-',
    });
    users.value = [ ...users.value, user ];
    searchKeyword.value = '';
    return user;
  }

  function updateUser(userId, userInput) {
    let updatedUser = null;
    users.value = users.value.map(user => {
      if (String(user.id) !== String(userId)) {
        return user;
      }
      updatedUser = createUserSnapshot({
        ...user,
        ...normalizeUserInput(userInput),
        orgId: userInput.orgId || user.orgId,
      });
      return updatedUser;
    });
    return updatedUser;
  }

  function deleteUser(userId) {
    const exists = users.value.some(user => String(user.id) === String(userId));
    if (!exists) {
      return false;
    }
    users.value = users.value.filter(user => String(user.id) !== String(userId));
    return true;
  }

  function updateUserStatus(userId, status) {
    const normalizedStatus = normalizeStatus(status);
    let updatedUser = null;
    users.value = users.value.map(user => {
      if (String(user.id) !== String(userId)) {
        return user;
      }
      updatedUser = createUserSnapshot({ ...user, status: normalizedStatus });
      return updatedUser;
    });
    return updatedUser;
  }

  function updateUsersStatus(userIds, status) {
    const ids = new Set((userIds || []).map(id => String(id)));
    if (ids.size === 0) {
      return 0;
    }
    const normalizedStatus = normalizeStatus(status);
    let count = 0;
    users.value = users.value.map(user => {
      if (!ids.has(String(user.id))) {
        return user;
      }
      count += 1;
      return createUserSnapshot({ ...user, status: normalizedStatus });
    });
    return count;
  }

  function assignRoleToUsers(userIds, roleCode) {
    const ids = new Set((userIds || []).map(id => String(id)));
    const code = String(roleCode || '').trim();
    if (ids.size === 0 || !code) {
      return 0;
    }
    let count = 0;
    users.value = users.value.map(user => {
      if (!ids.has(String(user.id))) {
        return user;
      }
      count += 1;
      return createUserSnapshot({ ...user, roleCodes: [ code ] });
    });
    return count;
  }

  function deleteUsers(userIds) {
    const ids = new Set((userIds || []).map(id => String(id)));
    if (ids.size === 0) {
      return 0;
    }
    const before = users.value.length;
    users.value = users.value.filter(user => !ids.has(String(user.id)));
    return before - users.value.length;
  }

  function getUsersByOrganization(organizationId) {
    const id = Number(organizationId);
    return visibleUsers.value.filter(user => user.orgId === id);
  }

  function resetUserPassword(userId) {
    const user = getUser(userId);
    if (!user) {
      return null;
    }
    return {
      user,
      password: 'Kupola@2026',
      resetAt: formatDateTime(),
    };
  }

  return {
    users,
    visibleUsers,
    searchKeyword,
    organizationFilter,
    roleFilter,
    statusFilter,
    filteredUsers,
    setSearchKeyword,
    setOrganizationFilter,
    setRoleFilter,
    setStatusFilter,
    replaceUsers,
    resetFilters,
    getUser,
    getRawUser,
    hasEmail,
    addUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    updateUsersStatus,
    assignRoleToUsers,
    deleteUsers,
    getUsersByOrganization,
    resetUserPassword,
  };
}
