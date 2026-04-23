/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DataTableProps<TData> = {
  // TanStack column defs commonly mix value types across accessors.
  // This wrapper intentionally accepts that heterogeneity.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<TData, any>[];
  data: TData[];
  emptyMessage?: string;
  getRowId?: (originalRow: TData, index: number, parent?: { id: string }) => string;
  stickyHeader?: boolean;
  maxBodyHeight?: number | string;
  pagination?: {
    enabled?: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
  };
};

export function DataTable<TData>({
  columns,
  data,
  emptyMessage = "No rows to display.",
  getRowId,
  stickyHeader = false,
  maxBodyHeight,
  pagination,
}: DataTableProps<TData>) {
  const paginationEnabled = Boolean(pagination?.enabled);
  const initialPageSize = pagination?.pageSize ?? 10;
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  useEffect(() => {
    setPaginationState((current) =>
      current.pageSize === initialPageSize ? current : { ...current, pageSize: initialPageSize, pageIndex: 0 }
    );
  }, [initialPageSize]);

  useEffect(() => {
    if (!paginationEnabled) {
      return;
    }

    const maxPageIndex = Math.max(0, Math.ceil(data.length / Math.max(1, paginationState.pageSize)) - 1);
    if (paginationState.pageIndex > maxPageIndex) {
      setPaginationState((current) => ({ ...current, pageIndex: maxPageIndex }));
    }
  }, [data.length, paginationEnabled, paginationState.pageIndex, paginationState.pageSize]);

  const table = useReactTable({
    data,
    columns,
    getRowId,
    ...(paginationEnabled
      ? {
          state: { pagination: paginationState },
          onPaginationChange: setPaginationState,
          getPaginationRowModel: getPaginationRowModel(),
        }
      : {}),
    getCoreRowModel: getCoreRowModel(),
  });

  const pageSizeOptions = useMemo(() => pagination?.pageSizeOptions ?? [5, 10, 20, 50], [pagination?.pageSizeOptions]);
  const showingFrom = paginationEnabled ? paginationState.pageIndex * paginationState.pageSize + 1 : 1;
  const showingTo = paginationEnabled
    ? Math.min(data.length, (paginationState.pageIndex + 1) * paginationState.pageSize)
    : data.length;

  return (
    <div className="space-y-3">
      <div
        className={cn(maxBodyHeight ? "overflow-y-auto rounded-2xl" : undefined)}
        style={
          maxBodyHeight
            ? {
                maxHeight: typeof maxBodyHeight === "number" ? `${maxBodyHeight}px` : maxBodyHeight,
              }
            : undefined
        }
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      stickyHeader ? "sticky top-0 z-20 bg-slate-50/95 supports-[backdrop-filter]:backdrop-blur" : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="py-8 text-center text-muted-foreground" colSpan={columns.length}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {paginationEnabled ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2">
          <p className="text-xs text-slate-500">
            {data.length === 0 ? "No rows" : `Showing ${showingFrom}-${showingTo} of ${data.length}`}
          </p>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500" htmlFor="datatable_page_size">
              Rows
            </label>
            <select
              id="datatable_page_size"
              className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
              value={table.getState().pagination.pageSize}
              onChange={(event) => table.setPageSize(Number(event.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Prev
            </Button>
            <span className="px-1 text-xs text-slate-600">
              {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
