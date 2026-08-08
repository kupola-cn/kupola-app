import { hasPermission } from '../features/auth/access.js';
import { protectedRoutes } from './routes.js';

function toFullRoutePath(routePath) {
  const path = String(routePath || '').trim();
  return path ? `/${path}` : '/';
}

function toNavigationItem(route) {
  const meta = route.meta || {};
  return Object.freeze({
    path: toFullRoutePath(route.path),
    title: meta.title || route.name,
    headerTitle: meta.headerTitle || meta.title || route.name,
    icon: meta.icon,
    permission: meta.permission,
    navDividerAfter: Boolean(meta.navDividerAfter),
  });
}

function getSidebarNavigationItems() {
  const items = [];
  for (const route of protectedRoutes) {
    if (route.meta?.nav !== 'sidebar') {
      continue;
    }

    const item = toNavigationItem(route);
    items.push(item);
    if (item.navDividerAfter) {
      items.push(Object.freeze({ type: 'divider' }));
    }
  }
  return items;
}

function pruneDividers(items) {
  return items.filter((item, index, currentItems) => {
    if (item.type !== 'divider') {
      return true;
    }
    const hasVisibleBefore = currentItems.slice(0, index).some(previous => previous.type !== 'divider');
    const hasVisibleAfter = currentItems.slice(index + 1).some(next => next.type !== 'divider');
    return hasVisibleBefore && hasVisibleAfter;
  });
}

export function getVisibleNavigationItems(authContext) {
  return pruneDividers(getSidebarNavigationItems().filter(item => item.type === 'divider'
    || hasPermission(authContext, item.permission)));
}

export function findNavigationItem(path, items = getSidebarNavigationItems()) {
  const currentPath = String(path || '/');
  return items.find(item => item.path === currentPath)
    || items.find(item => item.path !== '/' && currentPath.startsWith(`${item.path}/`))
    || getSidebarNavigationItems()[0];
}
