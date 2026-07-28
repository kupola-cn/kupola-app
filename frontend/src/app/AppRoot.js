import { defineComponent, html } from '@kupola/platform';

export const AppRoot = defineComponent({
  setup() {
    return html`<div class="app-root"><div k-router-view></div></div>`;
  },
});
