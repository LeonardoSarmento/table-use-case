import { getRouteApi, NavigateOptions, RegisteredRouter, RouteIds, useNavigate } from '@tanstack/react-router';
import { cleanEmptyParams } from '@services/utils/cleanEmptyParams';

export function useFilters<T extends RouteIds<RegisteredRouter['routeTree']>>(routeId: T) {
  const routeApi = getRouteApi<T>(routeId);
  const navigate = useNavigate();
  const filters = routeApi.useSearch();

  const setFilters = (partialFilters: Partial<typeof filters>) =>
    navigate({
      search: (prev) => {
        // Limpar parâmetros vazios e garantir que a tipagem de retorno seja correta
        const newSearchParams = cleanEmptyParams({ ...prev, ...partialFilters });

        // Retornar explicitamente o tipo correto
        return newSearchParams; // Aqui o tipo de retorno deve ser o mesmo de 'prev'
      },
    } as NavigateOptions);
  const resetFilters = () => navigate({ search: true });

  return { filters, setFilters, resetFilters };
}
