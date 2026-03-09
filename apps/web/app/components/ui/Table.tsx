// UI/UX REFINED BY JULES v2
import { type ColumnDef, type TableMeta, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: TData) => void;
  meta?: TableMeta<TData>;
}

export function DataTable<TData, TValue>({ columns, data, onRowClick, meta }: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    meta,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border border-white/5 bg-[#0F0F0F] overflow-hidden shadow-lg">
      <div className="w-full overflow-auto">
        <table className="w-full text-left border-collapse text-sm font-body">
          <thead className="bg-[#18181B] border-b border-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className="h-10 px-3 text-left align-middle font-semibold text-[#A3A3A3] uppercase tracking-wider text-xs whitespace-nowrap"
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={
                    onRowClick
                      ? "hover:bg-white/5 transition-colors cursor-pointer group"
                      : "hover:bg-white/5 transition-colors group"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-2 px-3 align-middle text-[#F5F5F5] group-hover:text-white">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-[#737373]">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
