import { hasPermission } from '../features/auth/access.js';

export const SIDEBAR_NAVIGATION = Object.freeze([
  { path: '/', title: '首页', headerTitle: '仪表盘概览', icon: 'dashboard' },
  { type: 'divider' },
  { path: '/users', title: '用户管理', headerTitle: '管理后台', icon: 'user', permission: 'user:list' },
  { path: '/organizations', title: '机构管理', headerTitle: '组织架构', icon: 'users', permission: 'organization:list' },
  { path: '/permissions', title: '权限管理', headerTitle: '权限配置', icon: 'shield', permission: 'permission:list' },
  { path: '/audit', title: '操作日志', headerTitle: '审计日志', icon: 'file-text', permission: 'audit:list' },
  { path: '/audit/login', title: '登录日志', headerTitle: '登录审计', icon: 'key', permission: 'audit:list' },
  { path: '/settings', title: '系统设置', headerTitle: '系统设置', icon: 'settings', permission: 'settings:list' },
  { path: '/notifications', title: '通知消息', headerTitle: '通知消息', icon: 'bell' },
]);

export function getVisibleNavigationItems(authContext) {
  const visibleItems = SIDEBAR_NAVIGATION.filter(item => item.type === 'divider'
    || hasPermission(authContext, item.permission));

  return visibleItems.filter((item, index, items) => {
    if (item.type !== 'divider') {
      return true;
    }
    const hasVisibleBefore = items.slice(0, index).some(previous => previous.type !== 'divider');
    const hasVisibleAfter = items.slice(index + 1).some(next => next.type !== 'divider');
    return hasVisibleBefore && hasVisibleAfter;
  });
}

export function findNavigationItem(path, items = SIDEBAR_NAVIGATION) {
  return items.find(item => item.path === path)
    || items.find(item => item.path !== '/' && path.startsWith(`${item.path}/`))
    || SIDEBAR_NAVIGATION[0];
}
