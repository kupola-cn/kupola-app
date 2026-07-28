import { lazyComponent } from '@kupola/platform';

const LoginPage = lazyComponent(() => import('../features/auth/pages/LoginPage.js'), 'LoginPage');
const DashboardPage = lazyComponent(() => import('../features/dashboard/pages/DashboardPage.js'), 'DashboardPage');
const UserListPage = lazyComponent(() => import('../features/users/pages/list.js'));
const UserDetailPage = lazyComponent(() => import('../features/users/pages/detail.js'));
const PermissionListPage = lazyComponent(() => import('../features/permissions/pages/list.js'));
const OrganizationListPage = lazyComponent(() => import('../features/organizations/pages/list.js'));
const AuditLogPage = lazyComponent(() => import('../features/audit/pages/list.js'));
const LoginLogPage = lazyComponent(() => import('../features/audit/pages/login.js'));
const SettingsPage = lazyComponent(() => import('../features/settings/pages/list.js'));
const NotificationListPage = lazyComponent(() => import('../features/notifications/pages/list.js'));
const NotFoundPage = lazyComponent(() => import('../features/status/pages/NotFoundPage.js'), 'NotFoundPage');
const ForbiddenPage = lazyComponent(() => import('../features/status/pages/ForbiddenPage.js'), 'ForbiddenPage');

export default [
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/', name: 'dashboard', component: DashboardPage, meta: { requiresAuth: true, title: '仪表盘', icon: 'dashboard' } },
  { path: '/users', name: 'user-list', component: UserListPage, meta: { requiresAuth: true, permission: 'user:list', title: '用户管理', icon: 'user' } },
  { path: '/users/:id', name: 'user-detail', component: UserDetailPage, meta: { requiresAuth: true, permission: 'user:view', title: '用户详情', icon: 'user-circle' } },
  { path: '/organizations', name: 'organization-list', component: OrganizationListPage, meta: { requiresAuth: true, permission: 'organization:list', title: '机构管理', icon: 'users' } },
  { path: '/permissions', name: 'permission-list', component: PermissionListPage, meta: { requiresAuth: true, permission: 'permission:list', title: '权限管理', icon: 'shield' } },
  { path: '/audit', name: 'audit-log', component: AuditLogPage, meta: { requiresAuth: true, permission: 'audit:list', title: '操作日志', icon: 'file-text' } },
  { path: '/audit/login', name: 'audit-login-log', component: LoginLogPage, meta: { requiresAuth: true, permission: 'audit:list', title: '登录日志', icon: 'key' } },
  { path: '/settings', name: 'settings', component: SettingsPage, meta: { requiresAuth: true, permission: 'settings:list', title: '系统设置', icon: 'settings' } },
  { path: '/notifications', name: 'notifications', component: NotificationListPage, meta: { requiresAuth: true, title: '通知消息', icon: 'bell' } },
  { path: '/403', name: 'forbidden', component: ForbiddenPage },
  { path: '*', name: 'not-found', component: NotFoundPage },
];
