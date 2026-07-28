import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    target: 'es2022',
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  resolve: {
    alias: {
      '@kupola/core': path.resolve(__dirname, '../../kupola-u/packages/core/src/index.js'),
      '@kupola/platform/css': path.resolve(__dirname, '../../kupola-u/packages/platform/dist/css/index.css'),
      '@kupola/platform/template': path.resolve(__dirname, '../../kupola-u/packages/platform/src/template.js'),
      '@kupola/platform/render': path.resolve(__dirname, '../../kupola-u/packages/platform/src/render.js'),
      '@kupola/platform/component': path.resolve(__dirname, '../../kupola-u/packages/platform/src/component.js'),
      '@kupola/platform/directives': path.resolve(__dirname, '../../kupola-u/packages/platform/src/directives.js'),
      '@kupola/platform/theme': path.resolve(__dirname, '../../kupola-u/packages/platform/src/theme.js'),
      '@kupola/platform/lazy': path.resolve(__dirname, '../../kupola-u/packages/platform/src/lazy.js'),
      '@kupola/platform/server': path.resolve(__dirname, '../../kupola-u/packages/platform/src/server.js'),
      '@kupola/platform/i18n': path.resolve(__dirname, '../../kupola-u/packages/platform/src/i18n.js'),
      '@kupola/platform/errors': path.resolve(__dirname, '../../kupola-u/packages/platform/src/errors.js'),
      '@kupola/platform': path.resolve(__dirname, '../../kupola-u/packages/platform/src/platform.js'),
      '@kupola/components/form': path.resolve(__dirname, '../../kupola-u/packages/components/src/components/form.js'),
      '@kupola/components/icons': path.resolve(__dirname, '../../kupola-u/packages/components/src/components/icons.js'),
      '@kupola/components/ui': path.resolve(__dirname, '../../kupola-u/packages/components/src/components/ui.js'),
      '@kupola/components/modal': path.resolve(__dirname, '../../kupola-u/packages/components/src/components/modal.js'),
      '@kupola/components/message': path.resolve(__dirname, '../../kupola-u/packages/components/src/components/message.js'),
      '@kupola/components/overlay': path.resolve(__dirname, '../../kupola-u/packages/components/src/components/overlay.js'),
      '@kupola/components/schemaform': path.resolve(__dirname, '../../kupola-u/packages/components/src/components/schemaform.js'),
      '@kupola/components/table': path.resolve(__dirname, '../../kupola-u/packages/components/src/components/table.js'),
      '@kupola/components/views': path.resolve(__dirname, '../../kupola-u/packages/components/src/components/views.js'),
      '@kupola/components': path.resolve(__dirname, '../../kupola-u/packages/components/src/index.js'),
      '@kupola/auth': path.resolve(__dirname, '../../kupola-u/packages/auth/src/index.js'),
      '@kupola/auth/directive': path.resolve(__dirname, '../../kupola-u/packages/auth/src/directive.js'),
      '@kupola/auth/http': path.resolve(__dirname, '../../kupola-u/packages/auth/src/http-guard.js'),
      '@kupola/auth/context': path.resolve(__dirname, '../../kupola-u/packages/auth/src/auth-context.js'),
      '@kupola/router': path.resolve(__dirname, '../../kupola-u/packages/router/src/index.js'),
      '@kupola/router/auth': path.resolve(__dirname, '../../kupola-u/packages/router/src/auth.js'),
      '@kupola/router/link': path.resolve(__dirname, '../../kupola-u/packages/router/src/link.js'),
      '@kupola/router/view': path.resolve(__dirname, '../../kupola-u/packages/router/src/view.js'),
      '@kupola/router/server': path.resolve(__dirname, '../../kupola-u/packages/router/src/server.js'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
