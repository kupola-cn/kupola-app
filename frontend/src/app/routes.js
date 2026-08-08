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

export const protectedRoutes = [
  {
    path: '',
    name: 'dashboard',
    component: DashboardPage,
    meta: { title: '仪表盘', headerTitle: '仪表盘概览', icon: 'dashboard', nav: 'sidebar', navDividerAfter: true },
  },
  {
    path: 'users',
    name: 'user-list',
    component: UserListPage,
    meta: { permission: 'user:list', title: '用户管理', headerTitle: '管理后台', icon: 'user', nav: 'sidebar' },
  },
  { path: 'users/:id', name: 'user-detail', component: UserDetailPage, meta: { permission: 'user:view', title: '用户详情', icon: 'user-circle' } },
  {
    path: 'organizations',
    name: 'organization-list',
    component: OrganizationListPage,
    meta: { permission: 'organization:list', title: '机构管理', headerTitle: '组织架构', icon: 'users', nav: 'sidebar' },
  },
  {
    path: 'permissions',
    name: 'permission-list',
    component: PermissionListPage,
    meta: { permission: 'permission:list', title: '权限管理', headerTitle: '权限配置', icon: 'shield', nav: 'sidebar' },
  },
  {
    path: 'audit',
    name: 'audit-log',
    component: AuditLogPage,
    meta: { permission: 'audit:list', title: '操作日志', headerTitle: '审计日志', icon: 'file-text', nav: 'sidebar' },
  },
  {
    path: 'audit/login',
    name: 'audit-login-log',
    component: LoginLogPage,
    meta: { permission: 'audit:list', title: '登录日志', headerTitle: '登录审计', icon: 'key', nav: 'sidebar' },
  },
  {
    path: 'settings',
    name: 'settings',
    component: SettingsPage,
    meta: { permission: 'settings:list', title: '系统设置', headerTitle: '系统设置', icon: 'settings', nav: 'sidebar' },
  },
  {
    path: 'notifications',
    name: 'notifications',
    component: NotificationListPage,
    meta: { title: '通知消息', headerTitle: '通知消息', icon: 'bell', nav: 'sidebar' },
  },
  { path: '403', name: 'forbidden', component: ForbiddenPage },
  { path: '*', name: 'not-found', component: NotFoundPage },
];

export default [
  { path: '/login', name: 'login', component: LoginPage },
  {
    path: '/',
    name: 'app-shell',
    component: lazyComponent(() => import('./shell/AppShell.js'), 'AppShell'),
    meta: { requiresAuth: true },
    children: protectedRoutes,
  },
];
