import { signal, computed } from '@kupola/core';
import { useAuth } from '@kupola/auth';
import { useRouter } from '@kupola/router';
import { loginFormFieldsView, loginPageView } from '../views/LoginPageView.js';

export function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const username = signal('admin');
  const password = signal('123456');
  const loading = signal(false);
  const error = signal('');

  const buttonText = computed(() => loading.value ? '登录中...' : '登 录');

  async function handleLogin(data) {
    loading.value = true;
    error.value = '';

    try {
      await auth.login(data);
      router.push('/');
    } catch (err) {
      error.value = err?.message || '网络错误，请重试';
    } finally {
      loading.value = false;
    }
  }

  const handleSubmit = data => {
    if (!loading.value) {void handleLogin(data);}
  };

  return loginPageView({
    onSubmit: handleSubmit,
    formFields: loginFormFieldsView({
      username,
      password,
      loading,
      error,
      buttonText,
      onUsernameInput: event => {
        username.value = event.target.value;
      },
      onPasswordInput: event => {
        password.value = event.target.value;
      },
    }),
  });
}
