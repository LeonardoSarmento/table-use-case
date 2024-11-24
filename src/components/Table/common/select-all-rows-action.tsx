import { Checkbox } from '@components/ui/checkbox';
import { Table } from '@tanstack/react-table';
import { useFilters } from '@services/hooks/useFilters';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';

type SelectAllAction<T, R> = {
  table: Table<T>;
  routeId: R;
  allIds: number[];
};

export function SelectAllCheckbox<T, R extends RouteIds<RegisteredRouter['routeTree']>>({ table, allIds, routeId }: SelectAllAction<T, R>) {
  const { filters, setFilters } = useFilters(routeId);

  const handleSelectAllChange = (value: boolean) => {
    if (value) {
      setFilters({
        ...filters,
        selectedIds: allIds,
      });
      table.toggleAllPageRowsSelected(true);
    } else {
      setFilters({
        ...filters,
        selectedIds: undefined,
      });
      table.toggleAllPageRowsSelected(false);
    }
  };

  const isChecked = table.getIsAllPageRowsSelected();
  const isIndeterminate = table.getIsSomePageRowsSelected();

  return (
    <Checkbox
      checked={isChecked ? true : isIndeterminate ? 'indeterminate' : false}
      onCheckedChange={(value) => handleSelectAllChange(!!value)}
      aria-label="Select all"
      className="translate-y-[2px]"
    />
  );
}
