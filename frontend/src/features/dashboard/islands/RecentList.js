import { html } from '@kupola/platform';

export function RecentList(props) {
  const { title, data } = props;

  function getStatusClass(status) {
    switch (status) {
      case 'active': return 'ds-tag--success';
      case 'pending': return 'ds-tag--warning';
      default: return '';
    }
  }

  function getStatusText(status) {
    switch (status) {
      case 'active': return '已就诊';
      case 'pending': return '等待中';
      default: return status;
    }
  }

  function getAvatar(name) {
    return name.charAt(0);
  }

  return html`
    <div class="ds-card">
      <div class="ds-card__title">${title}</div>
      <div class="ds-card__body">
        <div class="ds-table">
          <table>
            <thead>
              <tr>
                <th>用户姓名</th>
                <th>科室</th>
                <th>状态</th>
                <th>预约时间</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => html`
                <tr>
                  <td>
                    <div class="flex items-center gap-8">
                      <div class="ds-avatar" style="width: 28px; height: 28px;">${getAvatar(item.name)}</div>
                      <span>${item.name}</span>
                    </div>
                  </td>
                  <td><span class="ds-tag">${item.department}</span></td>
                  <td><span class="ds-tag ${getStatusClass(item.status)}">${getStatusText(item.status)}</span></td>
                  <td>${item.time}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
