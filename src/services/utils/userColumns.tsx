import { ColumnDef } from '@tanstack/react-table';
import { User } from '@/api/user';
import { Checkbox } from '@/components/ui/checkbox';

export const USER_COLUMNS: ColumnDef<User>[] = [
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
    header: () => <span>ID</span>,
    meta: { filterKey: 'id', filterVariant: 'number' },
  },
  {
    accessorKey: 'firstName',
    header: () => <span>First Name</span>,
    meta: { filterKey: 'firstName' },
  },
  {
    accessorKey: 'lastName',
    header: () => <span>Last Name</span>,
    meta: { filterKey: 'lastName' },
  },
  {
    accessorKey: 'age',
    header: () => 'Age',
    meta: { filterKey: 'age', filterVariant: 'number' },
  },
];
