import { signal, effect } from '@kupola/core';
import { html } from '@kupola/platform';

export function StatCard(props) {
  const { label, value, delta, trend } = props;
  const displayValue = signal('0');
  const initialized = signal(false);

  effect(() => {
    if (!initialized.value) {
      initialized.value = true;
      const targetValue = value.replace(/[^\d]/g, '');
      const duration = 1500;
      const startTime = performance.now();
      
      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        displayValue.value = Math.floor(parseInt(targetValue) * eased).toLocaleString();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          displayValue.value = value;
        }
      }
      
      requestAnimationFrame(animate);
    }
  });

  return html`
    <div class="ds-statcard">
      <span class="ds-statcard__label">${label}</span>
      <span class="ds-statcard__value">${displayValue.value}</span>
      <span class="ds-statcard__delta ${trend === 'up' ? 'is-up' : trend === 'down' ? 'is-down' : ''}">
        ${trend === 'up' ? html`<span class="trend-icon">↑</span>` : trend === 'down' ? html`<span class="trend-icon">↓</span>` : html`<span class="trend-icon">→</span>`}
        ${delta}
      </span>
    </div>
  `;
}
