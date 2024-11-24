import { Column, Row, Table } from '@tanstack/react-table';
import { Filters } from './FilterExtension';

export interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
}

export type DataTableToolbarActionsProps = React.HTMLAttributes<HTMLDivElement>;

export interface DataTableFacetedFilterProps<TData, TValue, T> {
  column?: Column<TData, TValue>;
  title?: string;
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  filters: Filters<T>;
  setFilters: (filters: Filters<T>) => Promise<void>;
}
