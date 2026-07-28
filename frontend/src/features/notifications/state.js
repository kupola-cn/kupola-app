import { computed, signal } from '@kupola/platform';

export const INITIAL_NOTIFICATIONS = Object.freeze([
  {
    id: 1,
    title: '欢迎使用 Kupola 管理后台',
    content: '当前账号已完成登录，系统会在这里展示配置变更和安全提醒。',
    category: 'system',
    categoryLabel: '系统通知',
    priority: 'normal',
    read: false,
    createdAt: '2026-07-28 09:05:12',
  },
  {
    id: 2,
    title: '检测到一次失败登录',
    content: '账号 auditor 在上海使用 Safari 登录失败，请确认是否为本人操作。',
    category: 'security',
    categoryLabel: '安全提醒',
    priority: 'high',
    read: false,
    createdAt: '2026-07-27 22:18:10',
  },
  {
    id: 3,
    title: '运营管理员角色权限已更新',
    content: '角色配置已保存，新增了用户删除权限和华东分公司数据范围。',
    category: 'audit',
    categoryLabel: '审计提醒',
    priority: 'normal',
    read: false,
    createdAt: '2026-07-27 16:43:28',
  },
  {
    id: 4,
    title: '机构停用影响待确认',
    content: '华南运营部当前仍有 2 个下级部门和 6 名成员，停用前请确认影响范围。',
    category: 'organization',
    categoryLabel: '组织提醒',
    priority: 'normal',
    read: true,
    createdAt: '2026-07-26 11:52:24',
  },
  {
    id: 5,
    title: '用户导入模板已更新',
    content: '用户导入模板新增了数据范围字段，后续导入请使用最新模板。',
    category: 'system',
    categoryLabel: '系统通知',
    priority: 'normal',
    read: true,
    createdAt: '2026-07-25 14:20:06',
  },
  {
    id: 6,
    title: '本周审计摘要已生成',
    content: '本周共记录 42 条后台操作，其中 2 条操作需要进一步复核。',
    category: 'audit',
    categoryLabel: '审计提醒',
    priority: 'normal',
    read: true,
    createdAt: '2026-07-24 18:03:41',
  },
]);

function normalizeKeyword(value) {
  return String(value || '').trim().toLowerCase();
}

export function createNotificationState(initialNotifications = INITIAL_NOTIFICATIONS) {
  const notifications = signal(initialNotifications.map(item => ({ ...item })));
  const activeTab = signal('all');
  const keyword = signal('');

  const filteredNotifications = computed(() => {
    const normalizedKeyword = normalizeKeyword(keyword.value);
    return notifications.value
      .filter(item => (activeTab.value !== 'unread' || !item.read)
        && (!normalizedKeyword
          || item.title.toLowerCase().includes(normalizedKeyword)
          || item.content.toLowerCase().includes(normalizedKeyword)
          || item.categoryLabel.toLowerCase().includes(normalizedKeyword)))
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  });

  const stats = computed(() => ({
    total: notifications.value.length,
    unread: notifications.value.filter(item => !item.read).length,
    high: notifications.value.filter(item => item.priority === 'high' && !item.read).length,
  }));

  function setActiveTab(value) {
    activeTab.value = value === 'unread' ? 'unread' : 'all';
  }

  function setKeyword(value) {
    keyword.value = value;
  }

  function markRead(id) {
    notifications.value = notifications.value.map(item => item.id === id
      ? { ...item, read: true }
      : item);
  }

  function markAllRead() {
    notifications.value = notifications.value.map(item => ({ ...item, read: true }));
  }

  function remove(id) {
    notifications.value = notifications.value.filter(item => item.id !== id);
  }

  return {
    notifications,
    activeTab,
    keyword,
    filteredNotifications,
    stats,
    setActiveTab,
    setKeyword,
    markRead,
    markAllRead,
    remove,
  };
}
