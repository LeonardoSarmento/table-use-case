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
      const role = roles.find((roles) => rolesArray.includes(roles.value));

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
    id: 'actions',
    header: () => <ActionHeader title="Ações" />,
    cell: ({ row }) => <UserButtonAction row={row} />,
  },
];
