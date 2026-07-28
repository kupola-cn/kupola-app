import { defineComponent, signal } from '@kupola/platform';
import { useAuth } from '@kupola/auth';
import { useRouter } from '@kupola/router';
import { useOverlay } from '@kupola/components/overlay';
import { accountView } from '../../features/auth/views/AccountView.js';
import { findNavigationItem, getVisibleNavigationItems } from '../navigation.js';
import { appShellView, sidebarMenuView } from './AppShellView.js';
import { useThemeControls } from './useThemeControls.js';

/**
 * 定义的是 AppShell 组件，用于渲染应用的主布局
 * 路由切换时只替换 k-router-view（路由出口 line:68） 的内容，顶部、侧栏和底部不会重复创建。
 */
export const AppShell = defineComponent({
  setup({ lifecycle }) {
    /**
     * useRouter()和useAuth() 从插件上下文取得路由、认证服务，不再需要 props 传递。
     */
    const router = useRouter();
    const auth = useAuth();
    const overlayService = useOverlay();
    if (!router) {
      throw new Error('AppShell requires createRouterPlugin(router).');
    }

    /**
     * currentPath 是本布局唯一的本地响应式状态，初始值来自当前路由。
     */
    const currentPath = signal(router.currentRoute?.path || '/');
    const authContext = signal(auth.getContext?.() || null);
    const themeControls = useThemeControls();

    const navigate = path => router.push(path);
    const handleLogout = async () => {
      // Navigate while the current auth context is still valid; the auth guard
      // will not start a competing redirect when the session is cleared.
      await router.replace('/login');
      await auth.logout();
    };

    const handleProfileClick = () => {
      const user = authContext.value?.user;
      if (!user) {
        return;
      }
      let overlay = null;
      overlay = overlayService.openModal(
        { title: '当前用户资料', width: '560px' },
        accountView({
          user,
          auth,
          onClose: () => overlay?.close(),
        }),
      );
    };

    /**
     * router.afterEach返回取消订阅函数；交给onCleanup后，布局销毁时会自动取消监听。
     */
    lifecycle.onCleanup(router.afterEach(to => {
      currentPath.value = to.path;
    }));
    lifecycle.onCleanup(auth.onChange?.(context => {
      authContext.value = context;
    }));
    /**
     * 主题控制器的品牌色选择器也会自动销毁，避免残留弹层或事件监听。
     */
    lifecycle.onCleanup(() => themeControls.destroy());
    
    const getAuthContext = () => authContext.value;
    const getNavigationItems = () => getVisibleNavigationItems(getAuthContext());
    const renderMenu = () => sidebarMenuView({
      items: getNavigationItems(),
      currentPath,
      onNavigate: navigate,
    });
    
    // 渲染顶部标题
    // 用来根据当前路由路径动态更新顶部标题
    const headerTitle = () => findNavigationItem(currentPath.value, getNavigationItems()).headerTitle;
    const userName = () => getAuthContext()?.user?.name || '未登录';

    return appShellView({
      headerTitle,
      userName,
      onProfileClick: handleProfileClick,
      onNotificationsClick: () => navigate('/notifications'),
      sidebarMenu: renderMenu,
      themeIcon: themeControls.themeIcon,
      onBrandColorClick: themeControls.handleBrandColorClick,
      onThemeToggle: themeControls.handleThemeToggle,
      onLogout: handleLogout,
    });
  },
});
