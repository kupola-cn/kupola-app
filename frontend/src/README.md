# Source Structure

The frontend is organized by ownership boundary first, then by role when a feature grows enough to need it.

- `app/` owns the app shell, navigation, and route table.
- Small features can stay flat with `view.js`, `state.js`, and a small `pages/` directory when routing needs it.
- Inside a feature, avoid repeating the feature name in every file. Prefer names like `pages/list.js`, `pages/detail.js`, and `pages/listtable.js`.
- Larger features may introduce focused subdirectories only when the extra boundary pays for itself.
- `styles/` owns global CSS.

View modules should stay thin:

- Pass all dynamic data and handlers through function parameters.
- Use `xxxView` names for exported view functions.
- Quote dynamic attributes, including event handlers, such as `value="${value}"` and `onclick="${handler}"`.
- Keep control flow in JS when it carries business meaning; use islands/components for lifecycle-heavy UI.
