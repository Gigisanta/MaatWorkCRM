<<<<<<< HEAD
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import React from "react";
=======
import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

<<<<<<< HEAD
export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
=======
export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-white/5 bg-[#0F0F0F] overflow-hidden backdrop-blur-3xl shadow-lg">
      <div className="w-full overflow-auto">
        <table className="w-full text-left border-collapse text-sm font-body">
          <thead className="bg-[#18181B] border-b border-white/5">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className="h-12 px-4 text-left align-middle font-semibold text-[#A3A3A3] uppercase tracking-wider text-xs whitespace-nowrap"
                    >
<<<<<<< HEAD
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
=======
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
<<<<<<< HEAD
                <tr key={row.id} className="hover:bg-white/5 transition-colors cursor-pointer group">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 align-middle text-[#F5F5F5] group-hover:text-white">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
=======
                <tr
                  key={row.id}
                  className="hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-4 align-middle text-[#F5F5F5] group-hover:text-white"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
<<<<<<< HEAD
                <td colSpan={columns.length} className="h-24 text-center text-[#737373]">
=======
                <td
                  colSpan={columns.length}
                  className="h-24 text-center text-[#737373]"
                >
>>>>>>> origin/feat/maatwork-redesign-jules-v2-6433543738996844966
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
