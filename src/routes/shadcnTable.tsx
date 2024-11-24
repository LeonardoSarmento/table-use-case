import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useFilters } from '@services/hooks/useFilters';
import { DEFAULT_PAGE_INDEX, DEFAULT_PAGE_SIZE } from '@/components/table';
import { sortByToState, stateToSortBy } from '@services/utils/tableSortMapper';
import DataTableExample from '@/components/table-example';
import { userColumns } from '@components/Table/users/user-columns';
import { UserFilters } from '@services/types/tables/User';
import { queryOptionsUserTable } from '@services/hooks/useTableUser';

export const Route = createFileRoute('/shadcnTable')({
  loaderDeps: ({ search: filters }) => filters,
  loader: ({ context: { queryClient }, deps: filters }) => queryClient.ensureQueryData(queryOptionsUserTable(filters)),
  validateSearch: () => ({}) as UserFilters,
  component: DataTableComponent,
});

function DataTableComponent() {
  const { filters, resetFilters, setFilters } = useFilters(Route.fullPath);

  const data = Route.useLoaderData();

  const paginationState = {
    pageIndex: filters.pageIndex ?? DEFAULT_PAGE_INDEX,
    pageSize: filters.pageSize ?? DEFAULT_PAGE_SIZE,
  };
  const sortingState = sortByToState(filters.sortBy);
  const columns = useMemo(() => userColumns, []);

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
    </>
  );
}
