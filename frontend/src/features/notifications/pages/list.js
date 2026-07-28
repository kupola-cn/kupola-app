import { Message } from '@kupola/components/message';
import { createNotificationState } from '../state.js';
import { notificationPageView } from '../view.js';

export default function NotificationListPage() {
  const notificationState = createNotificationState();
  const feedback = Message({ maxCount: 3 });

  function handleMarkAllRead() {
    if (notificationState.stats.value.unread === 0) {
      return;
    }
    notificationState.markAllRead();
    feedback.success('全部通知已标记为已读。');
  }

  function handleMarkRead(notification) {
    notificationState.markRead(notification.id);
  }

  function handleRemove(notification) {
    notificationState.remove(notification.id);
    feedback.success('通知已删除。');
  }

  return notificationPageView({
    activeTab: notificationState.activeTab,
    keyword: notificationState.keyword,
    notifications: notificationState.filteredNotifications,
    stats: notificationState.stats,
    onSelectTab: notificationState.setActiveTab,
    onSearch: event => notificationState.setKeyword(event.target.value),
    onMarkAllRead: handleMarkAllRead,
    onMarkRead: handleMarkRead,
    onRemove: handleRemove,
  });
}
