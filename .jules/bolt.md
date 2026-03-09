
## 2025-03-09 - [DataTable Row State Re-renders]
**Learning:** In the `@maatwork/web` app using `@tanstack/react-table`, defining `columns` with a `useMemo` dependency array containing row-specific state (like `openDropdownId`) causes the entire `<DataTable />` to re-render when a single row's state changes. This is a severe performance bottleneck for large tables.
**Action:** Always extract row-specific state and handlers into a `useMemo` memoized `meta` object and pass it via the `meta` prop to `<DataTable />` / `useReactTable`. Define `columns` with an empty dependency array `[]` and access the state/handlers via `info.table.options.meta` in cell renderers.
