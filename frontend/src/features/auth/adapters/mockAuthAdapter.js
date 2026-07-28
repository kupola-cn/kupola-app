import { getOrganizationName, resolveRoleAccess } from '../access.js';

const TOKEN_KEY = 'kupola-app-token';

const MOCK_USERS = Object.freeze({
  admin: {
    id: 1,
    profileUserId: 1,
    username: 'admin',
    name: '管理员',
    orgId: 1,
    roleCodes: [ 'admin' ],
    attributes: { department: '集团总部', level: 1 },
  },
  operator: {
    id: 2,
    profileUserId: 5,
    username: 'operator',
    name: '运营管理员',
    orgId: 4,
    roleCodes: [ 'operator' ],
    attributes: { department: '华东分公司', level: 2 },
  },
  viewer: {
    id: 3,
    profileUserId: 3,
    username: 'viewer',
    name: '只读成员',
    orgId: 5,
    roleCodes: [ 'viewer' ],
    attributes: { department: '华东销售部', level: 3 },
  },
  auditor: {
    id: 4,
    profileUserId: 2,
    username: 'auditor',
    name: '审计员',
    orgId: 3,
    roleCodes: [ 'auditor' ],
    attributes: { department: '财务中心', level: 2 },
  },
});

const MOCK_PASSWORDS = new Map(Object.keys(MOCK_USERS).map(username => [ username, username === 'admin' ? 'newpass123' : '123456' ]));

function createSessionUser(account) {
  const access = resolveRoleAccess(account.roleCodes);
  return {
    ...account,
    role: access.role,
    roles: access.roles,
    roleNames: access.roleNames,
    permissions: access.permissions,
    dataScopes: access.dataScopes,
    orgName: getOrganizationName(account.orgId),
    attributes: {
      ...account.attributes,
      orgId: account.orgId,
      orgName: getOrganizationName(account.orgId),
      roles: access.roles,
    },
  };
}

function readUserFromToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  const username = /^mock-session:([\w-]+):/.exec(token || '')?.[1];
  const account = username ? MOCK_USERS[username] || null : null;
  return account ? createSessionUser(account) : null;
}

export const mockAuthAdapter = Object.freeze({
  async login({ username, password }) {
    const account = MOCK_USERS[username];
    if (!account || password !== MOCK_PASSWORDS.get(username)) {
      throw new Error('用户名或密码错误');
    }
    localStorage.setItem(TOKEN_KEY, `mock-session:${username}:${Date.now()}`);
    return { user: createSessionUser(account) };
  },

  async restore() {
    const user = readUserFromToken();
    return user ? { user } : null;
  },

  async logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async changePassword({ username, currentPassword, newPassword }) {
    if (!MOCK_USERS[username] || currentPassword !== MOCK_PASSWORDS.get(username)) {
      throw new Error('当前密码不正确。');
    }
    if (String(newPassword || '').length < 8) {
      throw new Error('新密码至少需要 8 位。');
    }
    MOCK_PASSWORDS.set(username, String(newPassword));
    return { ok: true };
  },
});
