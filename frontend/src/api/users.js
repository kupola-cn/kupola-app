import { apiClient } from './client.js';
import { INITIAL_USERS } from '../features/users/state.js';
import { USE_HTTP_API } from './runtime.js';
import {
	mutationResponseSchema,
	userListResponseSchema,
	userPayloadSchema,
	userMutationResponseSchema,
	userResponseSchema,
} from './schemas.js';

const mockUsers = INITIAL_USERS.map(user => ({
  ...user,
  username: `user${user.id}`,
  role: user.roleCodes[0],
  permissions: [],
}));

function normalizeApiUser(user) {
  const roleCode = user.role === 'editor' ? 'viewer' : user.role;
  return {
    ...user,
    orgId: user.orgId || 1,
    roleCodes: [ roleCode ],
    status: user.status || 'active',
    phone: user.phone || '',
    address: user.address || '',
  };
}

function toUserPayload(input) {
  const payload = userPayloadSchema.parse({
    ...input,
    email: String(input.email || '').trim().toLowerCase(),
    roleCodes: Array.isArray(input.roleCodes) ? input.roleCodes : [],
    phone: String(input.phone || '').trim(),
    address: String(input.address || '').trim(),
  });
  return {
    ...payload,
    role: payload.roleCodes[0],
  };
}

export async function listUsers() {
  if (!USE_HTTP_API) {
    return mockUsers.map(normalizeApiUser);
  }
  const response = await apiClient.get('/users');
  return userListResponseSchema.parse(response.data).data.map(normalizeApiUser);
}

export async function getUser(userId) {
  if (!USE_HTTP_API) {
    const user = mockUsers.find(item => String(item.id) === String(userId));
    if (!user) {
      throw new Error('用户不存在');
    }
    return normalizeApiUser(user);
  }
  const response = await apiClient.get(`/users/${encodeURIComponent(userId)}`);
  return normalizeApiUser(userResponseSchema.parse(response.data).data);
}

export async function createUser(input) {
  if (!USE_HTTP_API) {
    const payload = toUserPayload(input);
    const id = Math.max(0, ...mockUsers.map(user => Number(user.id) || 0)) + 1;
    const user = {
      ...payload,
      id,
      username: `user${id}`,
      role: payload.roleCodes[0],
      permissions: [],
      createdAt: formatMockDateTime(),
      lastLogin: '-',
    };
    mockUsers.push(user);
    return normalizeApiUser(user);
  }
  const response = await apiClient.post('/users', toUserPayload(input));
  return normalizeApiUser(userMutationResponseSchema.parse(response.data).data);
}

export async function updateUser(userId, input) {
  if (!USE_HTTP_API) {
    const payload = toUserPayload(input);
    const user = mockUsers.find(item => String(item.id) === String(userId));
    if (!user) {
      throw new Error('用户不存在');
    }
    Object.assign(user, payload, { role: payload.roleCodes[0] });
    return { success: true, message: '更新成功' };
  }
  const response = await apiClient.put(`/users/${encodeURIComponent(userId)}`, toUserPayload(input));
  return mutationResponseSchema.parse(response.data);
}

export async function deleteUser(userId) {
  if (!USE_HTTP_API) {
    const index = mockUsers.findIndex(item => String(item.id) === String(userId));
    if (index < 0) {
      throw new Error('用户不存在');
    }
    mockUsers.splice(index, 1);
    return { success: true, message: '删除成功' };
  }
  const response = await apiClient.delete(`/users/${encodeURIComponent(userId)}`);
  return mutationResponseSchema.parse(response.data);
}

function formatMockDateTime(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
