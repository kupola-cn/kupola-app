import { createAuditLogState } from '../state.js';
import {
  auditTableView,
  listPageView,
  statsView,
  toolbarView,
} from '../view.js';

export default function AuditLogPage() {
  const auditState = createAuditLogState();

  return listPageView({
    toolbar: toolbarView({
      stats: statsView({
        stats: auditState.stats,
        resultFilter: auditState.resultFilter,
        onResultFilter: auditState.setResultFilter,
      }),
      searchKeyword: auditState.searchKeyword,
      moduleFilter: auditState.moduleFilter,
      modules: auditState.modules,
      onSearch: event => auditState.setSearchKeyword(event.target.value),
      onModuleFilter: event => auditState.setModuleFilter(event.target.value),
      onResetFilters: auditState.resetFilters,
    }),
    table: auditTableView({ logs: auditState.filteredLogs }),
  });
}
