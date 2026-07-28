import { INITIAL_ORGANIZATIONS } from '../organizations/state.js';
import { INITIAL_ROLES } from '../permissions/state.js';

const ROLE_BY_CODE = new Map(INITIAL_ROLES.map(role => [ role.code, role ]));
const ORGANIZATION_BY_ID = new Map(INITIAL_ORGANIZATIONS.map(organization => [ organization.id, organization ]));

function normalizeRoleCodes(roleCodes) {
  return [ ...new Set(Array.isArray(roleCodes) ? roleCodes : [ roleCodes ]) ]
    .map(code => String(code || '').trim())
    .filter(Boolean);
}

function normalizeId(value) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function getOrganizationChildren(organizationId, organizations = INITIAL_ORGANIZATIONS) {
  return organizations.filter(organization => organization.parentId === organizationId);
}

export function getOrganization(organizationId) {
  return ORGANIZATION_BY_ID.get(normalizeId(organizationId)) || null;
}

export function getOrganizationName(organizationId) {
  return getOrganization(organizationId)?.name || '-';
}

export function getActiveRoles() {
  return [ ...ROLE_BY_CODE.values() ].filter(role => role.status !== 'inactive');
}

export function getRole(roleCode) {
  return ROLE_BY_CODE.get(String(roleCode || '').trim()) || null;
}

export function getRoleName(roleCode) {
  return getRole(roleCode)?.name || String(roleCode || '').trim() || '-';
}

export function getRoleNames(roleCodes) {
  const codes = normalizeRoleCodes(roleCodes);
  return codes.length > 0 ? codes.map(getRoleName) : [];
}

export function getDescendantOrganizationIds(organizationId, organizations = INITIAL_ORGANIZATIONS) {
  const rootId = normalizeId(organizationId);
  if (!rootId) {
    return [];
  }

  const ids = [];
  function walk(parentId) {
    for (const child of getOrganizationChildren(parentId, organizations)) {
      ids.push(child.id);
      walk(child.id);
    }
  }

  walk(rootId);
  return ids;
}

export function getOrganizationAndDescendantIds(organizationId, organizations = INITIAL_ORGANIZATIONS) {
  const rootId = normalizeId(organizationId);
  return rootId ? [ rootId, ...getDescendantOrganizationIds(rootId, organizations) ] : [];
}

export function resolveRoleAccess(roleCodes) {
  const codes = normalizeRoleCodes(roleCodes);
  const roles = codes
    .map(code => ROLE_BY_CODE.get(code))
    .filter(role => role && role.status !== 'inactive');

  const permissions = [ ...new Set(roles.flatMap(role => role.permissions || [])) ];
  const dataScopes = roles.map(role => role.dataScope).filter(Boolean);

  return {
    role: codes[0] || '',
    roles: codes,
    roleNames: roles.map(role => role.name),
    permissions,
    dataScopes,
  };
}

export function hasPermission(authContext, permission) {
  if (!permission) {
    return true;
  }
  return Boolean(authContext?.hasPermission?.(permission)
    || authContext?.user?.permissions?.includes(permission));
}

export function hasAnyPermission(authContext, permissions) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return true;
  }
  return permissions.some(permission => hasPermission(authContext, permission));
}

function canScopeAccessOrganization(scope, currentUser, targetOrganizationId) {
  const targetId = normalizeId(targetOrganizationId);
  if (!scope || !targetId) {
    return false;
  }

  if (scope.type === 'all') {
    return true;
  }

  if (scope.type === 'currentOrg') {
    return targetId === normalizeId(currentUser?.orgId);
  }

  if (scope.type === 'currentAndChildren') {
    return getOrganizationAndDescendantIds(currentUser?.orgId).includes(targetId);
  }

  if (scope.type === 'customOrgs') {
    const accessibleIds = new Set((scope.organizationIds || [])
      .flatMap(organizationId => getOrganizationAndDescendantIds(organizationId)));
    return accessibleIds.has(targetId);
  }

  return false;
}

export function canAccessRecord(currentUser, record) {
  if (!currentUser || !record) {
    return false;
  }

  const scopes = Array.isArray(currentUser.dataScopes) ? currentUser.dataScopes : [];
  if (scopes.some(scope => scope.type === 'self')
    && String(record.id) === String(currentUser.profileUserId || currentUser.id)) {
    return true;
  }

  return scopes.some(scope => canScopeAccessOrganization(scope, currentUser, record.orgId));
}

export function filterRecordsByDataScope(records, currentUser) {
  if (!currentUser) {
    return [];
  }
  return records.filter(record => canAccessRecord(currentUser, record));
}
