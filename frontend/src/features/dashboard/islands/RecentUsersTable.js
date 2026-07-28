import { TableView } from '@kupola/components/views';

export function RecentUsersTable({ data }) {
  return TableView({
    ariaLabel: '最近用户列表',
    className: 'recent-users-table',
    columns: [
        { key: 'name', title: '姓名' },
        { key: 'department', title: '科室' },
        {
          key: 'status',
          title: '状态',
          render: status => {
            const badge = document.createElement('span');
            const active = status === 'active';
            badge.className = `ds-badge ds-badge--${active ? 'success' : 'warning'}`;
            badge.textContent = active ? '已完成' : '待处理';
            return badge;
          },
        },
        { key: 'time', title: '时间' },
    ],
    data,
    options: {
      compact: true,
      rowKey: 'id',
      showPagination: false,
    },
  });
}
