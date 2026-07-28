import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.KUPOLA_APP_URL || 'http://localhost:5173';
const adminTestPassword = process.env.KUPOLA_TEST_PASSWORD || 'newpass123';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error));
page.on('console', message => {
  if (message.type() === 'error') {console.error(message.text());}
});

async function loginAs(username) {
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(username === 'admin' ? adminTestPassword : '123456');
  await page.locator('.login-btn').click();
  await page.waitForFunction(() => location.pathname === '/');
}

async function logout() {
  await page.locator('[data-title="退出登录"]').click();
  await page.waitForFunction(() => location.pathname === '/login');
}

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await loginAs('admin');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => location.pathname === '/');

  await page.locator('[data-title="当前用户资料"]').click();
  await page.locator('.account-view').waitFor();
  await page.locator('.account-password-form input[name="currentPassword"]').waitFor();
  assert.equal(await page.locator('.account-view').getByText('星河集团').count(), 1);
  assert.equal(await page.locator('.account-view').getByText('超级管理员').count(), 1);
  await page.locator('.account-password-form input[name="currentPassword"]').fill('wrong');
  await page.locator('.account-password-form input[name="newPassword"]').fill('newpass123');
  await page.locator('.account-password-form input[name="confirmPassword"]').fill('newpass123');
  await page.locator('.account-password-form button[type="submit"]').click();
  await page.locator('.ds-message__item--error').filter({ hasText: '当前密码不正确' }).waitFor({ timeout: 5000 });
  await page.locator('.account-password-form input[name="currentPassword"]').fill(adminTestPassword);
  await page.locator('.account-password-form button[type="submit"]').click();
  await page.locator('.ds-message__item--success').filter({ hasText: '密码已修改' }).waitFor({ timeout: 5000 });
  await page.locator('.account-password-form .ds-btn--secondary').click();

  await page.locator('[data-title="用户管理"]').first().click();
  await page.waitForFunction(() => location.pathname === '/users', null, { timeout: 5000 });
  await page.locator('.user-list-table tbody tr').first().waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.user-import-input').count(), 1);
  assert.equal(await page.locator('.user-export-select').count(), 1);
  assert.equal(await page.locator('.user-status-filter__button').filter({ hasText: '启用' }).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.user-status-filter__reset').count(), 0);
  assert.equal(await page.locator('.ds-table-page-size').count(), 0);
  assert.equal(await page.locator('.user-list-table').getByRole('button', { name: '查看' }).count(), 0);
  const userExportDownload = page.waitForEvent('download');
  await page.locator('.user-export-select').selectOption('csv');
  assert.match((await userExportDownload).suggestedFilename(), /kupola-users\.csv/);
  
  await page.locator('.add-btn').click();
  await page.locator('.ds-modal-mask.is-visible').waitFor();
  await page.locator('.user-form input[name="name"]').fill('新增测试用户');
  await page.locator('.user-form input[name="email"]').fill('created@example.com');
  await page.locator('.user-form select[name="orgId"]').selectOption({ label: '华东销售部' });
  await page.locator('.user-form .user-role-option').filter({ hasText: '运营管理员' }).click();
  await page.locator('.user-form button[type="submit"]').click();
  await page.locator('.ds-modal-mask').waitFor({ state: 'detached' });
  await page.locator('.user-search__input').fill('created@example.com');
  await page.locator('.user-list-table').getByText('created@example.com').waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.user-list-table').getByText('created@example.com').count(), 1);

  const createdRow = page.locator('.user-list-table tbody tr').filter({ hasText: 'created@example.com' });
  assert.equal(await createdRow.getByText('华东销售部').count(), 1);
  assert.equal(await createdRow.getByText('运营管理员').count(), 1);
  await createdRow.getByRole('button', { name: '编辑' }).click();
  await page.locator('.ds-modal-mask.is-visible .user-form').waitFor();
  assert.equal(await page.locator('.ds-modal-mask.is-visible .ds-modal__title').innerText(), '编辑用户');
  await page.locator('.user-form input[name="phone"]').fill('13100000000');
  await page.locator('.user-form button[type="submit"]').click();
  await page.locator('.user-form').waitFor({ state: 'detached' });

  await createdRow.dblclick();
  await page.locator('.ds-modal-mask.is-visible .user-detail').waitFor();
  assert.equal(await page.locator('.user-detail').getByText('created@example.com').count(), 1);
  assert.equal(await page.locator('.user-detail').getByText('13100000000').count(), 1);

  await page.locator('.ds-modal-mask.is-visible .user-detail .edit-btn').click();
  await page.locator('.ds-modal-mask.is-visible .user-detail-form').waitFor();
  await page.locator('.user-detail-form input[name="name"]').fill('编辑后的测试用户');
  await page.locator('.user-detail-form button[type="submit"]').click();
  await page.locator('.user-detail-form').waitFor({ state: 'detached' });
  assert.equal(await page.locator('.user-detail').getByText('编辑后的测试用户').count(), 1);

  await page.locator('.ds-modal-mask.is-visible .user-detail .delete-btn').click();
  await page.locator('.ds-dialog [data-action="confirm"]').click();
  await page.locator('.user-detail').waitFor({ state: 'detached' });
  assert.equal(await page.locator('.user-list-table').getByText('created@example.com').count(), 0);

  await page.locator('[data-title="机构管理"]').first().click();
  await page.waitForFunction(() => location.pathname === '/organizations', null, { timeout: 5000 });
  await page.locator('.org-tree-node__row').first().waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.org-detail__title-row').getByText('星河集团').count(), 1);

  const eastBranchNode = page.locator('.org-tree-node__row').filter({ hasText: '华东分公司' });
  await eastBranchNode.locator('.org-tree-node__main').click();
  assert.equal(await page.locator('.org-detail__title-row').getByText('华东分公司').count(), 1);

  await page.locator('.org-detail__actions .org-create-child').click();
  await page.locator('.ds-modal-mask.is-visible .org-form').waitFor();
  await page.locator('.org-form input[name="name"]').fill('华东产品部');
  await page.locator('.org-form input[name="code"]').fill('east_product');
  await page.locator('.org-form input[name="leader"]').fill('孙可');
  await page.locator('.org-form input[name="memberCount"]').fill('12');
  await page.locator('.org-form textarea[name="description"]').fill('负责华东产品方案和售前支持。');
  await page.locator('.org-form button[type="submit"]').click();
  await page.locator('.org-form').waitFor({ state: 'detached' });
  assert.equal(await page.locator('.org-detail__title-row').getByText('华东产品部').count(), 1);

  await page.locator('.org-detail__actions .org-edit').click();
  await page.locator('.ds-modal-mask.is-visible .org-form').waitFor();
  await page.locator('.org-form input[name="leader"]').fill('孙可可');
  await page.locator('.org-form button[type="submit"]').click();
  await page.locator('.org-form').waitFor({ state: 'detached' });
  assert.equal(await page.locator('.org-detail-grid').getByText('孙可可').count(), 1);

  await page.locator('.org-detail__actions .org-delete').click();
  await page.locator('.ds-dialog [data-action="confirm"]').click();
  await page.locator('.org-detail__title-row').getByText('华东分公司').waitFor();
  assert.equal(await page.locator('.org-tree').getByText('华东产品部').count(), 0);

  await page.locator('[data-title="权限管理"]').first().click();
  await page.waitForFunction(() => location.pathname === '/permissions', null, { timeout: 5000 });
  await page.locator('.permission-role-card').first().waitFor({ timeout: 5000 });

  const operatorRole = page.locator('.permission-role-card').filter({ hasText: '运营管理员' });
  await operatorRole.locator('.permission-role-card__main').click();
  const deleteUserPermission = page.locator('.permission-item')
    .filter({ hasText: 'user:delete' })
    .locator('input[type="checkbox"]');
  assert.equal(await deleteUserPermission.isChecked(), false);
  await deleteUserPermission.check();
  await page.locator('.permission-scope-option').filter({ hasText: '指定机构' }).click();
  const eastDataScope = page.locator('.permission-scope-tree-node__row')
    .filter({ hasText: '华东分公司' })
    .locator('input[type="checkbox"]');
  await page.locator('.permission-scope-tree-node__label')
    .filter({ hasText: '华东分公司' })
    .click();
  await page.locator('.permission-matrix__actions .ds-btn--primary').click();
  await page.locator('.ds-message__item--success')
    .filter({ hasText: '角色配置已保存。' })
    .waitFor({ timeout: 5000 });
  assert.equal(await deleteUserPermission.isChecked(), true);
  assert.equal(await eastDataScope.isChecked(), true);

  await page.locator('.permission-toolbar__create').click();
  await page.locator('.ds-modal-mask.is-visible').waitFor();
  await page.locator('.permission-form input[name="name"]').fill('客服主管');
  await page.locator('.permission-form input[name="code"]').fill('support_lead');
  await page.locator('.permission-form textarea[name="description"]').fill('负责客服团队的用户资料访问。');
  await page.locator('.permission-form button[type="submit"]').click();
  await page.locator('.ds-modal-mask').waitFor({ state: 'detached' });
  assert.equal(await page.locator('.permission-role-card').filter({ hasText: '客服主管' }).count(), 1);

  await page.locator('[data-title="操作日志"]').first().click();
  await page.waitForFunction(() => location.pathname === '/audit', null, { timeout: 5000 });
  await page.locator('.audit-table tbody tr').first().waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.audit-table .ds-table-page-size').count(), 0);
  assert.equal(await page.locator('.audit-page').count(), 1);
  assert.equal(await page.locator('.audit-stat').count(), 4);
  await page.locator('.audit-stat').filter({ hasText: '失败' }).click();
  assert.equal(await page.locator('.audit-table tbody tr').count(), 1);
  await page.locator('.audit-stat').filter({ hasText: '日志' }).click();
  await page.locator('.audit-search__input').fill('重置密码');
  assert.equal(await page.locator('.audit-table').getByText('重置密码').count(), 1);

  await page.locator('[data-title="登录日志"]').first().click();
  await page.waitForFunction(() => location.pathname === '/audit/login', null, { timeout: 5000 });
  await page.locator('.login-table tbody tr').first().waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.login-table tbody tr').count(), 5);
  assert.equal(await page.locator('.audit-filter-select').count(), 0);
  await page.locator('.audit-stat').filter({ hasText: '警告' }).click();
  assert.equal(await page.locator('.login-table tbody tr').count(), 1);
  await page.locator('.audit-stat').filter({ hasText: '日志' }).click();
  await page.locator('.audit-search__input').fill('auditor');
  assert.equal(await page.locator('.login-table tbody tr').count(), 1);
  await page.locator('.audit-filter-reset').click();

  await page.locator('[data-title="系统设置"]').first().click();
  await page.waitForFunction(() => location.pathname === '/settings', null, { timeout: 5000 });
  await page.locator('.settings-page').waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.settings-panel--dictionary.is-active').count(), 1);
  assert.equal(await page.locator('.settings-dictionary-item').count(), 3);
  await page.getByRole('button', { name: '菜单管理' }).click();
  await page.locator('.settings-panel--menu.is-active').waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.settings-panel--menu .ds-table tbody tr').count(), 8);
  await page.getByRole('button', { name: '权限点管理' }).click();
  await page.locator('.settings-panel--permission.is-active').waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.settings-panel--permission .ds-table tbody tr').count(), 10);
  await page.getByRole('button', { name: '30条/页' }).click();
  assert.equal(await page.locator('.settings-panel--permission .ds-table tbody tr').count(), 20);

  await page.locator('[data-title="通知消息"]').first().click();
  await page.waitForFunction(() => location.pathname === '/notifications', null, { timeout: 5000 });
  await page.locator('.notification-page').waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.notification-item').count(), 6);
  await page.getByRole('button', { name: '未读消息' }).click();
  assert.equal(await page.locator('.notification-item').count(), 3);

  await logout();
  await loginAs('operator');
  assert.equal(await page.locator('.ds-dashboard__header-right').getByText('运营管理员').count(), 1);
  assert.equal(await page.locator('[data-title="权限管理"]').count(), 0);
  await page.goto(`${baseUrl}/permissions`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => location.pathname === '/403', null, { timeout: 5000 });

  await page.locator('[data-title="用户管理"]').first().click();
  await page.waitForFunction(() => location.pathname === '/users', null, { timeout: 5000 });
  await page.locator('.user-list-table tbody tr').first().waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.user-list-table tbody tr[data-row-key]').count(), 1);
  assert.equal(await page.locator('.user-list-table tbody tr[data-row-key] .ds-tag--success').count(), 1);
  await page.locator('.user-status-filter__button').filter({ hasText: '全部状态' }).click();
  assert.equal(await page.locator('.user-list-table tbody tr[data-row-key]').count(), 2);
  assert.equal(await page.locator('.user-list-table').getByText('华东销售部').count(), 1);
  assert.equal(await page.locator('.user-list-table').getByText('华东交付部').count(), 1);
  assert.equal(await page.locator('.user-list-table').getByText('财务中心').count(), 0);
  assert.equal(await page.locator('.user-list-table').getByRole('button', { name: '删除' }).count(), 0);
  assert.ok(await page.locator('.add-btn').count() > 0);

  await logout();
  await loginAs('viewer');
  assert.equal(await page.locator('[data-title="机构管理"]').count(), 0);
  assert.equal(await page.locator('[data-title="权限管理"]').count(), 0);
  await page.locator('[data-title="用户管理"]').first().click();
  await page.waitForFunction(() => location.pathname === '/users', null, { timeout: 5000 });
  await page.locator('.user-list-table').waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.user-list-table tbody tr[data-row-key]').count(), 0);
  await page.locator('.user-status-filter__button').filter({ hasText: '全部状态' }).click();
  await page.locator('.user-list-table tbody tr[data-row-key]').first().waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.user-list-table tbody tr').count(), 1);
  assert.equal(await page.locator('.user-list-table').getByText('王五').count(), 1);
  assert.equal(await page.locator('.add-btn').count(), 0);
  assert.equal(await page.locator('.user-list-table').getByRole('button', { name: '编辑' }).count(), 0);
  assert.equal(await page.locator('.user-list-table').getByRole('button', { name: '删除' }).count(), 0);
  await page.goto(`${baseUrl}/organizations`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => location.pathname === '/403', null, { timeout: 5000 });

  await logout();
  await loginAs('auditor');
  assert.equal(await page.locator('[data-title="用户管理"]').count(), 0);
  assert.equal(await page.locator('[data-title="权限管理"]').count(), 1);
  await page.locator('[data-title="权限管理"]').first().click();
  await page.waitForFunction(() => location.pathname === '/permissions', null, { timeout: 5000 });
  await page.locator('.permission-role-card').first().waitFor({ timeout: 5000 });
  assert.equal(await page.locator('.permission-toolbar__create').count(), 0);
  assert.equal(await page.locator('.permission-role-card__actions .permission-icon-btn').count(), 0);
  assert.equal(await page.locator('.permission-matrix__actions .ds-btn--primary').isDisabled(), true);
  await page.goto(`${baseUrl}/users`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => location.pathname === '/403', null, { timeout: 5000 });

  const brandButton = page.locator('[data-title="品牌色"]');
  await brandButton.click();
  await page.locator('.ds-brand-picker.is-open').waitFor();
  await brandButton.click();
  await page.locator('.ds-brand-picker.is-open').waitFor({ state: 'hidden' });
  await brandButton.click();
  await page.locator('.ds-brand-picker.is-open').waitFor();

  const themeBefore = await page.locator('html').getAttribute('data-theme');
  await page.locator('[data-title="切换主题"]').click();
  await page.waitForFunction(previous => document.documentElement.dataset.theme !== previous, themeBefore);
  assert.equal(pageErrors.length, 0, pageErrors.map(error => error.stack || error.message).join('\n'));
} finally {
  await browser.close();
}
