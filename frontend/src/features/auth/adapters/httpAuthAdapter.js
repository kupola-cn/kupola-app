import { getOrganizationName, resolveRoleAccess } from '../access.js';
import { clearToken, getToken, setToken } from '../../../api/client.js';
import {
  changePasswordRequest,
  getCurrentUserRequest,
  loginRequest,
} from '../../../api/auth.js';

const BACKEND_ROLE_MAP = Object.freeze({
  editor: 'viewer',
});

function createSessionUser(apiUser) {
  const roleCode = BACKEND_ROLE_MAP[apiUser.role] || apiUser.role;
  const access = resolveRoleAccess([ roleCode ]);
  const permissions = apiUser.permissions.length > 0 ? apiUser.permissions : access.permissions;
  const dataScopes = access.dataScopes.length > 0
    ? access.dataScopes
    : [ { type: 'self', organizationIds: [] } ];
  const orgId = Number(apiUser.orgId) || 1;

  return {
    ...apiUser,
    profileUserId: apiUser.id,
    orgId,
    role: roleCode,
    roleCodes: [ roleCode ],
    roles: [ roleCode ],
    roleNames: access.roleNames,
    permissions,
    dataScopes,
    orgName: getOrganizationName(orgId),
    attributes: {
      ...(apiUser.attributes || {}),
      orgId,
      orgName: getOrganizationName(orgId),
      roles: [ roleCode ],
    },
  };
}

export const httpAuthAdapter = Object.freeze({
  async login(credentials) {
    const response = await loginRequest(credentials);
    setToken(response.token);
    return { user: createSessionUser(response.user) };
  },

  async restore() {
    if (!getToken()) {
      return null;
    }
    const user = await getCurrentUserRequest();
    return { user: createSessionUser(user) };
  },

  async logout() {
    clearToken();
  },

  async changePassword({ currentPassword, newPassword }) {
    return changePasswordRequest({ currentPassword, newPassword });
  },
});
