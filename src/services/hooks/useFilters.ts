import { getRouteApi, RegisteredRouter, RouteIds, useNavigate } from '@tanstack/react-router';
import { cleanEmptyParams } from '@services/utils/cleanEmptyParams';

export function useFilters<T extends RouteIds<RegisteredRouter['routeTree']>>(routeId: T) {
  const routeApi = getRouteApi<T>(routeId);
  const navigate = useNavigate();
  const filters = routeApi.useSearch();

  const setFilters = (partialFilters: Partial<typeof filters>) =>
    navigate({
      to: '.',
      search: (prev) => {
        const newSearchParams = cleanEmptyParams({ ...prev, ...partialFilters });
        return newSearchParams;
      },
    });
  const resetFilters = () => navigate({ search: true });

  return { filters, setFilters, resetFilters };
}
