# Implementando uma Data Table com Filtros Dinâmicos

Neste artigo, vamos aprender como implementar uma **Data Table** completa com filtros dinâmicos, paginação e ordenação, utilizando uma combinação de ferramentas poderosas como **TanStack Router**, **TanStack Query**, **TanStack Table**, e **Shadcn/UI**. Também veremos como gerar dados fictícios para popular a tabela e como fazer o gerenciamento de filtros via parâmetros de URL, permitindo a criação de uma experiência de usuário fluida e interativa.

## Bibliotecas Utilizadas

Antes de começarmos, certifique-se de que as seguintes bibliotecas estão instaladas em seu projeto:

- `TypeScript`: Para tipagem estática e robusta.
- `React`: Biblioteca JavaScript para construção de interfaces de usuário.
- `Vite`: Ferramenta de build rápida e eficiente para desenvolvimento web.
- `TanStack Query`: Biblioteca para gerenciamento de dados assíncronos.
- `TanStack Router`: Solução moderna para roteamento em React.
- `TanStack Table`: Biblioteca altamente customizável para tabelas de dados.
- `Zod`: Biblioteca para validação de dados em TypeScript.
- `Shadcn/UI`: Conjunto de componentes prontos para construção de interfaces.

### Github do Repositório

Caso queira explorar o código, o repositório do projeto no `Github`: [Table-use-case](https://github.com/LeonardoSarmento/table-use-case)

## Geração de Dados Fakes

Para popular a tabela, vamos utilizar o **@faker-js/faker** para gerar dados fictícios. Vamos criar 1000 registros de tarefas com campos determinados na tipagem para `Taks`. Isso simulará dados reais em uma aplicação de tarefas.

Em `src/services/types/Task.ts` iremos criar um schema para **Tasks** utilizando o `Zod`:

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

E para as propriedades de valor pré-determinadas podemos criar em `src/constants/options.tsx`:

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

### Código para Geração de Dados

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

## Função para Buscar Tarefas com Filtros e Paginação

A função `fetchTasks` será responsável por aplicar filtros, ordenação e paginação aos dados gerados, retornando apenas o subconjunto de dados necessário com base nos parâmetros fornecidos.

### Código para Filtros e Paginação

```ts
export async function fetchTasks(filtersAndPagination: TaskFilters): Promise<PaginatedData<Task>> {
  const { pageIndex = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, sortBy, ...filters } = filtersAndPagination;
  const requestedData = data.slice();

  // Ordenação
  if (sortBy) {
    const [field, order] = sortBy.split('.');
    requestedData.sort((a, b) => {
      const aValue = a[field as keyof Task];
      const bValue = b[field as keyof Task];

      if (aValue === bValue) return 0;
      if (order === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });
  }

  // Filtragem
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

## Definindo os Tipos de Filtros e Paginação

Aqui está o tipo genérico `Filters` que usamos para combinar os filtros dos dados com os parâmetros de paginação e ordenação.

### Código do Tipo `Filters`

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

## Componente da Data Table

A seguir, criamos o componente `DataTableExample` que será responsável por exibir os dados, aplicar a paginação e os filtros, e fornecer a funcionalidade de ordenação. Usamos o **TanStack Table** para gerenciar o comportamento da tabela.

### Código do Componente `DataTableExample`

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
    getSortedRowModel: getSortedRowModel(),
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

Configurando o componente de paginação manual da tabela:

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

E o componente `DataTableToolbar` para gerenciamento dos filtros aplicados pelo usuário:

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

Incluído no componente `DataTableToolbar`, caso exista uma opção de filtragem em que se deseja passar uma quantidade pré-determinada de opção a serem disponibilizadas, existe o componente `DataTableFacetedFilter` que possui a seguinte configuração:

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

## Configurando o TanStack Router e Query para o Data Table

Agora vamos configurar o **TanStack Router** e o **TanStack Query** para carregar os dados filtrados e paginados dinamicamente, com base nos parâmetros da URL.

### Definição das Colunas da Data Table

A definição das colunas em uma **Data Table** é crucial para estruturar a maneira como os dados serão apresentados e manipulados. No contexto do **TanStack Table**, cada coluna é configurada com diferentes propriedades, como `accessorKey`, `header`, `cell`, e funções de filtro e ordenação personalizadas. A seguir, vamos detalhar sobre a coluna de `Seleção`, `Status` e `Ações` coluna do exemplo de implementação.

### Estrutura Geral das Colunas

As colunas são definidas usando o tipo `ColumnDef<T>`, onde `T` é o tipo de dado que a tabela manipula. No caso da nossa tabela, estamos utilizando o tipo `Task`, que contém campos como `id`, `title`, `status`, e `priority`. Aqui está a estrutura completa da nossa definição de colunas:

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

Cada coluna tem propriedades como `header` (para definir o cabeçalho), `cell` (para renderizar o conteúdo de cada célula) e, opcionalmente, funções de filtro e ordenação.

### Coluna de Seleção (`id: 'select'`)

Esta coluna permite a seleção de linhas na tabela, útil para ações em massa, como excluir ou editar múltiplos itens ao mesmo tempo. Ela usa um **checkbox** tanto no cabeçalho quanto nas células para selecionar todos ou selecionar individualmente as linhas.

- **Cabeçalho (`header`)**: Exibe um checkbox que seleciona todas as linhas da página visível.
- **Célula (`cell`)**: Checkbox para selecionar individualmente cada linha.
- **Outras Configurações**: `enableSorting` e `enableHiding` estão desativados, pois a seleção não precisa de ordenação ou visibilidade dinâmica.

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

### Coluna de Status (`accessorKey: 'status'`)

Essa coluna exibe o status da tarefa, com ícones e textos associados.

- **Cabeçalho**: Usa `DataTableColumnHeader` para exibir o título "Status".
- **Célula**: Exibe o ícone e o nome do status da tarefa.
- **Função de Filtro**: Permite filtrar tarefas com base em múltiplos status. A função `filterFn` compara os status selecionados pelo usuário com o status da tarefa.

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

Para configurar as funcionalidades de **Ordenação** no cabeçalho das colunas, foi criado o seguinte componente `DataTableColumnHeader`:

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
            <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
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

### Coluna de Ações (`id: 'actions'`)

A última coluna é a coluna de ações, que permite realizar ações como editar ou excluir a tarefa.

- **Célula**: Renderiza os botões de ação usando o componente `DataTableRowActions`.

```ts
{
  id: 'actions',
  cell: ({ row }) => <DataTableRowActions row={row} />,
}
```

Sendo o componente **DataTableRowActions** criado da seguinte forma:

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
  DropdownMenuShortcut,
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

### Código da rota `shadcnTable`

Após criar todos os componentes e configurações necessárias para a criação do Data Table utilizando os componentes do `Shadcn/ui` com as funcionalidades de gerenciar o estado dos filtros através dos parâmetros de URL. Podemos utilizar a Data Table na rota de desejo:

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

## Conclusão

Com essa implementação, você agora possui uma **Data Table** completa com filtros dinâmicos, ordenação e paginação, usando **TanStack Router**, **TanStack Query** e **TanStack Table**. Este setup permite que os filtros e a paginação sejam gerenciados diretamente via parâmetros da URL, oferecendo uma experiência de usuário consistente e intuitiva, além de uma interface rápida e eficiente para manipulação de grandes volumes de dados.

#### Confira mais projetos visitando meu [`portfolio`](https://leoasarmento.com/).

### Abraços do seu Leo Sarmento e até a próxima!

---
