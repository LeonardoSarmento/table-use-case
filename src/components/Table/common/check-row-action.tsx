import { Checkbox } from '@components/ui/checkbox';
import { Row } from '@tanstack/react-table';
import { useFilters } from '@services/hooks/useFilters';
import { useEffect } from 'react';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import { Filters } from '@services/types/tables/FilterExtension';

type CheckedAction<T, R> = {
  row: Row<T>;
  id: number;
  routeId: R;
};
export function CheckedRow<T, R extends RouteIds<RegisteredRouter['routeTree']>>({
  row,
  id,
  routeId,
}: CheckedAction<T, R>) {
  const { filters, setFilters } = useFilters(routeId);
  const { selectedIds } = filters as Filters<T>;
  const handleCheckChange = (value: boolean) => {
    const selectedIdsSet = new Set(selectedIds || []);

    if (value) {
      // Add the row's user ID to the set if checked
      selectedIdsSet.add(id);
    } else {
      // Remove the row's user ID from the set if unchecked
      selectedIdsSet.delete(id);
    }

    // Update the filters with the new selected IDs
    setFilters({
      ...filters,
      selectedIds: Array.from(selectedIdsSet),
    });

    // Update the row selection state
    row.toggleSelected(value);
  };

  useEffect(() => {
    function ShouldBeChecked() {
      if (selectedIds?.includes(id)) {
        row.toggleSelected(true);
      } else {
        row.toggleSelected(false);
      }
    }
    ShouldBeChecked();
  }, [filters, id, row]);

  return (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => handleCheckChange(!!value)}
      aria-label="Select row"
      className="translate-y-[2px]"
    />
  );
}
