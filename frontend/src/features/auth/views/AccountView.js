import { html, signal } from '@kupola/platform';
import { Message } from '@kupola/components/message';
import { password, schema, schemaSubmit } from '@kupola/components/schemaform';

const DATA_SCOPE_LABELS = Object.freeze({
  all: '全部机构',
  currentOrg: '本机构',
  currentAndChildren: '本机构及下级',
  customOrgs: '指定机构',
  self: '仅本人',
});

const changePasswordSchema = schema({
  currentPassword: password('当前密码').required(),
  newPassword: password('新密码').required().minlength(8, '新密码至少需要 8 位。'),
  confirmPassword: password('确认新密码').required().minlength(8, '确认密码至少需要 8 位。'),
});

function dataScopeLabel(scope) {
  if (!scope) {
    return '-';
  }
  const label = DATA_SCOPE_LABELS[scope.type] || '未设置';
  if (scope.type === 'customOrgs' && scope.organizationIds?.length > 0) {
    return `${label}（${scope.organizationIds.join('、')}）`;
  }
  return label;
}

function infoRow(label, value) {
  return html`
    <div class="account-info-row">
      <span>${label}</span>
      <strong>${value || '-'}</strong>
    </div>
  `;
}

function profileSection(user) {
  const roles = user.roleNames?.join('、') || user.role || '-';
  const scopes = user.dataScopes?.map(dataScopeLabel).join('、') || '-';
  return html`
    <section class="account-section">
      <div class="account-section__heading">
        <span class="account-avatar" aria-hidden="true">${String(user.name || '?').slice(0, 1)}</span>
        <div>
          <h2>${user.name || '未登录'}</h2>
          <p>${user.username || '-'}</p>
        </div>
      </div>
      <div class="account-info-list">
        ${infoRow('登录账号', user.username)}
        ${infoRow('所属机构', user.orgName)}
        ${infoRow('角色', roles)}
        ${infoRow('数据范围', scopes)}
        ${infoRow('权限点', `${user.permissions?.length || 0} 个`)}
      </div>
    </section>
  `;
}

function passwordSection({ onSubmit, onCancel, saving }) {
  return html`
    <section class="account-section account-password-section">
      <div class="account-section__title">
        <h3>修改密码</h3>
        <span>修改后下次登录使用新密码</span>
      </div>
      <form
        class="ds-schema-form account-password-form"
        novalidate
        onsubmit="${schemaSubmit(changePasswordSchema, onSubmit, { feedback: false })}"
      >
        <div class="account-password-form__fields">
          <label class="ds-schema-form__field ds-form-field">
            <span class="ds-schema-form__label ds-form-label">当前密码</span>
            <input k-field="currentPassword" autocomplete="current-password" />
          </label>
          <label class="ds-schema-form__field ds-form-field">
            <span class="ds-schema-form__label ds-form-label">新密码</span>
            <input k-field="newPassword" autocomplete="new-password" />
          </label>
          <label class="ds-schema-form__field ds-form-field">
            <span class="ds-schema-form__label ds-form-label">确认新密码</span>
            <input k-field="confirmPassword" autocomplete="new-password" />
          </label>
        </div>
        <div class="account-password-form__actions">
          <button type="button" class="ds-btn ds-btn--secondary" onclick="${onCancel}">关闭</button>
          <button
            type="submit"
            class="ds-btn ds-btn--primary"
            disabled="${() => saving.value ? 'disabled' : false}"
          >${() => saving.value ? '保存中...' : '保存新密码'}</button>
        </div>
      </form>
    </section>
  `;
}

export function accountView({ user, auth, onClose }) {
  const feedback = Message({ maxCount: 2 });
  const saving = signal(false);
  const close = () => {
    feedback.destroy();
    onClose?.();
  };
  const onSubmit = async (data, form) => {
    if (data.newPassword !== data.confirmPassword) {
      feedback.error('两次输入的新密码不一致。');
      return;
    }
    saving.value = true;
    try {
      await auth.changePassword({
        username: user.username,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      form.reset();
      feedback.success('密码已修改。');
    } catch (error) {
      feedback.error(error?.message || '密码修改失败，请稍后再试。');
    } finally {
      saving.value = false;
    }
  };

  return html`
    <div class="account-view">
      ${profileSection(user)}
      ${passwordSection({ onSubmit, onCancel: close, saving })}
    </div>
  `;
}
