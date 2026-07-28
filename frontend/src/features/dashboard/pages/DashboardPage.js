import { signal } from '@kupola/core';
import { RecentUsersTable } from '../islands/RecentUsersTable.js';
import { dashboardPageView } from '../views/DashboardPageView.js';

export function DashboardPage() {
  const stats = signal([
    { label: '总用户数', value: '1,256', delta: '+12% 本月', trend: 'up' },
    { label: '今日访问', value: '89', delta: '+5% 昨日', trend: 'up' },
    { label: '订单数量', value: '45', delta: '+2 本月', trend: 'up' },
    { label: '收入金额', value: '¥12,345', delta: '稳定', trend: 'stable' },
  ]);

  const appointmentStats = signal({
    completed: 66,
    pending: 23,
    cancelled: 5,
    total: 94,
    percentage: 70,
  });

  const recentUsers = signal([
    { id: 1, name: '王小明', department: '内科', status: 'active', time: '09:30' },
    { id: 2, name: '李小红', department: '外科', status: 'pending', time: '10:00' },
    { id: 3, name: '张大山', department: '儿科', status: 'pending', time: '10:30' },
    { id: 4, name: '刘芳', department: '皮肤科', status: 'active', time: '08:45' },
  ]);

  return dashboardPageView({
    stats,
    appointmentStats,
    recentUsersTable: RecentUsersTable({ data: recentUsers }),
  });
}
