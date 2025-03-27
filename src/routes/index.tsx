import { createFileRoute } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { faker } from "@faker-js/faker";
import { MailIcon, User2Icon } from "lucide-react";
import {
  dataTableFiltersRegistry,
  useDataTableFiltersDef,
} from "@/components/ui/data-table-filters/use-data-table-filters";
import { FilterContainer } from "@/components/ui/data-table-filters/filter-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: App,
});

type TableRecord = {
  fullName: string;
  email: string;
};

const data = makeData();

function makeData(count = 100): TableRecord[] {
  return Array.from({ length: count }, () => ({
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
  }));
}

const columns: ColumnDef<TableRecord>[] = [
  {
    header: "Full Name",
    accessorKey: "fullName",
    meta: {
      filter: {
        icon: User2Icon,
        label: "Full Name",
        type: "option",
      },
    },
  },
  {
    header: "Email",
    accessorKey: "email",
    meta: {
      filter: {
        icon: MailIcon,
        label: "Email",
        type: "option",
      },
    },
  },
];

function App() {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const filters = useDataTableFiltersDef({ table });

  return (
    <div className="container mx-auto p-4 space-y-4">
      <FilterContainer filters={filters} registry={dataTableFiltersRegistry} />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
