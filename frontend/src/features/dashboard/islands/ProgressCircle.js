import { signal, effect } from '@kupola/core';
import { html } from '@kupola/platform';

export function ProgressCircle(props) {
  const { value, size = 120 } = props;
  const displayValue = signal(0);
  const initialized = signal(false);
  
  const radius = (size - 16) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  effect(() => {
    if (!initialized.value) {
      initialized.value = true;
      const duration = 1500;
      const startTime = performance.now();
      
      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        
        displayValue.value = Math.floor(value * eased);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }
      
      requestAnimationFrame(animate);
    }
  });

  return html`
    <div class="ds-progress-circle" data-value=${value} data-size=${size}>
      <svg viewBox="0 0 ${size} ${size}">
        <circle cx=${size/2} cy=${size/2} r=${radius} fill="none" stroke="var(--bg-overlay-l3)" stroke-width="8"/>
        <circle cx=${size/2} cy=${size/2} r=${radius} fill="none" stroke="var(--bg-brand)" stroke-width="8" stroke-linecap="round" stroke-dasharray=${circumference} stroke-dashoffset=${offset}/>
      </svg>
      <span class="ds-progress-circle__value">${displayValue.value}%</span>
    </div>
  `;
}
