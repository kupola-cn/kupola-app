import { createLoginLogState } from '../state.js';
import {
  listPageView,
  loginTableView,
  loginToolbarView,
  statsView,
} from '../view.js';

export default function LoginLogPage() {
  const loginState = createLoginLogState();

  return listPageView({
    toolbar: loginToolbarView({
      stats: statsView({
        stats: loginState.stats,
        resultFilter: loginState.resultFilter,
        onResultFilter: loginState.setResultFilter,
      }),
      searchKeyword: loginState.searchKeyword,
      onSearch: event => loginState.setSearchKeyword(event.target.value),
      onResetFilters: loginState.resetFilters,
    }),
    table: loginTableView({ logs: loginState.filteredLogs }),
  });
}
