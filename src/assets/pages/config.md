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

Em `src/services/types/User.ts` iremos criar um schema para **Users** utilizando o `Zod`:

```ts
import { z } from 'zod';
import { Filters, PaginatedData } from './FilterExtension';
import { roleSchema } from '../Role';

export const UserTable = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: roleSchema.array(),
  birthday: z.date(),
});

export type UserTableType = z.infer<typeof UserTable>;
export type UserFilters = Filters<UserTableType>;
export type UserRequest = PaginatedData<UserTableType>;
```

E para as propriedades de valor pré-determinadas podemos criar em `src/services/constants/labels.tsx`:

```ts
import { roleSchema } from '@services/types/Role';
import { selectionSchema } from '@services/types/tables/FilterExtension';

export const roles = [
  {
    id: roleSchema.Enum.ADMIN,
    label: 'Administrador',
  },
  {
    id: roleSchema.Enum.OPERATOR,
    label: 'Operador',
  },
];

export const selectionOptions = [
  {
    id: selectionSchema.Enum.SELECTED,
    label: 'Selecionados',
  },
  {
    id: selectionSchema.Enum.NOT_SELECTED,
    label: 'Não selecionados',
  },
];
```

---

### Código para Geração de Dados

```ts
import { faker } from '@faker-js/faker';
import { DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE } from '@services/constants/tables';
import { roleSchema, RolesType } from '@services/types/Role';
import { Filters, PaginatedData } from '@services/types/tables/FilterExtension';
import { UserTableType } from '@services/types/tables/User';

export type UserFilters = Filters<UserTableType>;

function makeData(amount: number): UserTableType[] {
  return Array(amount)
    .fill(0)
    .map((_, index) => {
      return {
        id: index + 1,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        company: faker.company.name(),
        role: [faker.helpers.enumValue(roleSchema.enum)],
        birthday: faker.date.birthdate(),
      };
    });
}

export const fakeUserData = makeData(1000);

export async function fetchUsers(filtersAndPagination: UserFilters): Promise<PaginatedData<UserTableType>> {
  const {
    pageIndex = DEFAULT_PAGE_INDEX,
    pageSize = DEFAULT_PAGE_SIZE,
    sortBy,
    selection,
    selectedIds,
    from,
    to,
    ...filters
  } = filtersAndPagination;
  let requestedData = fakeUserData.slice();

  if (selection) {
    requestedData = requestedData.filter((user) => {
      // Check if we need to include both 'SELECTED' and 'NOT_SELECTED'
      const isSelected = selection.includes('SELECTED'); // 'SELECTED' literal
      const isNotSelected = selection.includes('NOT_SELECTED'); // 'NOT_SELECTED' literal

      // Check if the user's ID is in the selectedIds array (which indicates whether the row is selected or not)
      const isUserSelected = user.id && selectedIds?.includes(user.id);

      // Behavior logic based on selection array:
      if (selection.length === 0) {
        // If the selection array is empty, return both selected and not selected rows
        return true;
      }
      if (isSelected && isUserSelected) {
        // If 'SELECTED' is in the selection and the user is selected, include this user
        return true;
      }
      if (isNotSelected && !isUserSelected) {
        // If 'NOT_SELECTED' is in the selection and the user is not selected, include this user
        return true;
      }
      // If none of the above conditions match, exclude this user
      return false;
    });
  }

  if (sortBy) {
    const [field, order] = sortBy.split('.');
    requestedData.sort((a, b) => {
      const aValue = a[field as keyof Omit<UserTableType, 'selectedIds'>];
      const bValue = b[field as keyof Omit<UserTableType, 'selectedIds'>];

      if (aValue === bValue) return 0;
      if (order === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });
  }

  const filteredData = requestedData.filter((user) => {
    const birthday = new Date(user.birthday);
    birthday.setUTCHours(0, 0, 0, 0); // Zera as horas, minutos, segundos e milissegundos

    // Validar e aplicar os filtros de intervalo de datas
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      // Zerar as horas, minutos, segundos e milissegundos das datas
      fromDate.setUTCHours(0, 0, 0, 0);
      toDate.setUTCHours(23, 59, 59, 999); // Garantir o fim do dia

      // Comparação inclusiva dentro do intervalo
      if (birthday < fromDate || birthday > toDate) {
        return false;
      }
    } else if (from) {
      const fromDate = new Date(from);
      fromDate.setUTCHours(0, 0, 0, 0);
      if (birthday < fromDate) return false;
    } else if (to) {
      const toDate = new Date(to);
      toDate.setUTCHours(23, 59, 59, 999);
      if (birthday > toDate) return false;
    }
    return Object.keys(filters).every((key) => {
      const filter = filters[key as keyof Omit<UserTableType, 'selectedIds'>];
      if (filter === undefined || filter === '') return true;

      const value = user[key as keyof Omit<UserTableType, 'selectedIds'>];

      if (key === 'role') {
        if (Array.isArray(filter)) {
          if (filter.length === 0) return true;
          return Array.isArray(value) ? value.some((val) => filter.includes(val)) : filter.includes(value as RolesType);
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
import { z } from 'zod';

export type PaginatedData<T> = {
  result: T[];
  rowCount: number;
};

export const selectionSchema = z.enum(['SELECTED', 'NOT_SELECTED']);
export type SelectionType = z.infer<typeof selectionSchema>;

export const selectedIds = z.number().array().optional();
export type SelectedIdsType = z.infer<typeof selectedIds>;

export type PaginationParams = PaginationState;
export type SortParams = { sortBy: `${string}.${'asc' | 'desc'}` };
export type SelectionParams = { selection: SelectionType[]; selectedIds: SelectedIdsType };
export type DateParams = { from: Date; to: Date };
export type Filters<T> = Partial<T & PaginationParams & SortParams & DateParams & SelectionParams>;
```

## Componente da Data Table

A seguir, criamos o componente `DataTable` que será responsável por exibir os dados, aplicar a paginação e os filtros, e fornecer a funcionalidade de ordenação. Usamos o **TanStack Table** para gerenciar o comportamento da tabela.

### Código do Componente `DataTable`

```ts
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
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbarProps } from '@services/types/tables/DataTableComponents';
import { Filters, PaginatedData } from '@services/types/tables/FilterExtension';
import { sortByToState, stateToSortBy } from '@services/utils/tableSortMapper';
import { useFilters } from '@services/hooks/useFilters';

export const DEFAULT_PAGE_INDEX = 0;
export const DEFAULT_PAGE_SIZE = 10;

type Props<
  T extends Record<string, string | number | string[] | number[] | Date>,
  R extends RouteIds<RegisteredRouter['routeTree']>,
> = {
  data: PaginatedData<T>;
  columns: ColumnDef<T>[];
  toolbar?: ({ table }: DataTableToolbarProps<T>) => React.JSX.Element;
  routeId: R;
  header?: boolean;
  pagination?: boolean;
  pageselection?: boolean;
  rowcountselection?: boolean;
};

export default function DataTable<
  T extends Record<string, string | number | string[] | number[] | Date>,
  R extends RouteIds<RegisteredRouter['routeTree']>,
>({
  data,
  columns,
  routeId,
  toolbar,
  header = true,
  pagination = true,
  pageselection = true,
  rowcountselection = true,
}: Props<T, R>) {
  const { filters, setFilters } = useFilters<R>(routeId);
  const { pageIndex, pageSize, sortBy } = filters as Filters<T>;
  const paginationState = {
    pageIndex: pageIndex ?? DEFAULT_PAGE_INDEX,
    pageSize: pageSize ?? DEFAULT_PAGE_SIZE,
  };
  const sortingState = sortByToState(sortBy);

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data: data.result ?? [],
    columns,
    state: { pagination: paginationState, sorting: sortingState, columnFilters, columnVisibility, rowSelection },
    onSortingChange: (updaterOrValue) => {
      const newSortingState = typeof updaterOrValue === 'function' ? updaterOrValue(sortingState) : updaterOrValue;
      return setFilters({ sortBy: stateToSortBy(newSortingState) } as typeof filters);
    },
    onPaginationChange: (pagination) => {
      const updater = typeof pagination === 'function' ? pagination(paginationState) : pagination;
      setFilters(updater as typeof filters);
    },
    rowCount: data.rowCount,
    enableRowSelection: true,
    manualPagination: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-2 overflow-scroll">
      {toolbar && toolbar({ table: table })}
      <Table>
        {header ? (
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
        ) : null}
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
                Sem resultados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {pagination ? (
        <DataTablePagination table={table} pageselection={pageselection} rowcountselection={rowcountselection} />
      ) : null}
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
  pageselection?: boolean;
  rowcountselection?: boolean;
}

export function DataTablePagination<TData>({
  table,
  pageselection = true,
  rowcountselection = true,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-2 md:flex-row md:justify-between">
      <div className="min-w-fit flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} linha(s)
        selecionadas.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        {rowcountselection ? <RowCountSelection table={table} /> : null}
        {pageselection ? <PageSelection table={table} /> : null}
      </div>
    </div>
  );
}

interface RowCountSelectionProps<TData> {
  table: Table<TData>;
}
function RowCountSelection<TData>({ table }: RowCountSelectionProps<TData>) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 space-x-2">
      <p className="text-nowrap text-sm font-medium">Linhas por página</p>
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
  );
}
interface RowCountSelectionProps<TData> {
  table: Table<TData>;
}
function PageSelection<TData>({ table }: RowCountSelectionProps<TData>) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <div className="flex w-[150px] lg:w-[100px] items-center overflow-scroll text-nowrap text-sm font-medium">
        Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="flex h-8 w-8 p-0"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Ir para primeira página</span>
          <DoubleArrowLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Anterior</span>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Próximo</span>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="flex h-8 w-8 p-0"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Ir para última página</span>
          <DoubleArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

```

E o componente `DataTableToolbar` para gerenciamento dos filtros aplicados pelo usuário:

```ts
import { Button } from '@components/ui/button';
import { DropdownMenuLabel, DropdownMenuSeparator } from '@components/ui/dropdown-menu';
import { DataTableToolbarProps } from '@services/types/tables/DataTableComponents';
import { Filter } from 'lucide-react';
import { DataTableViewOptions } from './data-table-view-options';
import { useFilters } from '@services/hooks/useFilters';
import { SelectedIdsFacetedFilter } from './selected-faceted-filters';
import { DatePickerWithRange } from './data-table-date-selection';
import { IsColumnFiltered } from '@services/utils/utils';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import React from 'react';
import { Filters } from '@services/types/tables/FilterExtension';
import ResetButton from './ResetButton';
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
import { PopoverClose } from '@radix-ui/react-popover';
import { Cross2Icon } from '@radix-ui/react-icons';

function ToolbarFilter<R extends RouteIds<RegisteredRouter['routeTree']>>({
  routeId,
  inputs,
}: {
  isDropdown?: boolean;
  routeId: R;
  inputs?: React.ReactNode[];
}) {
  const { filters } = useFilters(routeId);
  return (
    <>
      <SelectedIdsFacetedFilter routeId={routeId} />
      {inputs && inputs.length <= 3
        ? inputs.map((input, index) =>
            React.isValidElement(input) ? (
              <React.Fragment key={input.key || `input-${index}`}>
                {React.cloneElement(input, { key: input.key || `input-${index}` })}
              </React.Fragment>
            ) : null,
          )
        : inputs && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 space-x-2 data-[state=open]:bg-muted">
                  <Filter className="h-4 w-4" />
                  <span>Colunas</span>
                  <span className="sr-only">Open menu</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="flex min-w-fit max-w-[225px] flex-col gap-y-2 p-2">
                <div className="flex justify-between">
                  <DropdownMenuLabel>Colunas</DropdownMenuLabel>
                  <PopoverClose>
                    <Cross2Icon />
                  </PopoverClose>
                </div>
                <DropdownMenuSeparator />
                {inputs.map((input, index) =>
                  React.isValidElement(input) ? (
                    <React.Fragment key={input.key || `input-${index}`}>
                      {React.cloneElement(input, { key: input.key || `input-${index}` })}
                    </React.Fragment>
                  ) : null,
                )}
                {IsColumnFiltered(filters as Filters<R>) && <ResetButton routeId={routeId} />}
              </PopoverContent>
            </Popover>
          )}
      <DatePickerWithRange routeId={routeId} />
      {IsColumnFiltered(filters as Filters<R>) && <ResetButton routeId={routeId} />}
    </>
  );
}
function DropdownToolbarFilter<R extends RouteIds<RegisteredRouter['routeTree']>>({
  routeId,
  inputs,
}: {
  isDropdown?: boolean;
  routeId: R;
  inputs?: React.ReactNode[];
}) {
  const { filters } = useFilters(routeId);
  return (
    <div className="flex flex-col gap-y-3 p-2">
      <SelectedIdsFacetedFilter routeId={routeId} />
      {inputs && inputs.length > 0
        ? inputs.map((input, index) =>
            React.isValidElement(input) ? (
              <React.Fragment key={`dropdown-menu-item-input-${index}`}>
                {React.cloneElement(input, { key: input.key || `dropdown-menu-item-input-${index}` })}
              </React.Fragment>
            ) : null,
          )
        : null}
      <DatePickerWithRange routeId={routeId} />
      {IsColumnFiltered(filters as Filters<R>) && (
        <>
          <DropdownMenuSeparator />
          <ResetButton routeId={routeId} />
        </>
      )}
    </div>
  );
}

function DropdownMenuToolbarFilter<R extends RouteIds<RegisteredRouter['routeTree']>>({
  buttonText,
  routeId,
  inputs,
}: {
  buttonText?: string;
  inputs?: React.ReactNode[];
  routeId: R;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild className="xl:hidden">
        <Button variant="outline" className="h-8 space-x-2 data-[state=open]:bg-muted">
          <Filter className="h-4 w-4" />
          <span>{buttonText ?? 'Filtros'}</span>
          <span className="sr-only">Open menu</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="min-w-[8rem] max-w-[225px] p-2">
        <div className="flex justify-between">
          <DropdownMenuLabel>{buttonText ?? 'Filtros'}</DropdownMenuLabel>
          <PopoverClose>
            <Cross2Icon />
          </PopoverClose>
        </div>
        <DropdownMenuSeparator />
        <DropdownToolbarFilter routeId={routeId} inputs={inputs} />
      </PopoverContent>
    </Popover>
  );
}

export function DataTableToolbar<TData, R extends RouteIds<RegisteredRouter['routeTree']>>({
  table,
  Action,
  buttonText,
  routeId,
  inputs,
}: DataTableToolbarProps<TData> & {
  Action: React.ReactNode;
  inputs?: React.ReactNode[];
  buttonText?: string;
  routeId: R;
}) {
  return (
    <div className="flex items-center justify-between gap-x-2">
      <div className="flex flex-1 items-start justify-start gap-2 max-xl:hidden">
        <ToolbarFilter routeId={routeId} inputs={inputs} />
      </div>
      <DropdownMenuToolbarFilter buttonText={buttonText} routeId={routeId} inputs={inputs} />
      <div className="flex space-x-3">
        {Action}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

```

O componente `ControlToolbar`, para configurar quais são as ações disponíveis para o usuário dentro do Toolbar, como botão de criar, deletar múltiplos e voltar:

```ts
import { DialogComponent } from '@components/dialog';
import { Button, buttonVariants } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { cn } from '@lib/utils';
import { VariantProps } from 'class-variance-authority';
import { MoreHorizontal } from 'lucide-react';
import React from 'react';
import { DataTableExportToCSV } from './data-table-export-to-csv';
import { Table } from '@tanstack/react-table';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';

export interface Action {
  label?: string;
  variant?: VariantProps<typeof buttonVariants>['variant'];
  onClick?: () => void;
  dialogTitle?: string;
  protected?: boolean;
  buttonType?: 'rowAction' | 'button';
}

export interface ControlToolbarProps<TData, R extends RouteIds<RegisteredRouter['routeTree']>>
  extends React.HTMLAttributes<HTMLDivElement> {
  actions: Action[];
  menuLabel?: string;
  className?: string;
  table: Table<TData>;
  routeId: R;
  fileName?: string;
  exportTableToCSV?: boolean;
}

export function ControlToolbar<TData, R extends RouteIds<RegisteredRouter['routeTree']>>({
  actions,
  menuLabel = 'Menu',
  table,
  className,
  routeId,
  fileName,
  exportTableToCSV = true,
  ...props
}: ControlToolbarProps<TData, R>) {
  return (
    <>
      <div {...props} className={cn('flex justify-center gap-3 max-2xl:hidden', className)}>
        {actions.map((action, index) => (
          <div key={index}>
            {action.dialogTitle ? (
              <DialogComponent title={action.dialogTitle} />
            ) : !action.protected ? (
              <Button onClick={action.onClick} variant={action.variant} size="sm">
                {action.label}
              </Button>
            ) : null}
          </div>
        ))}
        {exportTableToCSV && (
          <DataTableExportToCSV table={table} routeId={routeId} filename={fileName ?? 'Table-Data'} />
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="2xl:hidden">
          <Button variant="outline" className="h-8 space-x-2 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
            <span>{menuLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuLabel>Opções</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {action.dialogTitle ? (
                <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                  <DialogComponent className="flex-1" title={action.dialogTitle} mutate={action.onClick} />
                </DropdownMenuItem>
              ) : !action.protected ? (
                <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                  <Button onClick={action.onClick} variant={action.variant} className="flex-1" size="sm">
                    {action.label}
                  </Button>
                </DropdownMenuItem>
              ) : null}
            </React.Fragment>
          ))}
          {exportTableToCSV && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                <DataTableExportToCSV
                  className="mx-0 flex-1"
                  table={table}
                  routeId={routeId}
                  filename={fileName ?? 'Table-Data'}
                />
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

```

Incluído no componente `DataTableToolbar`, caso exista uma opção de filtragem em que se deseja passar uma quantidade pré-determinada de opção a serem disponibilizadas, existe o componente `DataTableFacetedFilter` que possui a seguinte configuração:

```ts
import * as React from 'react';
import { CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
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
import { DataTableFacetedFilterProps } from '@services/types/tables/DataTableComponents';
import { useFilters } from '@services/hooks/useFilters';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';

type FacetsType = Map<string | string[], number>;
export function DataTableFacetedFilter<TData, TValue, R extends RouteIds<RegisteredRouter['routeTree']>>({
  column,
  title,
  options,
  routeId,
  classNameButton,
  classNamePopover,
}: DataTableFacetedFilterProps<TData, TValue, R>) {
  const { filters, setFilters } = useFilters<R>(routeId);
  const facets = column?.getFacetedUniqueValues() as FacetsType;

  const customFacets = new Map<string, number>();

  for (const [key, value] of facets) {
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

  const filterKey = column?.id as keyof typeof filters;

  const filterValues: string[] = filters[filterKey] as string[];

  const [selectedValues, setSelectedValues] = React.useState(new Set(filterValues));

  React.useEffect(() => {
    setSelectedValues(new Set(filterValues));
  }, [filterValues]);

  const handleSelect = (value: string) => {
    setSelectedValues((prev) => {
      const newSelectedValues = new Set(prev);
      if (newSelectedValues.has(value)) {
        newSelectedValues.delete(value);
      } else {
        newSelectedValues.add(value);
      }

      const updatedFilterValues = Array.from(newSelectedValues);

      const updatedFilters = {
        ...filters,
        [filterKey]: updatedFilterValues.length ? updatedFilterValues : undefined,
      } as Partial<typeof filters>;

      setFilters(updatedFilters);

      return newSelectedValues;
    });
  };

  const handleClearFilters = () => {
    setSelectedValues(new Set());

    setFilters({
      [filterKey]: undefined,
    } as Partial<typeof filters>);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-8 border-dashed min-w-fit w-auto', classNameButton)}>
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal 2xl:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 2xl:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} selecionados
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.id))
                    .map((option) => (
                      <Badge variant="secondary" key={option.id} className="rounded-sm px-1 font-normal">
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-[200px] p-0', classNamePopover)} align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Opção não encontrada.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.id);
                return (
                  <CommandItem key={option.id} onSelect={() => handleSelect(option.id)}>
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
                      {customFacets.get(option.id)}
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
                    Limpar filtragem
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

O componente `SelectedIdsFacetedFilter` com a funcionalidade de gerenciar os estados de linhas selecionadas na tabela:

```ts
import * as React from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
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
import { Filters } from '@services/types/tables/FilterExtension';
import { SelectionType } from '@services/types/tables/FilterExtension';
import { ListTodo } from 'lucide-react';
import { useFilters } from '@services/hooks/useFilters';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import { selectionOptions } from '@services/constants/labels';

type SelectedIdsFacetedFilterProps<R extends RouteIds<RegisteredRouter['routeTree']>> = {
  title?: string;
  routeId: R;
  className?: string;
};

export function SelectedIdsFacetedFilter<R extends RouteIds<RegisteredRouter['routeTree']>, T>({
  title = 'Selecionados',
  routeId,
  className
}: SelectedIdsFacetedFilterProps<R>) {
  const { filters, setFilters } = useFilters(routeId);
  const { selection } = filters as Filters<T>;
  const selectedValues = React.useMemo(() => new Set(selection || []), [selection]);

  const handleSelect = (value: SelectionType) => {
    const newSelectedValues = new Set(selectedValues);
    if (newSelectedValues.has(value)) {
      newSelectedValues.delete(value);
    } else {
      newSelectedValues.add(value);
    }

    const updatedSelection = Array.from(newSelectedValues) as Filters<T>['selection'];
    setFilters({ ...filters, selection: updatedSelection?.length === 0 ? undefined : updatedSelection });
  };

  const handleClearFilters = () => {
    setFilters({ ...filters, selection: undefined });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-8 border-dashed', className)}>
          <ListTodo className="mr-2 h-4 w-4" />
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} selecionados
                  </Badge>
                ) : (
                  selectionOptions
                    .filter((option) => selectedValues.has(option.id))
                    .map((option) => (
                      <Badge variant="secondary" key={option.id} className="rounded-sm px-1 font-normal">
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
            <CommandEmpty>Opção não encontrada.</CommandEmpty>
            <CommandGroup>
              {selectionOptions.map((option) => {
                const isSelected = selectedValues.has(option.id);
                return (
                  <CommandItem key={option.id} onSelect={() => handleSelect(option.id)}>
                    <div
                      className={cn(
                        'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <CheckIcon className={cn('h-4 w-4')} />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={handleClearFilters} className="justify-center text-center">
                    Limpar filtragem
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

O componente `DebouncedInput` com a funcionalidade de capturar os valores de filtragem no input:

```ts
import { InputHTMLAttributes, useEffect, useState } from 'react';
import { Input } from './ui/input';
import { useFilters } from '@services/hooks/useFilters';
import { Table } from '@tanstack/react-table';
import { cn } from '@lib/utils';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 300,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  const [value, setValue] = useState<string | number>(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Input
      {...props}
      min={props.min ?? 0}
      step={props.step ?? '0.01'}
      value={value ?? ''}
      onChange={(e) => {
        if (e.target.value === '') return setValue('');
        if (props.type === 'number') {
          setValue(e.target.valueAsNumber);
        } else {
          setValue(e.target.value);
        }
      }}
    />
  );
}

export function DebounceFilterInput<TData, R extends RouteIds<RegisteredRouter['routeTree']>>({
  columnId,
  table,
  placeholder,
  routeId,
  className,
}: {
  columnId: string;
  placeholder?: string;
  table: Table<TData>;
  routeId: R;
  className?: string;
}) {
  const { filters, setFilters } = useFilters(routeId);
  const fieldMeta = table.getColumn(columnId)?.columnDef.meta;
  return table.getColumn(columnId)?.getCanFilter() && fieldMeta?.filterKey !== undefined ? (
    <DebouncedInput
      className={cn('h-8 flex-1 rounded border shadow lg:w-full max-w-[250px]', className)}
      onChange={(value) => {
        setFilters({
          [fieldMeta.filterKey as string]: value,
        } as Partial<typeof filters>);
      }}
      onClick={(e) => e.stopPropagation()}
      type={fieldMeta.filterVariant === 'number' ? 'number' : 'text'}
      placeholder={placeholder ?? `Procure pelo ${columnId}...`}
      value={(filters[fieldMeta.filterKey as keyof typeof filters] as string) ?? ''}
    />
  ) : null;
}

```

O componente `DatePickerWithRange` com a funcionalidade de gerenciar uma filtragem por range de data em um período:

```ts
import * as React from 'react';
import { intlFormat } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFilters } from '@services/hooks/useFilters';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import { Filters } from '@services/types/tables/FilterExtension';
import { DateLocaleType } from '@services/types/Date';
import { useIsMobile } from '@services/hooks/use-mobile';

type DatePickerWithRangeType<R> = React.HTMLAttributes<HTMLDivElement> & {
  routeId: R;
  format?: 'short' | 'long';
  locale?: DateLocaleType;
  alignPopoverContent?: 'start' | 'center' | 'end';
};
export function DatePickerWithFilter<R extends RouteIds<RegisteredRouter['routeTree']>, T>({
  routeId,
  locale = 'pt-BR',
  format = 'short',
  alignPopoverContent = 'start',
  className,
  ...props
}: DatePickerWithRangeType<R>) {
  const { filters, setFilters } = useFilters(routeId);

  const { from, to } = filters as Filters<T>;

  const selectedDate = React.useMemo(() => {
    if (!from && !to) return undefined;
    const date = { to: to, from: from };
    return date;
  }, [from, to]);

  function dateFormatter(date: Date) {
    return intlFormat(
      date,
      format === 'long'
        ? {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }
        : {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          },
      {
        locale: locale || 'pt-BR',
      },
    );
  }

  return (
    <div className={cn('grid gap-2', className)} {...props}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            size='sm'
            className={cn(
              'w-full border-dashed pl-3 text-left font-normal',
              !selectedDate?.from && !selectedDate?.to && 'text-muted-foreground',
            )}
          >
            {selectedDate?.from ? (
              selectedDate.to ? (
                `${dateFormatter(selectedDate.from)} - ${dateFormatter(selectedDate.to)}`
              ) : (
                dateFormatter(selectedDate.from)
              )
            ) : (
              <span>{'Escolha um período'}</span>
            )}
            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={alignPopoverContent}>
          <Calendar
            customMode="range"
            autoFocus
            customLocale={locale || 'pt-BR'}
            selected={selectedDate}
            numberOfMonths={useIsMobile() ? 1 : 2}
            disabled={{ after: new Date() }}
            onSelect={(selected: DateRange) => {
              setFilters({
                ...filters,
                from: selected ? selected.from : undefined,
                to: selected ? selected.to : undefined,
              });
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export const DatePickerWithRange = React.memo(DatePickerWithFilter);
```

O componente `DataTableExportToCSV` com a funcionalidade de extrair os dados de uma tabela para um arquivo .csv:

```ts
import { Button } from '@components/ui/button';
import { useFilters } from '@services/hooks/useFilters';
import { exportTableToCSV } from '@services/utils/export';
import { Table } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import { Filters } from '@services/types/tables/FilterExtension';

export interface DataTableExportToCSVProps<TData, R extends RouteIds<RegisteredRouter['routeTree']>> {
  table: Table<TData>;
  routeId: R;
  filename?: string;
  excludeColumns?: (keyof TData | 'select' | 'actions')[];
}
export function DataTableExportToCSV<TData, R extends RouteIds<RegisteredRouter['routeTree']>>({
  table,
  routeId,
  filename = 'table',
  excludeColumns = []
}: DataTableExportToCSVProps<TData, R>) {
  const { filters } = useFilters(routeId);
  const { selection } = filters as Filters<TData>;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        exportTableToCSV(table, {
          filename,
          excludeColumns,
          onlySelected: selection?.length === 1 && selection?.includes('SELECTED'),
        })
      }
      className="mx-2 gap-2"
    >
      <Download className="size-4" aria-hidden="true" />
      Exportar
    </Button>
  );
}

```

Sendo a função `exportTableToCSV` para exportar a tabela configurada da seguinte forma:

```ts
import { type Table } from '@tanstack/react-table';

export function exportTableToCSV<TData>(
  /**
   * The table to export.
   * @type Table<TData>
   */
  table: Table<TData>,
  opts: {
    /**
     * The filename for the CSV file.
     * @default "table"
     * @example "tasks"
     */
    filename?: string;
    /**
     * The columns to exclude from the CSV file.
     * @default []
     * @example ["select", "actions"]
     */
    excludeColumns?: (keyof TData | 'select' | 'actions')[];

    /**
     * Whether to export only the selected rows.
     * @default false
     */
    onlySelected?: boolean;
  } = {},
): void {
  const { filename = 'table', excludeColumns = [], onlySelected = false } = opts;

  // Retrieve headers (column names)
  const headers = table
    .getAllLeafColumns()
    .map((column) => column.id as string) // Force column.id to be string
    .filter((id) => !excludeColumns.includes(id as keyof TData | 'select' | 'actions')); // Filter out excluded columns

  // Build CSV content
  console.log('onlySelected: ', onlySelected);
  const csvContent = [
    headers.join(','), // Join headers with commas
    ...(onlySelected ? table.getFilteredSelectedRowModel().rows : table.getRowModel().rows).map((row) =>
      headers
        .map((header) => {
          const cellValue = row.getValue(header);
          // Handle values that might contain commas or newlines
          return typeof cellValue === 'string' ? `"${cellValue.replace(/"/g, '""')}"` : cellValue;
        })
        .join(','),
    ),
  ].join('\n');
  // Create a Blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create a link and trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

O componente `DataTableViewOptions` com a funcionalidade de gerenciar a visibilidade de colunas na tebela:

```ts
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto hidden h-8 lg:flex">
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          Visualização
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Visualizar colunas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.columnDef.meta?.name}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

```

---

## Configurando o TanStack Router e Query para o Data Table

Agora vamos configurar o **TanStack Router** e o **TanStack Query** para carregar os dados filtrados e paginados dinamicamente, com base nos parâmetros da URL.

### Definição das Colunas da Data Table

A definição das colunas em uma **Data Table** é crucial para estruturar a maneira como os dados serão apresentados e manipulados. No contexto do **TanStack Table**, cada coluna é configurada com diferentes propriedades, como `accessorKey`, `header`, `cell`, e funções de filtro e ordenação personalizadas. A seguir, vamos detalhar sobre a coluna de `Seleção`, `Status` e `Ações` coluna do exemplo de implementação.

### Estrutura Geral das Colunas

As colunas são definidas usando o tipo `ColumnDef<T>`, onde `T` é o tipo de dado que a tabela manipula. No caso da nossa tabela, estamos utilizando o tipo `UserTable`, que contém campos como `id`, `name`, `email`, `role`, e `birthday`. Aqui está a estrutura completa da nossa definição de colunas:

```ts
import { ColumnDef } from '@tanstack/react-table';
import { UserButtonAction } from './user-row-actions';
import { DataTableColumnHeader } from '../common/data-table-column-header';
import { UserTable, UserTableType } from '@services/types/tables/User';
import { roles } from '@services/constants/labels';
import { SelectAllCheckbox } from '../common/select-all-rows-action';
import { CheckedRow } from '../common/check-row-action';
import { ActionHeader } from '../common/data-table-action-header';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import { GetDataTableColumnHeaderName } from '@services/utils/headerName';
import { dateFormatter } from '@services/utils/utils';

export const userTableRouteId: RouteIds<RegisteredRouter['routeTree']> = '/shadcnTable';

export const userColumns: ColumnDef<UserTableType>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <SelectAllCheckbox
        table={table}
        routeId={userTableRouteId}
        allIds={table.getRowModel().rows.map((row) => UserTable.parse(row.original).id)}
      />
    ),
    cell: ({ row }) => <CheckedRow row={row} routeId={userTableRouteId} id={UserTable.parse(row.original).id} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title={GetDataTableColumnHeaderName({ column })} />,
    cell: ({ row }) => <div>{row.getValue('id')}</div>,
    enableSorting: false,
    enableHiding: false,
    meta: { filterKey: 'id', name: 'Id', filterVariant: 'number' },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title={GetDataTableColumnHeaderName({ column })} />,
    cell: ({ row }) => {
      return (
        <div className="flex justify-center space-x-2">
          <span className="truncate font-medium">{row.getValue('name')}</span>
        </div>
      );
    },
    meta: { filterKey: 'name', name: 'Nome' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title={GetDataTableColumnHeaderName({ column })} />,
    cell: ({ row }) => {
      return (
        <div className="flex justify-center space-x-2">
          <span className="truncate font-medium">{row.getValue('email')}</span>
        </div>
      );
    },
    meta: { filterKey: 'email', name: 'Email' },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title={GetDataTableColumnHeaderName({ column })} />,
    cell: ({ row }) => {
      const rolesArray = row.getValue('role') as string[];
      const role = roles.find((roles) => rolesArray.includes(roles.id));

      if (!role) {
        return null;
      }
      return (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-nowrap">{role.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id) as string[];
      return value.some((v: string) => rowValue.includes(v));
    },
    meta: { name: 'Perfil' },
  },
  {
    accessorKey: 'birthday',
    header: ({ column }) => <DataTableColumnHeader column={column} title={GetDataTableColumnHeaderName({ column })} />,
    cell: ({ row }) => {
      return (
        <div className="flex justify-center space-x-2">
          <span className="truncate font-medium">{dateFormatter({ date: row.getValue('birthday') })}</span>
        </div>
      );
    },
    meta: { filterKey: 'birthday', name: 'Data de Nascimento' },
  },
  {
    id: 'actions',
    header: () => <ActionHeader title="Ações" />,
    cell: ({ row }) => <UserButtonAction row={row} />,
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
      <SelectAllCheckbox
        table={table}
        routeId={userTableRouteId}
        allIds={table.getRowModel().rows.map((row) => UserTable.parse(row.original).id)}
      />
    ),
    cell: ({ row }) => <CheckedRow row={row} routeId={userTableRouteId} id={UserTable.parse(row.original).id} />,
    enableSorting: false,
    enableHiding: false,
  },

```

### Coluna de Perfil (`accessorKey: 'role'`)

Essa coluna exibe o nível de perfil do usuário.

- **Cabeçalho**: Usa `DataTableColumnHeader` para exibir o título "Perfil", sendo indicado o texto a partir do valor passado no dado meta, na chave `name`.
- **Célula**: Exibe o nome do nível de perfil do usuário.
- **Função de Filtro**: Permite filtrar perfis com base em múltiplos níveis. A função `filterFn` compara os níveis selecionados pelo usuário com o nível de perfil.

```ts
{
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title={GetDataTableColumnHeaderName({ column })} />,
    cell: ({ row }) => {
      const rolesArray = row.getValue('role') as string[];
      const role = roles.find((roles) => rolesArray.includes(roles.id));

      if (!role) {
        return null;
      }
      return (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-nowrap">{role.label}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const rowValue = row.getValue(id) as string[];
      return value.some((v: string) => rowValue.includes(v));
    },
    meta: { name: 'Perfil' },
  },

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
} from '@components/ui/dropdown-menu';
import { Button } from '@components/ui/button';

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title?: string;
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
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="ml-3 h-8 data-[state=open]:bg-accent">
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

- **Célula**: Renderiza os botões de ação usando o componente `UserButtonAction` e `ActionHeader`.

```ts
  {
    id: 'actions',
    header: () => <ActionHeader title="Ações" />,
    cell: ({ row }) => <UserButtonAction row={row} />,
  },

```

Sendo o componente **ActionHeader** criado da seguinte forma:

```ts
import { cn } from '@lib/utils';

type ActionHeaderType = {
  title: string;
  classNameTitle?: string;
} & React.HTMLAttributes<HTMLDivElement>;
export function ActionHeader({ title, classNameTitle, ...props }: ActionHeaderType) {
  return (
    <div {...props} className={cn('flex justify-center', props.className)}>
      <span className={cn('text-sm font-medium leading-none', classNameTitle)}>{title}</span>
    </div>
  );

```

E o componente **UserButtonAction** criado da seguinte forma:

```ts
import { DialogComponent } from '@components/dialog';
import { Button } from '@components/ui/button';
import { DataTableRowActionsProps } from '@services/types/tables/DataTableComponents';
import { UserTable } from '@services/types/tables/User';
import { useRouter } from '@tanstack/react-router';
import { EditIcon } from 'lucide-react';

export function UserButtonAction<TData>({ row }: DataTableRowActionsProps<TData>) {
  const user = UserTable.parse(row.original);
  const router = useRouter();
  return (
    <div className="flex justify-center gap-3">
      <Button
        onClick={() =>
          router.navigate({
            to: '/shadcnTable',
          })
        }
        variant="outline"
      >
        <EditIcon />
      </Button>
      <DialogComponent buttonType="rowAction" title={`Deseja remover o usuário ${user.name}?`} />
    </div>
  );
}

```

Para a definição das funcionalidades encontradas no Toolbar da Data Table para o contexto de `Usuários`, devemos configurar da seguinte forma:

```ts
import { roles } from '@services/constants/labels';
import { UserToolbarAction } from './user-toolbar-actions';
import { DataTableToolbarProps } from '@services/types/tables/DataTableComponents';
import { DataTableFacetedFilter } from '../common/data-table-faceted-filter';
import { DebounceFilterInput } from '@components/debouncedInput';
import { DataTableToolbar } from '../common/data-table-toolbar';
import { userTableRouteId } from './user-columns';

export function DataTableToolbarUsers<TData>({ table }: DataTableToolbarProps<TData>) {
  return (
    <DataTableToolbar
      routeId={userTableRouteId}
      table={table}
      inputs={[
        <DebounceFilterInput
          table={table}
          routeId={userTableRouteId}
          columnId="id"
          placeholder="Procure pelo id..."
        />,
        <DebounceFilterInput
          table={table}
          routeId={userTableRouteId}
          columnId="name"
          placeholder="Procure pelo nome..."
        />,
        <DebounceFilterInput
          table={table}
          routeId={userTableRouteId}
          columnId="email"
          placeholder="Procure pelo email..."
        />,
        table.getColumn('role') && (
          <DataTableFacetedFilter
            column={table.getColumn('role')}
            title="Perfil"
            options={roles}
            routeId={userTableRouteId}
          />
        ),
      ]}
      Action={<UserToolbarAction table={table} />}
    />
  );
}

```

Sendo `UserToolbarAction` definido da seguinte forma:

```ts
import { DataTableToolbarActionsProps } from '@services/types/tables/DataTableComponents';
import { useRouter } from '@tanstack/react-router';
import { ControlToolbar } from '../common/data-table-row-actions';
import { userTableRouteId } from './user-columns';
export function UserToolbarAction<TData>({ className, ...props }: DataTableToolbarActionsProps<TData>) {
  const router = useRouter();
  return (
    <ControlToolbar
      {...props}
      className={className}
      routeId={userTableRouteId}
      fileName="Users"
      actions={[
        {
          label: 'Criar',
          variant: 'default',
          onClick: () => router.navigate({ to: '/shadcnTable' }),
        },
        {
          dialogTitle: 'Deseja remover os registros de usuários?',
        },
        {
          label: 'Voltar',
          variant: 'outline',
          onClick: () => router.navigate({ to: '/' }),
        },
      ]}
    />
  );
}

```

---

### Código da rota `shadcnTable`

Após criar todos os componentes e configurações necessárias para a criação do Data Table utilizando os componentes do `Shadcn/ui` com as funcionalidades de gerenciar o estado dos filtros através dos parâmetros de URL. Podemos utilizar a Data Table na rota de desejo:

```ts
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useFilters } from '@services/hooks/useFilters';
import { userColumns } from '@components/Table/users/user-columns';
import { UserFilters } from '@services/types/tables/User';
import { queryOptionsUserTable } from '@services/hooks/useTableUser';
import DataTable from '@components/Table/common/data-table';
import { DataTableToolbarUsers } from '@components/Table/users/user-table-toolbar';

export const Route = createFileRoute('/shadcnTable')({
  loaderDeps: ({ search: filters }) => filters,
  loader: ({ context: { queryClient }, deps: filters }) => queryClient.ensureQueryData(queryOptionsUserTable(filters)),
  validateSearch: () => ({}) as UserFilters,
  component: DataTableComponent,
});

function DataTableComponent() {
  const { filters, resetFilters } = useFilters(Route.fullPath);

  const data = Route.useLoaderData();
  const columns = useMemo(() => userColumns, []);

  return (
    <div className="m-6 flex flex-col gap-3 rounded-lg border p-2">
      <DataTable data={data} columns={columns} routeId={Route.fullPath} toolbar={DataTableToolbarUsers} />
      <div className="flex items-center gap-2">
        {data?.rowCount} users found
        <Button
          className="rounded border p-1 disabled:cursor-not-allowed disabled:text-gray-500"
          onClick={resetFilters}
          disabled={Object.keys(filters).length === 0}
        >
          Reset Filters
        </Button>
      </div>
      <pre>{JSON.stringify(filters, null, 2)}</pre>
    </div>
  );
}

```

## Conclusão

Com essa implementação, você agora possui uma **Data Table** completa com filtros dinâmicos, ordenação e paginação, usando **TanStack Router**, **TanStack Query** e **TanStack Table**. Este setup permite que os filtros e a paginação sejam gerenciados diretamente via parâmetros da URL, oferecendo uma experiência de usuário consistente e intuitiva, além de uma interface rápida e eficiente para manipulação de grandes volumes de dados.

#### Confira mais projetos visitando meu [`portfolio`](https://leoasarmento.com/).

### Abraços do seu Leo Sarmento e até a próxima!

---
