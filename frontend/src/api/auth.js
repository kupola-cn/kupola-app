import { apiClient } from './client.js';
import {
  currentUserResponseSchema,
  loginResponseSchema,
  mutationResponseSchema,
} from './schemas.js';

export async function loginRequest(credentials) {
  const response = await apiClient.post('/auth/login', credentials);
  return loginResponseSchema.parse(response.data);
}

export async function getCurrentUserRequest() {
  const response = await apiClient.get('/auth/me');
  return currentUserResponseSchema.parse(response.data);
}

export async function changePasswordRequest(credentials) {
  const response = await apiClient.post('/auth/change-password', credentials);
  return mutationResponseSchema.parse(response.data);
}
