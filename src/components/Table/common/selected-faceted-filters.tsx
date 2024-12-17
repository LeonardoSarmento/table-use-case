import * as React from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Filters } from '@services/types/tables/FilterExtension';
import { SelectionType } from '@services/types/tables/FilterExtension';
import { ListTodo } from 'lucide-react';
import { useFilters } from '@services/hooks/useFilters';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import { selectionOptions } from '@services/constants/labels';

type SelectedIdsFacetedFilterProps<R extends RouteIds<RegisteredRouter['routeTree']>> = {
  title?: string;
  routeId: R;
};

export function SelectedIdsFacetedFilter<R extends RouteIds<RegisteredRouter['routeTree']>, T>({
  title = 'Selecionados',
  routeId,
}: SelectedIdsFacetedFilterProps<R>) {
  const { filters, setFilters } = useFilters(routeId);
  const { selection } = filters as Filters<T>;
  const selectedValues = React.useMemo(() => new Set(selection || []), [selection]);

  const handleSelect = (value: SelectionType) => {
    const newSelectedValues = new Set(selectedValues);
    if (newSelectedValues.has(value)) {
      newSelectedValues.delete(value);
    } else {
      newSelectedValues.add(value);
    }

    const updatedSelection = Array.from(newSelectedValues) as Filters<T>['selection'];
    setFilters({ ...filters, selection: updatedSelection?.length === 0 ? undefined : updatedSelection });
  };

  const handleClearFilters = () => {
    setFilters({ ...filters, selection: undefined });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <ListTodo className="mr-2 h-4 w-4" />
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} selecionados
                  </Badge>
                ) : (
                  selectionOptions
                    .filter((option) => selectedValues.has(option.id))
                    .map((option) => (
                      <Badge variant="secondary" key={option.id} className="rounded-sm px-1 font-normal">
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Opção não encontrada.</CommandEmpty>
            <CommandGroup>
              {selectionOptions.map((option) => {
                const isSelected = selectedValues.has(option.id);
                return (
                  <CommandItem key={option.id} onSelect={() => handleSelect(option.id)}>
                    <div
                      className={cn(
                        'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <CheckIcon className={cn('h-4 w-4')} />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={handleClearFilters} className="justify-center text-center">
                    Limpar filtragem
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
