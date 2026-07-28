import {
  createAuthContext,
  getAuthContext,
  hydrateAuthContext,
  onAuthContextChange,
  setAuthContext,
} from '@kupola/auth';

function assertAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object'
    || typeof adapter.login !== 'function'
    || typeof adapter.restore !== 'function'
    || typeof adapter.logout !== 'function') {
    throw new TypeError('AuthProvider requires login(), restore(), and logout() adapter methods.');
  }
}

function getUser(session) {
  if (!session?.user || typeof session.user !== 'object') {
    throw new Error('认证服务未返回有效用户信息。');
  }
  return session.user;
}

export function createAuthProvider(adapter) {
  assertAdapter(adapter);

  return Object.freeze({
    async restore() {
      const hydrated = hydrateAuthContext();
      if (hydrated) {return hydrated;}

      try {
        const session = await adapter.restore();
        if (!session) {
          setAuthContext(null);
          return null;
        }
        return createAuthContext(getUser(session));
      } catch {
        try { await adapter.logout(); } catch { /* Session cleanup is best effort. */ }
        setAuthContext(null);
        return null;
      }
    },

    async login(credentials) {
      const session = await adapter.login(credentials);
      return createAuthContext(getUser(session));
    },

    async logout() {
      try {
        await adapter.logout();
      } finally {
        setAuthContext(null);
      }
    },

    async changePassword(credentials) {
      if (typeof adapter.changePassword !== 'function') {
        throw new Error('当前认证方式暂不支持修改密码。');
      }
      return adapter.changePassword(credentials);
    },

    getContext() {
      return getAuthContext();
    },

    onChange(listener) {
      return onAuthContextChange(listener);
    },
  });
}
