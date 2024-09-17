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
