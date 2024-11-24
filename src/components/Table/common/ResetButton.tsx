import { Button } from '@components/ui/button';
import { Cross2Icon } from '@radix-ui/react-icons';
import { useFilters } from '@services/hooks/useFilters';
import { useNavigate } from '@tanstack/react-router';
import { HTMLAttributes } from 'react';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import { Filters } from '@services/types/tables/FilterExtension';

type ResetButtonType<R extends RouteIds<RegisteredRouter['routeTree']>, _> = {
  routeId: R;
  selectedIds?: number[];
} & HTMLAttributes<HTMLButtonElement>;
export default function ResetButton<R extends RouteIds<RegisteredRouter['routeTree']>, T>({
  routeId,
  selectedIds,
  ...props
}: ResetButtonType<R, T>) {
  const { filters } = useFilters(routeId);
  const { pageIndex, pageSize } = filters as Filters<T>;
  const navigate = useNavigate();
  return (
    <Button
      variant="ghost"
      onClick={() =>
        navigate({
          to: '.',
          search: { pageIndex, pageSize, selectedIds: selectedIds?.length === 0 ? undefined : selectedIds },
        })
      }
      className="h-8 px-2 lg:px-3"
      {...props}
    >
      Resetar
      <Cross2Icon className="ml-2 h-4 w-4" />
    </Button>
  );
}
