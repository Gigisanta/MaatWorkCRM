# Bolt Journal


## 2024-05-18 - Optimizing DataTable re-renders in Contacts Page
**Learning:** Found an issue where the `DataTable` component in `ContactsPage` was receiving a new `columns` array reference on every render, leading to potential unnecessary re-renders of the entire table and its cells. In React, passing non-memoized objects or arrays as props to child components breaks their ability to skip re-renders effectively, even if the child uses `React.memo` or internal memoization.
**Action:** Wrap the column definitions array with `useMemo` with an empty dependency array `[]` so that the reference stays the same across renders. This should be a standard practice for all DataTables and similar components receiving static configuration objects/arrays.
