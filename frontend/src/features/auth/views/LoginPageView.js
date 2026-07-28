import { html } from '@kupola/platform';
import { FormView } from '@kupola/components/views';

export function loginFormFieldsView({
  username,
  password,
  loading,
  error,
  buttonText,
  onUsernameInput,
  onPasswordInput,
}) {
  return html`
    <div class="form-group ds-form-field">
      <label>用户名</label>
      <input
        type="text"
        name="username"
        value="${username.value}"
        oninput="${onUsernameInput}"
        placeholder="请输入用户名"
        data-required="true"
        data-message-required="请填写用户名"
      />
    </div>

    <div class="form-group ds-form-field">
      <label>密码</label>
      <input
        type="password"
        name="password"
        value="${password.value}"
        oninput="${onPasswordInput}"
        placeholder="请输入密码"
        data-required="true"
        data-minlength="6"
        data-message-required="请填写密码"
        data-message-minlength="密码至少6位"
      />
    </div>

    ${() => error.value ? html`<div class="error-message">${error.value}</div>` : ''}

    <button type="submit" disabled=${loading} class="login-btn">
      ${buttonText}
    </button>
  `;
}

export function loginPageView({ onSubmit, formFields }) {
  return html`
    <div class="login-container">
      <div class="login-card">
        <h1 class="login-title">Kupola App</h1>
        <p class="login-subtitle">欢迎登录管理后台</p>

        ${FormView({ className: 'login-form ds-form', onSubmit }, formFields)}

        <p class="login-footer">
          测试账号: admin / 123456
        </p>
      </div>
    </div>
  `;
}
