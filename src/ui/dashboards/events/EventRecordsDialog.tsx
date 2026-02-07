"use client";

import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/primitives/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/primitives/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/primitives/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/primitives/table";

export type EventRecord = {
  id?: string | null;
  interviewer?: string | null;
  east?: number | null;
  north?: number | null;
  signature?: string | null;
  latitude: number | null;
  longitude: number | null;
  candidate?: string | null;
  name?: string | null;
  phone?: string | null;
  createdAt?: string | null;
};

type EventRecordsDialogProps = {
  rows: EventRecord[];
  title: string;
  triggerLabel: string;
  filterCandidate?: string | null;
  candidateOptions?: string[];
  onDelete?: (record: EventRecord) => void;
  onEdit?: (record: EventRecord) => void;
  onFocusPoint?: (record: EventRecord) => void;
  buildDeleteUrl?: (id: string) => string;
  mutate?: any;
};

type EditFormState = {
  candidate: string;
  name: string;
  phone: string;
};

const pageSizeOptions = [10, 20, 50];

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const downloadCSV = (rows: EventRecord[]): void => {
  if (rows.length === 0) return;
  
  const headers = [
    "ID",
    "Entrevistador",
    "Candidato",
    "Nombre",
    "Teléfono",
    "Firma",
    "Este (UTM)",
    "Norte (UTM)",
    "Latitud",
    "Longitud",
    "Fecha"
  ];
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => [
      row.id || "",
      row.interviewer || "",
      row.candidate || "",
      row.name || "",
      row.phone || "",
      row.signature || "",
      row.east || "",
      row.north || "",
      row.latitude || "",
      row.longitude || "",
      row.createdAt || ""
    ].map(field => `"${field}"`).join(","))
  ].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `registros_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const EditRecordDialog = ({
  record,
  candidateOptions,
  onEdit,
}: {
  record: EventRecord;
  candidateOptions: string[];
  onEdit?: (record: EventRecord) => void;
}) => {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<EditFormState>({
    candidate: record.candidate ?? "",
    name: record.name ?? "",
    phone: record.phone ?? "",
  });

  React.useEffect(() => {
    if (!open) return;
    setForm({
      candidate: record.candidate ?? "",
      name: record.name ?? "",
      phone: record.phone ?? "",
    });
  }, [open, record]);

  const handleSave = () => {
    if (!record.id || !onEdit) return;
    onEdit({
      ...record,
      candidate: form.candidate.trim(),
      name: form.name.trim(),
      phone: form.phone.trim(),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={!record.id}>
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-lg bg-background text-foreground">
        <DialogHeader>
          <DialogTitle>Editar registro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor={`record-candidate-${record.id ?? "new"}`}
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Candidato
            </label>
            <Select
              value={form.candidate}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  candidate: value,
                }))
              }
            >
              <SelectTrigger id={`record-candidate-${record.id ?? "new"}`} className="w-full">
                <SelectValue placeholder="Selecciona candidato" />
              </SelectTrigger>
              <SelectContent>
                {candidateOptions.map((candidate) => (
                  <SelectItem key={candidate} value={candidate}>
                    {candidate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`record-name-${record.id ?? "new"}`}
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Nombre
            </label>
            <Input
              id={`record-name-${record.id ?? "new"}`}
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                }))
              }
              placeholder="Nombre completo"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor={`record-phone-${record.id ?? "new"}`}
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Telefono
            </label>
            <Input
              id={`record-phone-${record.id ?? "new"}`}
              value={form.phone}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  phone: event.target.value,
                }))
              }
              placeholder="Telefono"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!record.id || !form.name.trim() || !form.phone.trim()}
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const EventRecordsDialog = ({
  rows,
  title,
  triggerLabel,
  filterCandidate,
  candidateOptions = [],
  onDelete,
  onEdit,
  onFocusPoint,
}: EventRecordsDialogProps) => {
  const [open, setOpen] = React.useState(false);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [candidateFilter, setCandidateFilter] = React.useState<string>("all");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const allCandidates = React.useMemo(() => {
    const items = new Set<string>();
    for (const candidate of candidateOptions) {
      items.add(candidate);
    }
    for (const row of rows) {
      if (row.candidate) items.add(row.candidate);
    }
    return Array.from(items);
  }, [candidateOptions, rows]);

  const handleFocusPoint = React.useCallback(
    (record: EventRecord) => {
      if (!onFocusPoint) return;
      if (record.latitude === null || record.longitude === null) return;
      onFocusPoint(record);
      setOpen(false);
    },
    [onFocusPoint],
  );

  const filteredRows = React.useMemo(() => {
    const query = globalFilter.trim().toLowerCase();
    return rows.filter((row) => {
      if (candidateFilter !== "all" && row.candidate !== candidateFilter) return false;
      if (!query) return true;
      return (
        row.candidate?.toLowerCase().includes(query) ||
        row.name?.toLowerCase().includes(query) ||
        row.phone?.toLowerCase().includes(query)
      );
    });
  }, [rows, candidateFilter, globalFilter]);

  const columns = React.useMemo<ColumnDef<EventRecord>[]>(
    () => [
      {
        accessorKey: "candidate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Candidato
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm font-semibold text-foreground">
            {row.getValue("candidate") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Nombre
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("name") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Telefono
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("phone") || "-"}
          </span>
        ),
      },
      {
        accessorKey: "east",
        header: "Este (UTM)",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("east") ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "north",
        header: "Norte (UTM)",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.getValue("north") ?? "-"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2"
          >
            Fecha
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.getValue("createdAt"))}
          </span>
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const timeA = rowA.getValue<string | null>(columnId)
            ? new Date(rowA.getValue<string>(columnId)).getTime()
            : 0;
          const timeB = rowB.getValue<string | null>(columnId)
            ? new Date(rowB.getValue<string>(columnId)).getTime()
            : 0;
          return timeA - timeB;
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="block text-right text-xs uppercase tracking-[0.2em]">Acciones</span>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            {onFocusPoint ? (
              <Button
                size="sm"
                variant="outline"
                disabled={row.original.latitude === null || row.original.longitude === null}
                onClick={() => handleFocusPoint(row.original)}
              >
                Centrar
              </Button>
            ) : null}
            {onEdit ? (
              <EditRecordDialog
                record={row.original}
                candidateOptions={allCandidates}
                onEdit={onEdit}
              />
            ) : null}
            {onDelete ? (
              <Button
                size="sm"
                variant="destructive"
                disabled={!row.original.id}
                onClick={() => onDelete(row.original)}
              >
                Eliminar
              </Button>
            ) : null}
          </div>
        ),
        enableSorting: false,
      },
    ],
    [allCandidates, handleFocusPoint, onDelete, onEdit, onFocusPoint],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  React.useEffect(() => {
    if (!open) return;
    setGlobalFilter("");
    setSorting([]);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setCandidateFilter(filterCandidate ?? "all");
  }, [open, filterCandidate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[86vh] w-[96vw] max-w-none bg-background text-foreground sm:max-w-none">
        <div className="flex h-full flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-[260px]">
              <label
                htmlFor={`records-search-${filterCandidate ?? "all"}`}
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Buscar
              </label>
              <Input
                id={`records-search-${filterCandidate ?? "all"}`}
                value={globalFilter}
                onChange={(event) => {
                  setGlobalFilter(event.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                placeholder="Nombre, telefono o candidato"
                className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadCSV(filteredRows)}
                disabled={filteredRows.length === 0}
              >
                Descargar CSV ({filteredRows.length})
              </Button>
              {filterCandidate ? (
                <span className="rounded-full border border-border/60 px-2 py-1 text-[0.65rem] uppercase tracking-wide">
                  {filterCandidate}
                </span>
              ) : (
                <Select
                  value={candidateFilter}
                  onValueChange={(value) => {
                    setCandidateFilter(value);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Candidato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {allCandidates.map((candidate) => (
                      <SelectItem key={candidate} value={candidate}>
                        {candidate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table
                    .getAllLeafColumns()
                    .filter((column) => column.id !== "actions")
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex-1 overflow-hidden rounded-2xl border border-border/60">
            <div className="h-full overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background/95 backdrop-blur">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={header.column.id === "actions" ? "text-right" : undefined}
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
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={table.getAllColumns().length}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Sin registros para este filtro.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="border-border/60 hover:bg-muted/40">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cell.column.id === "actions" ? "py-4 text-right" : "py-4"}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Mostrando {table.getRowModel().rows.length} de {filteredRows.length}
            </span>
            <div className="flex items-center gap-2">
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) =>
                  setPagination((prev) => ({
                    ...prev,
                    pageIndex: 0,
                    pageSize: Number(value),
                  }))
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Filas" />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size} filas
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="ghost"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                Anterior
              </Button>
              <span>
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
