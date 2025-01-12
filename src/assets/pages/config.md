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
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { useState } from 'react';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbarProps } from '@services/types/tables/DataTableComponents';
import { useFilters } from '@services/hooks/useFilters';
import { sortByToState, stateToSortBy } from '@services/utils/tableSortMapper';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import { Filters, PaginatedData } from '@services/types/tables/FilterExtension';

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
};

export default function DataTable<
  T extends Record<string, string | number | string[] | number[] | Date>,
  R extends RouteIds<RegisteredRouter['routeTree']>,
>({ data, columns, toolbar, routeId }: Props<T, R>) {
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
    <div className="flex flex-col gap-3 rounded-lg border p-2">
      {toolbar && toolbar({ table: table })}
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
                Sem resultados.
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
import { Pagination, PaginationContent, PaginationItem } from '@components/ui/pagination';
import { Separator } from '@components/ui/separator';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  return (
    <Pagination className="w-full">
      <PaginationContent className="flex w-full justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de {table.getFilteredRowModel().rows.length} linha(s)
          selecionadas.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Linhas por página</p>
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
          <div className="flex w-[100px] items-center justify-center text-sm font-medium text-nowrap">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </div>
          <Separator orientation="vertical" />
          <div className="flex items-center space-x-2">
            <PaginationItem>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Ir para primeira página</span>
                <DoubleArrowLeftIcon className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Anterior</span>
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Próximo</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Ir para última página</span>
                <DoubleArrowRightIcon className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </div>
        </div>
      </PaginationContent>
    </Pagination>
  );
}

```

E o componente `DataTableToolbar` para gerenciamento dos filtros aplicados pelo usuário:

```ts
import { useFilters } from '@services/hooks/useFilters';
import { roles } from '@services/constants/labels';
import { UserFilters } from '@services/types/tables/User';
import { UserToolbarAction } from './user-toolbar-actions';
import { DataTableToolbarProps } from '@services/types/tables/DataTableComponents';
import { DataTableFacetedFilter } from '../common/data-table-faceted-filter';
import { SelectedIdsFacetedFilter } from '../common/selected-faceted-filters';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import { DebouncedInput } from '@components/debouncedInput';
import ResetButton from '../common/ResetButton';
import { IsColumnFiltered } from '@services/utils/utils';
import { DataTableViewOptions } from '../common/data-table-view-options';
import { DatePickerWithRange } from '../common/data-table-date-selection';
import { DataTableExportToCSV } from '../common/data-table-export-to-csv';

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const userTableRouteId: RouteIds<RegisteredRouter['routeTree']> = '/shadcnTable';

  const { filters, setFilters } = useFilters(userTableRouteId);
  const isFiltered = IsColumnFiltered(filters);
  const fieldMetaId = table.getColumn('id')?.columnDef.meta;
  const fieldMetaName = table.getColumn('name')?.columnDef.meta;
  const fieldMetaEmail = table.getColumn('email')?.columnDef.meta;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <SelectedIdsFacetedFilter title="Selecionados" routeId={userTableRouteId} />
        {table.getColumn('id')?.getCanFilter() && fieldMetaId?.filterKey !== undefined ? (
          <DebouncedInput
            className="h-8 w-[150px] rounded border shadow lg:w-[150px]"
            onChange={(value) => {
              setFilters({
                [fieldMetaId.filterKey as keyof UserFilters['id']]: value,
              } as Partial<TData>);
            }}
            step="1"
            onClick={(e) => e.stopPropagation()}
            type={fieldMetaId.filterVariant === 'number' ? 'number' : 'text'}
            placeholder="Procure pelo id"
            value={filters[fieldMetaId.filterKey as keyof UserFilters['id']] ?? ''}
          />
        ) : null}
        {table.getColumn('name')?.getCanFilter() && fieldMetaName?.filterKey !== undefined ? (
          <DebouncedInput
            className="h-8 w-[150px] rounded border shadow lg:w-[150px]"
            onChange={(value) => {
              setFilters({
                [fieldMetaName.filterKey as keyof UserFilters]: value,
              } as Partial<TData>);
            }}
            onClick={(e) => e.stopPropagation()}
            type={fieldMetaName.filterVariant === 'number' ? 'number' : 'text'}
            placeholder="Procure pelo nome"
            value={filters[fieldMetaName.filterKey as keyof UserFilters['name']] ?? ''}
          />
        ) : null}
        {table.getColumn('email')?.getCanFilter() && fieldMetaEmail?.filterKey !== undefined ? (
          <DebouncedInput
            className="h-8 w-[150px] rounded border shadow lg:w-[150px]"
            onChange={(value) => {
              setFilters({
                [fieldMetaEmail.filterKey as keyof UserFilters]: value,
              } as Partial<TData>);
            }}
            onClick={(e) => e.stopPropagation()}
            type={fieldMetaEmail.filterVariant === 'number' ? 'number' : 'text'}
            placeholder="Procure pelo email"
            value={filters[fieldMetaEmail.filterKey as keyof UserFilters['email']] ?? ''}
          />
        ) : null}
        {table.getColumn('role') && (
          <DataTableFacetedFilter
            column={table.getColumn('role')}
            title="Perfil"
            options={roles}
            routeId={userTableRouteId}
          />
        )}
        <DatePickerWithRange routeId={userTableRouteId} />
        {isFiltered && <ResetButton routeId={userTableRouteId} />}
      </div>
      <UserToolbarAction />
      <DataTableExportToCSV table={table} routeId={userTableRouteId} filename="users" />
      <DataTableViewOptions table={table} />
    </div>
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
      <PopoverContent className="w-[200px] p-0" align="start">
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
};

export function SelectedIdsFacetedFilter<R extends RouteIds<RegisteredRouter['routeTree']>, T>({
  title = 'Selecionados',
  routeId,
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
        <Button variant="outline" size="sm" className="h-8 border-dashed">
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

export function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 200,
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
      step={props.step ?? "0.01"}
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
export function DatePickerWithRange<R extends RouteIds<RegisteredRouter['routeTree']>, T>({
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
            numberOfMonths={2}
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

const userTableRouteId: RouteIds<RegisteredRouter['routeTree']> = '/shadcnTable';

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

---

### Código da rota `shadcnTable`

Após criar todos os componentes e configurações necessárias para a criação do Data Table utilizando os componentes do `Shadcn/ui` com as funcionalidades de gerenciar o estado dos filtros através dos parâmetros de URL. Podemos utilizar a Data Table na rota de desejo:

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useFilters } from '@services/hooks/useFilters';
import { userColumns } from '@components/Table/users/user-columns';
import { UserFilters } from '@services/types/tables/User';
import { queryOptionsUserTable } from '@services/hooks/useTableUser';
import DataTable from '@components/Table/common/data-table';
import { DataTableToolbar } from '@components/Table/users/user-table-toolbar';

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
      <DataTable data={data} columns={columns} routeId={Route.fullPath} toolbar={DataTableToolbar} />
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
