import { html } from '@kupola/platform';

export function statusPageView({ containerClass, cardClass, iconClass, icon, title, message, onHome }) {
  return html`
    <div class="${containerClass}">
      <div class="${cardClass}">
        <div class="${iconClass}">${icon}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <button class="home-btn" onclick="${onHome}">返回首页</button>
      </div>
    </div>
  `;
}
