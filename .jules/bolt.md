## 2025-03-10 - Optimizing DataTable columns rendering
**Learning:** Wrapping `@tanstack/react-table` column definitions in `useMemo` with an empty array `[]` prevents unnecessary component re-renders of the table structure. Handlers and dynamic state should be passed via the `meta` object to `<DataTable />` and accessed through `info.table.options.meta` in the `cell` renderer, instead of passing them directly as dependencies to `useMemo`.
**Action:** When creating tables with `@tanstack/react-table`, always memoize columns with `[]` and pass any dynamic data or handlers through the `meta` prop.

## 2025-03-11 - Resolving N+1 Database queries using Left Joins
**Learning:** Resolving N+1 query loops using a single `GROUP BY` execution provides immense performance improvements for complex endpoints fetching deep entity relationships. Always prefer SQL aggregations with `GROUP BY` and `LEFT JOIN` over executing individual queries inside a `map` or `Promise.all` loop.
**Action:** Always prefer SQL joins with aggregate functions inside initial relationship queries over firing multiple nested requests down the pipe.
