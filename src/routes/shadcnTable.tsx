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
    <div className="md:m-6 flex flex-col gap-3 rounded-lg border p-2">
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
