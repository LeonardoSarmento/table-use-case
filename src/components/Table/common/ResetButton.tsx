import { Button } from '@components/ui/button';
import { useFilters } from '@services/hooks/useFilters';
import { useNavigate } from '@tanstack/react-router';
import { HTMLAttributes } from 'react';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import { Filters } from '@services/types/tables/FilterExtension';
import { cn } from '@lib/utils';
import { FilterX } from 'lucide-react';

type ResetButtonType<R extends RouteIds<RegisteredRouter['routeTree']>> = {
  routeId: R;
} & HTMLAttributes<HTMLButtonElement>;
export default function ResetButton<R extends RouteIds<RegisteredRouter['routeTree']>, T>({
  routeId,
  className,
  ...props
}: ResetButtonType<R>) {
  const { filters } = useFilters(routeId);
  const { pageIndex, pageSize, selectedIds } = filters as Filters<T>;
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      onClick={() =>
        navigate({
          to: '.',
          search: { pageIndex, pageSize, selectedIds: selectedIds && selectedIds.length > 0 ? selectedIds : undefined },
        })
      }
      className={cn('h-8 space-x-2 px-2 lg:px-3', className)}
      {...props}
    >
      <FilterX className="h-4 w-4" />
      <span>Resetar</span>
    </Button>
  );
}
