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
      <DataTableViewOptions table={table} />
    </div>
  );
}
