# Implementing a Data Table with Dynamic Filters

In this article, we will learn how to implement a **Data Table** with dynamic filters, pagination, and sorting using a powerful combination of tools such as **TanStack Router**, **TanStack Query**, **TanStack Table**, and **Shadcn/UI**. We’ll also see how to generate fake data to populate the table and manage filters via URL parameters, enabling a smooth and interactive user experience.

## Required Libraries

Before we begin, make sure the following libraries are installed in your project:

- `TypeScript`: For static and robust typing.
- `React`: JavaScript library for building user interfaces.
- `Vite`: A fast and efficient build tool for web development.
- `TanStack Query`: Library for managing asynchronous data.
- `TanStack Router`: Modern routing solution for React.
- `TanStack Table`: Highly customizable table library for handling data.
- `Zod`: Library for data validation in TypeScript.
- `Shadcn/UI`: A set of pre-built components for interface development.

### GitHub Repository

If you want to explore the code, check out the project repository on `GitHub`: [Table-use-case](https://github.com/LeonardoSarmento/table-use-case)

## Generating Fake Data

To populate the table, we will use **@faker-js/faker** to generate fake data. We will create 1000 task records with fields determined in the `Task` type. This will simulate real data in a task management application.

In `src/services/types/Task.ts`, we create a schema for **Tasks** using `Zod`:

```ts
import { z } from 'zod';

export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  label: z.string(),
  status: z.string().array(),
  priority: z.string().array(),
});

export type Task = z.infer<typeof taskSchema>;
```

For the predefined value properties, we can create `src/constants/options.tsx`:

```ts
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from '@radix-ui/react-icons';

export const labels = [
  {
    value: 'bug',
    label: 'Bug',
  },
  {
    value: 'feature',
    label: 'Feature',
  },
  {
    value: 'documentation',
    label: 'Documentation',
  },
];

export const statuses = [
  {
    value: 'backlog',
    label: 'Backlog',
    icon: QuestionMarkCircledIcon,
  },
  {
    value: 'todo',
    label: 'Todo',
    icon: CircleIcon,
  },
  {
    value: 'in progress',
    label: 'In Progress',
    icon: StopwatchIcon,
  },
  {
    value: 'done',
    label: 'Done',
    icon: CheckCircledIcon,
  },
  {
    value: 'canceled',
    label: 'Canceled',
    icon: CrossCircledIcon,
  },
];

export const priorities = [
  {
    label: 'Low',
    value: 'low',
    icon: ArrowDownIcon,
  },
  {
    label: 'Medium',
    value: 'medium',
    icon: ArrowRightIcon,
  },
  {
    label: 'High',
    value: 'high',
    icon: ArrowUpIcon,
  },
];
```

---

### Code for Data Generation

```ts
import { faker } from '@faker-js/faker';
import { Filters, PaginatedData } from './types';
import { priorities, statuses } from '@/constants/options';
import { Task } from '@services/types/Task';

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 10;

export type TaskFilters = Filters<Task>;

function makeData(amount: number): Task[] {
  return Array(amount)
    .fill(0)
    .map((_, index) => ({
      id: index + 1,
      label: faker.word.words(5),
      title: faker.word.words(5),
      priority: [faker.helpers.arrayElement(priorities).value],
      status: [faker.helpers.arrayElement(statuses).value],
    }));
}

const data = makeData(1000);
```

## Function to Fetch Tasks with Filters and Pagination

The `fetchTasks` function will apply filters, sorting, and pagination to the generated data, returning only the necessary subset of data based on the provided parameters.

### Code for Filters and Pagination

```ts
export async function fetchTasks(filtersAndPagination: TaskFilters): Promise<PaginatedData<Task>> {
  const { pageIndex = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, sortBy, ...filters } = filtersAndPagination;
  const requestedData = data.slice();

  // Sorting
  if (sortBy) {
    const [field, order] = sortBy.split('.');
    requestedData.sort((a, b) => {
      const aValue = a[field as keyof Task];
      const bValue = b[field as keyof Task];

      if (aValue === bValue) return 0;
      return order === 'asc' ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
    });
  }

  // Filtering
  const filteredData = requestedData.filter((task) => {
    return Object.keys(filters).every((key) => {
      const filter = filters[key as keyof Task];
      if (filter === undefined || filter === '') return true;

      const value = task[key as keyof Task];

      if (key === 'status' || key === 'priority') {
        if (Array.isArray(filter)) {
          if (filter.length === 0) return true;
          return Array.isArray(value) ? value.some((val) => filter.includes(val)) : filter.includes(value as string);
        }
        return false;
      }

      if (typeof value === 'string') return value.toLowerCase().includes(`${filter}`.toLowerCase());
      if (typeof value === 'number') return value === +filter;

      return true;
    });
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    result: filteredData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    rowCount: filteredData.length,
  };
}
```

## Defining the Filter and Pagination Types

Here is the generic `Filters` type that we use to combine data filters with pagination and sorting parameters.

### Code for the `Filters` Type

```ts
import { PaginationState } from '@tanstack/react-table';

export type PaginatedData<T> = {
  result: T[];
  rowCount: number;
};

export type PaginationParams = PaginationState;
export type SortParams = { sortBy: `${string}.${'asc' | 'desc'}` };
export type Filters<T> = Partial<T & PaginationParams & SortParams>;
```

## Data Table Component

Next, we create the `DataTableExample` component responsible for displaying data, applying pagination, filters, and providing sorting functionality. We use **TanStack Table** to handle the table's behavior.

### Code for `DataTableExample` Component

```tsx
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  OnChangeFn,
  PaginationOptions,
  PaginationState,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DataTablePagination } from './Table/data-table-pagination';
import { DataTableToolbar } from './Table/data-table-toolbar';
import { useState } from 'react';
import { TaskFilters } from '@/api/task';

export const DEFAULT_PAGE_INDEX = 0;
export const DEFAULT_PAGE_SIZE = 10;

type Props<T extends Record<string, string | number | string[]>> = {
  data: T[];
  columns: ColumnDef<T>[];
  pagination: PaginationState;
  paginationOptions: Pick<PaginationOptions, 'onPaginationChange' | 'rowCount'>;
  filters: TaskFilters;
  onFilterChange: (dataFilters: Partial<T>) => void;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
};

export default function DataTableExample<T extends Record<string, string | number | string[]>>({
  data,
  columns,
  pagination,
  paginationOptions,
  sorting,
  onSortingChange,
}: Props<T>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { pagination, sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange,
    ...paginationOptions,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSorted

RowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="m-6 flex flex-col gap-3 rounded-lg border p-2">
      <DataTableToolbar table={table} />
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination table={table} />
    </div>
  );
}
```

Configuring the table's manual pagination component:

`DataTablePagination`

```ts
import { ChevronLeftIcon, ChevronRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

And the `DataTableToolbar` component for managing the filters applied by the user:

```ts
import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DataTableViewOptions } from '@/components/Table/data-table-view-options';
import { priorities, statuses } from '@/constants/options';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DebouncedInput } from '../debouncedInput';
import { TaskFilters } from '@/api/task';
import { useNavigate } from '@tanstack/react-router';
import { useFilters } from '@services/hooks/useFilters';
import { Route } from '@/routes/shadcnTable';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const { filters, setFilters } = useFilters(Route.fullPath);
  const isFiltered =
    Object.keys(filters).filter((filter) => filter !== 'pageSize' && filter !== 'pageIndex').length > 0;
  const fieldMeta = table.getColumn('title')?.columnDef.meta;
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {table.getColumn('title')?.getCanFilter() && fieldMeta?.filterKey !== undefined ? (
          <DebouncedInput
            className="h-8 w-[150px] rounded border shadow lg:w-[250px]"
            onChange={(value) => {
              setFilters({
                [fieldMeta.filterKey as keyof TaskFilters]: value,
              } as Partial<TData>);
            }}
            onClick={(e) => e.stopPropagation()}
            type={fieldMeta.filterVariant === 'number' ? 'number' : 'text'}
            placeholder="Search a task by title..."
            value={(filters[fieldMeta.filterKey as keyof TaskFilters] as string) ?? ''}
          />
        ) : null}
        {table.getColumn('status') && (
          <DataTableFacetedFilter column={table.getColumn('status')} title="Status" options={statuses} />
        )}
        {table.getColumn('priority') && (
          <DataTableFacetedFilter column={table.getColumn('priority')} title="Priority" options={priorities} />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() =>
              navigate({
                to: '.',
                search: { pageIndex: filters.pageIndex, pageSize: filters.pageSize },
              })
            }
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
```

To provide a set of pre-determined filter options in `DataTableToolbar`, the `DataTableFacetedFilter` component is configured as follows:

```ts
import * as React from 'react';
import { CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useFilters } from '@services/hooks/useFilters';
import { Filters } from '@/api/types';
import { Route } from '@/routes/shadcnTable';

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
}
function isFilterKey<T>(key: any, filters: Filters<T>): key is keyof Filters<T> {
  return key in filters;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues();
  // Custom facets if keys is array then sum the equal value and remove duplicate
  const customFacets = new Map();
  for (const [key, value] of facets as any) {
    if (Array.isArray(key)) {
      for (const k of key) {
        const prevValue = customFacets.get(k) || 0;
        customFacets.set(k, prevValue + value);
      }
    } else {
      const prevValue = customFacets.get(key) || 0;
      customFacets.set(key, prevValue + value);
    }
  }
  const { filters, setFilters } = useFilters(Route.fullPath);

  const filterKey = column?.id as string;

  const filterValues =
    isFilterKey(filterKey, filters) && Array.isArray(filters[filterKey]) ? (filters[filterKey] as string[]) : [];

  const [selectedValues, setSelectedValues] = React.useState(new Set(filterValues));

  React.useEffect(() => {
    setSelectedValues(new Set(filterValues));
  }, [filters, column?.id]);

  const handleSelect = (value: string) => {
    setSelectedValues((prev) => {
      const newSelectedValues = new Set(prev);
      if (newSelectedValues.has(value)) {
        newSelectedValues.delete(value);
      } else {
        newSelectedValues.add(value);
      }
      const filterValues = Array.from(newSelectedValues);
      setFilters({ [column?.id as string]: filterValues.length ? filterValues : undefined });
      return newSelectedValues;
    });
  };

  const handleClearFilters = () => {
    setSelectedValues(new Set());
    setFilters({ [column?.id as string]: [] });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge variant="secondary" key={option.value} className="rounded-sm px-1 font-normal">
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <CheckIcon className={cn('h-4 w-4')} />
                    </div>
                    {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span>{option.label}</span>
                    <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                      {customFacets.get(option.value)}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={handleClearFilters} className="justify-center text-center">
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

```

## Configuring TanStack Router and Query for the Data Table

Now let's configure **TanStack Router** and **TanStack Query** to load filtered and paginated data dynamically based on URL parameters.

### Data Table Column Definitions

Defining columns in a **Data Table** is crucial for structuring how data is presented and managed. In the context of **TanStack Table**, each column is configured with different properties like `accessorKey`, `header`, `cell`, and custom filter and sorting functions. Let's break down the `Selection`, `Status`, and `Actions` columns in this example implementation.

### General Column Structure

The columns are defined using the `ColumnDef<T>` type, where `T` is the type of data the table handles. In our case, we are using the `Task` type, which contains fields such as `id`, `title`, `status`, and `priority`. Here is the complete structure of our column definitions:

```ts
import { ColumnDef } from '@tanstack/react-table';
import { labels, priorities, statuses } from '@/constants/options';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@services/types/Task';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';

export const columnsExample: ColumnDef<Task>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Task" />,
    cell: ({ row }) => <div className="w-[80px]">{row.getValue('id')}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => {
      const label = labels.find((label) => label.value === row.original.label);

      return (
        <div className="flex space-x-2">
          {label && <Badge variant="outline">{label.label}</Badge>}
          <span className="max-w-[500px] truncate font-medium">{row.getValue('title')}</span>
        </div>
      );
    },
    meta: { filterKey: 'title' },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const statusArray = row.getValue('status') as string[];
      const status = statuses.find((status) => statusArray.includes(status.value));

      if (!status) {
        return null;
      }

      return (
        <div className="flex w-[100px] items-center">
          {status.icon && <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
          <span>{status.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id) as string[];
      return value.some((v: string) => rowValue.includes(v));
    },
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
    cell: ({ row }) => {
      const priorityArray = row.getValue('priority') as string[];
      const priority = priorities.find((priority) => priorityArray.includes(priority.value));

      if (!priority) {
        return null;
      }

      return (
        <div className="flex items-center">
          {priority.icon && <priority.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
          <span>{priority.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id) as string[];
      return value.some((v: string) => rowValue.includes(v));
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
];
```

Each column has properties such as `header` (to define the header), `cell` (to render the content of each cell), and optionally, filter and sorting functions.

### Selection Column (`id: 'select'`)

This column allows row selection in the table, useful for bulk actions like deleting or editing multiple items at once. It uses a **checkbox** in both the header and cells to select all or individual rows.

- **Header (`header`)**: Displays a checkbox that selects all visible rows.
- **Cell (`cell`)**: Checkbox for individually selecting each row.
- **Other Settings**: `enableSorting` and `enableHiding` are disabled since selection does not require sorting or dynamic visibility.

```ts
{
  id: 'select',
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
      className="translate-y-[2px]"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
      className="translate-y-[2px]"
    />
  ),
  enableSorting: false,
  enableHiding: false,
}
```

### Status Column (`accessorKey: 'status'`)

This column displays the task status, with associated icons and text.

- **Header**: Uses `DataTableColumnHeader` to display the title "Status".
- **Cell**: Displays the status icon and name.
- **Filter Function**: Allows filtering tasks based on multiple statuses. The `filterFn` function compares the user-selected statuses with the task's status.

```ts
{
  accessorKey: 'status',
  header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
  cell: ({ row }) => {
    const statusArray = row.getValue('status') as string[];
    const status = statuses.find((status) => statusArray.includes(status.value));

    if (!status) return null;

    return (
      <div className="flex w-[100px] items-center">
        {status.icon && <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
        <span>{status.label}</span>
      </div>
    );
  },
  filterFn: (row, id, value) => {
    const rowValue = row.getValue(id) as string[];
    return value.some((v: string) => rowValue.includes(v));
  },
}
```

To enable **sorting** functionality in the column headers, we created the following component `DataTableColumnHeader`:

```ts
import { ArrowDownIcon, ArrowUpIcon, CaretSortIcon, EyeNoneIcon } from '@radix-ui/react-icons';
import { Column } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
            <span>{title}</span>
            {column.getIsSorted() === 'desc' ? (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'asc' ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <CaretSortIcon className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpIcon className="mr-2 h-3

.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeNoneIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

### Actions Column (`id: 'actions'`)

The last column is the actions column, which allows performing actions such as editing or deleting the task.

- **Cell**: Renders the action buttons using the `DataTableRowActions` component.

```ts
{
  id: 'actions',
  cell: ({ row }) => <DataTableRowActions row={row} />,
}
```

The **DataTableRowActions** component is created as follows:

```ts
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { taskSchema } from '@services/types/Task';
import { labels } from '@/constants/options';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export function DataTableRowActions<TData>({ row }: DataTableRowActionsProps<TData>) {
  const task = taskSchema.parse(row.original);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Make a copy</DropdownMenuItem>
        <DropdownMenuItem>Favorite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={task.label}>
              {labels.map((label) => (
                <DropdownMenuRadioItem key={label.value} value={label.value}>
                  {label.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### Code for the `shadcnTable` Route

After creating all the necessary components and settings for the Data Table using `Shadcn/ui`, along with managing filter states via URL parameters, we can use the Data Table in the desired route:

```tsx
import { useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchTasks, TaskFilters } from '@/api/task';
import { Button } from '@/components/ui/button';
import DataTableExample from '@/components/table-example';
import { DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE } from '@/components/table';
import { columnsExample } from '@/components/Table/columns-example';
import { useFilters } from '@services/hooks/useFilters';
import { sortByToState, stateToSortBy } from '@services/utils/tableSortMapper';

export const Route = createFileRoute('/shadcnTable')({
  validateSearch: () => ({}) as TaskFilters,
  component: DataTableComponent,
});

function DataTableComponent() {
  const { filters, resetFilters, setFilters } = useFilters(Route.fullPath);

  const { data } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
    placeholderData: keepPreviousData,
  });

  const paginationState = {
    pageIndex: filters.pageIndex ?? DEFAULT_PAGE_INDEX,
    pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
  };
  const sortingState = sortByToState(filters.sortBy);
  const columns = useMemo(() => columnsExample, []);

  return (
    <>
      <DataTableExample
        data={data?.result ?? []}
        columns={columns}
        pagination={paginationState}
        paginationOptions={{
          onPaginationChange: (pagination) => {
            setFilters(typeof pagination === 'function' ? pagination(paginationState) : pagination);
          },
          rowCount: data?.rowCount,
        }}
        filters={filters}
        onFilterChange={(filters) => setFilters(filters)}
        sorting={sortingState}
        onSortingChange={(updaterOrValue) => {
          const newSortingState = typeof updaterOrValue === 'function' ? updaterOrValue(sortingState) : updaterOrValue;
          return setFilters({ sortBy: stateToSortBy(newSortingState) });
        }}
      />
      <button onClick={resetFilters}>Reset Filters</button>
      <pre>{JSON.stringify(filters, null, 2)}</pre>
    </>
  );
}
```

## Conclusion

With this implementation, you now have a fully functional **Data Table** with dynamic filters, sorting, and pagination, using **TanStack Router**, **TanStack Query**, and **TanStack Table**. This setup allows filters and pagination to be managed directly via URL parameters, providing a consistent and intuitive user experience, as well as a fast and efficient interface for handling large volumes of data.

#### Check out more projects by visiting my [`portfolio`](https://leoasarmento.com/).

### Hugs from your Leo Sarmento and see you next time!
