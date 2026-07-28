import { z } from 'zod';

const idSchema = z.coerce.number().int().positive();

export const apiUserSchema = z.object({
  id: idSchema,
  username: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  permissions: z.array(z.string()).default([]),
  orgId: idSchema.optional(),
  status: z.enum([ 'active', 'inactive', 'locked' ]).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  createdAt: z.string().optional(),
  lastLogin: z.string().optional(),
});

export const loginResponseSchema = z.object({
  success: z.literal(true),
  token: z.string().min(1),
  user: apiUserSchema,
});

export const currentUserResponseSchema = apiUserSchema;

export const userListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(apiUserSchema),
});

export const userResponseSchema = z.object({
  success: z.literal(true),
  data: apiUserSchema,
});

export const mutationResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});

export const userMutationResponseSchema = mutationResponseSchema.extend({
  data: apiUserSchema,
});

export const userPayloadSchema = z.object({
  name: z.string().trim().min(1, '姓名不能为空。'),
  email: z.string().trim().email('邮箱格式不正确。'),
  orgId: z.coerce.number().int().positive('所属机构不能为空。'),
  roleCodes: z.array(z.string().trim().min(1)).min(1, '请至少选择一个角色。'),
  status: z.enum([ 'active', 'inactive', 'locked' ]),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});
