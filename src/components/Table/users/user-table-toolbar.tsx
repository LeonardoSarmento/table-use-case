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
            classNameButton="max-sm:flex-1"
            options={roles}
            routeId={userTableRouteId}
          />
        ),
      ]}
      Action={<UserToolbarAction table={table} />}
    />
  );
}
