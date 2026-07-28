import { computed, signal } from '@kupola/platform';

export const INITIAL_OPERATION_LOGS = Object.freeze([
  {
    id: 1,
    module: '用户管理',
    action: '新增用户',
    operator: '管理员',
    target: '新增测试用户',
    result: 'success',
    ip: '10.18.2.11',
    createdAt: '2026-07-28 09:12:18',
  },
  {
    id: 2,
    module: '用户管理',
    action: '重置密码',
    operator: '管理员',
    target: '张三',
    result: 'success',
    ip: '10.18.2.11',
    createdAt: '2026-07-28 09:18:42',
  },
  {
    id: 3,
    module: '机构管理',
    action: '调整上级机构',
    operator: '管理员',
    target: '华东产品部',
    result: 'success',
    ip: '10.18.2.11',
    createdAt: '2026-07-28 09:24:05',
  },
  {
    id: 4,
    module: '权限管理',
    action: '保存角色配置',
    operator: '管理员',
    target: '运营管理员',
    result: 'success',
    ip: '10.18.2.11',
    createdAt: '2026-07-28 09:31:29',
  },
  {
    id: 5,
    module: '权限管理',
    action: '删除系统角色',
    operator: '审计员',
    target: '超级管理员',
    result: 'failed',
    ip: '10.18.5.23',
    createdAt: '2026-07-27 18:43:16',
  },
  {
    id: 6,
    module: '用户管理',
    action: '批量锁定用户',
    operator: '管理员',
    target: '3 个用户',
    result: 'success',
    ip: '10.18.2.11',
    createdAt: '2026-07-27 16:02:37',
  },
  {
    id: 7,
    module: '机构管理',
    action: '停用机构',
    operator: '管理员',
    target: '华南运营部',
    result: 'warning',
    ip: '10.18.2.11',
    createdAt: '2026-07-26 11:52:09',
  },
]);

export const INITIAL_LOGIN_LOGS = Object.freeze([
  {
    id: 1,
    username: 'admin',
    name: '管理员',
    result: 'success',
    ip: '10.18.2.11',
    device: 'Chrome / Windows',
    location: '上海',
    createdAt: '2026-07-28 09:02:44',
  },
  {
    id: 2,
    username: 'operator',
    name: '运营管理员',
    result: 'success',
    ip: '10.18.4.18',
    device: 'Edge / Windows',
    location: '杭州',
    createdAt: '2026-07-28 08:46:21',
  },
  {
    id: 3,
    username: 'auditor',
    name: '审计员',
    result: 'failed',
    ip: '10.18.5.23',
    device: 'Safari / macOS',
    location: '上海',
    createdAt: '2026-07-27 22:18:07',
  },
  {
    id: 4,
    username: 'viewer',
    name: '只读成员',
    result: 'success',
    ip: '10.18.6.45',
    device: 'Chrome / Android',
    location: '宁波',
    createdAt: '2026-07-27 18:26:52',
  },
  {
    id: 5,
    username: 'operator',
    name: '运营管理员',
    result: 'warning',
    ip: '172.16.8.4',
    device: 'Chrome / Windows',
    location: '未知',
    createdAt: '2026-07-27 11:04:39',
  },
]);

function normalizeKeyword(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesLog(log, keyword) {
  if (!keyword) {
    return true;
  }
  return log.module.toLowerCase().includes(keyword)
    || log.action.toLowerCase().includes(keyword)
    || log.operator.toLowerCase().includes(keyword)
    || log.target.toLowerCase().includes(keyword)
    || log.ip.toLowerCase().includes(keyword);
}

export function createAuditLogState(initialLogs = INITIAL_OPERATION_LOGS) {
  const logs = signal([ ...initialLogs ]);
  const searchKeyword = signal('');
  const moduleFilter = signal('');
  const resultFilter = signal('');

  const modules = computed(() => [ ...new Set(logs.value.map(log => log.module)) ]);

  const filteredLogs = computed(() => {
    const keyword = normalizeKeyword(searchKeyword.value);
    const module = String(moduleFilter.value || '');
    const result = String(resultFilter.value || '');

    return logs.value
      .filter(log => matchesLog(log, keyword)
        && (!module || log.module === module)
        && (!result || log.result === result))
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  });

  const stats = computed(() => {
    const total = logs.value.length;
    const success = logs.value.filter(log => log.result === 'success').length;
    const failed = logs.value.filter(log => log.result === 'failed').length;
    const warning = logs.value.filter(log => log.result === 'warning').length;
    return { total, success, failed, warning };
  });

  function setSearchKeyword(value) {
    searchKeyword.value = value;
  }

  function setModuleFilter(value) {
    moduleFilter.value = value || '';
  }

  function setResultFilter(value) {
    resultFilter.value = value || '';
  }

  function resetFilters() {
    searchKeyword.value = '';
    moduleFilter.value = '';
    resultFilter.value = '';
  }

  return {
    logs,
    searchKeyword,
    moduleFilter,
    resultFilter,
    modules,
    filteredLogs,
    stats,
    setSearchKeyword,
    setModuleFilter,
    setResultFilter,
    resetFilters,
  };
}

export function createLoginLogState(initialLogs = INITIAL_LOGIN_LOGS) {
  const logs = signal([ ...initialLogs ]);
  const searchKeyword = signal('');
  const resultFilter = signal('');

  const filteredLogs = computed(() => {
    const keyword = normalizeKeyword(searchKeyword.value);
    const result = String(resultFilter.value || '');
    return logs.value
      .filter(log => (!keyword
        || log.username.toLowerCase().includes(keyword)
        || log.name.toLowerCase().includes(keyword)
        || log.ip.toLowerCase().includes(keyword)
        || log.device.toLowerCase().includes(keyword)
        || log.location.toLowerCase().includes(keyword))
        && (!result || log.result === result))
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  });

  const stats = computed(() => ({
    total: logs.value.length,
    success: logs.value.filter(log => log.result === 'success').length,
    failed: logs.value.filter(log => log.result === 'failed').length,
    warning: logs.value.filter(log => log.result === 'warning').length,
  }));

  function setSearchKeyword(value) {
    searchKeyword.value = value;
  }

  function setResultFilter(value) {
    resultFilter.value = value || '';
  }

  function resetFilters() {
    searchKeyword.value = '';
    resultFilter.value = '';
  }

  return {
    logs,
    searchKeyword,
    resultFilter,
    filteredLogs,
    stats,
    setSearchKeyword,
    setResultFilter,
    resetFilters,
  };
}
