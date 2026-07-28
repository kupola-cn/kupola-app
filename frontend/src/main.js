import { createRouter, createRouterPlugin } from '@kupola/router';
import { createApp } from '@kupola/platform';
import '@kupola/platform/css';
import { createAuthPlugin } from '@kupola/auth';
import { createOverlayPlugin } from '@kupola/components/overlay';
import { createKupolaIconProvider, setupUi } from '@kupola/components/ui';
import './styles/main.css';

import routes from './app/routes.js';
import { AppRoot } from './app/AppRoot.js';
import { authProvider } from './features/auth/authProvider.js';
import { AUTH_EXPIRED_EVENT } from './api/client.js';

setupUi({
  theme: true,
  icons: {
    providers: [
      createKupolaIconProvider({ groups: [ 'misc', 'user', 'action', 'file', 'interface' ] }),
    ],
    fallback: 'kupola',
  },
});

const router = createRouter({ mode: 'history', routes });
if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_EXPIRED_EVENT, () => {
    void authProvider.logout();
  });
}
const app = createApp(AppRoot)
  .use(createAuthPlugin(authProvider))
  .use(createRouterPlugin(router, {
    auth: authProvider,
    loginPath: '/login',
    forbiddenPath: '/403',
  }))
  .use(createOverlayPlugin());

await app.mountAsync('#app');
