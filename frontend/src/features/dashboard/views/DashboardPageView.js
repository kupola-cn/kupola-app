import { html } from '@kupola/platform';

export function dashboardStatCardView(stat) {
  return html`
    <div class="ds-card">
      <div class="ds-card__body">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-secondary text-sm">${stat.label}</p>
            <p class="h2 mt-4">${stat.value}</p>
          </div>
          <div class="ds-stat-card__trend ds-stat-card__trend--${stat.trend}">
            ${stat.delta}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function appointmentStatsView({ appointmentStats }) {
  return html`
    <div class="ds-card">
      <div class="ds-card__title">今日预约统计</div>
      <div class="ds-card__body">
        <div class="flex items-center justify-between">
          <div class="flex flex-col items-center">
            <div class="relative">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#e0e0e0" stroke-width="10">
                <circle  cx="60" cy="60" r="50" fill="none" stroke="#10b981" stroke-width="10" 
                stroke-dasharray="${() => appointmentStats.value.percentage * 3.14}" stroke-dashoffset="0" stroke-linecap="round" />
                <text x="60" y="65" text-anchor="middle" font-size="20" fill="#333">
                  ${() => appointmentStats.value.percentage}%
                </text>
              </svg>
            </div>
            <p class="text-secondary text-sm mt-4">已完成预约</p>
          </div>

          <div class="flex flex-col gap-8">
            <div class="flex items-center gap-8">
              <div class="w-3 h-3 rounded-full bg-status-success"></div>
              <span>已完成: ${() => appointmentStats.value.completed}</span>
            </div>
            <div class="flex items-center gap-8">
              <div class="w-3 h-3 rounded-full bg-status-warning"></div>
              <span>待处理: ${() => appointmentStats.value.pending}</span>
            </div>
            <div class="flex items-center gap-8">
              <div class="w-3 h-3 rounded-full bg-status-error"></div>
              <span>已取消: ${() => appointmentStats.value.cancelled}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function dashboardPageView({ stats, appointmentStats, recentUsersTable }) {
  return html`
    <div class="grid grid-cols-4 gap-16 mb-32">
      ${() => stats.value.map(stat => dashboardStatCardView(stat))}
    </div>

    <div class="grid grid-cols-2 gap-16">
      ${appointmentStatsView({ appointmentStats })}

      <div class="ds-card">
        <div class="ds-card__title">最近用户列表</div>
        <div class="ds-card__body">
          ${recentUsersTable}
        </div>
      </div>
    </div>
  `;
}
