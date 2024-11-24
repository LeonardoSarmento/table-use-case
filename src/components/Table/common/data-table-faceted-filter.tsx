import * as React from 'react';
import { CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons';
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
import { DataTableFacetedFilterProps } from '@services/types/tables/DataTableComponents';

function isFilterKey<T>(key: any, filters: Filters<T>): key is keyof Filters<T> {
  return key in filters;
}

export function DataTableFacetedFilter<TData, TValue, T>({
  column,
  title,
  options,
  filters,
  setFilters,
}: DataTableFacetedFilterProps<TData, TValue, T>) {
  const facets = column?.getFacetedUniqueValues();
  // Custom facets if keys is array then sum the equal value and remove duplicate
  const customFacets = new Map();
  for (const [key, value] of facets as any) {
    if (Array.isArray(key)) {
      for (const k of key) {
        const prevValue = customFacets.get(k) || 0;
        customFacets.set(k, prevValue + value);
      }
    } else {
      const prevValue = customFacets.get(key) || 0;
      customFacets.set(key, prevValue + value);
    }
  }

  const filterKey = column?.id as string;

  const filterValues =
    isFilterKey(filterKey, filters) && Array.isArray(filters[filterKey]) ? (filters[filterKey] as string[]) : [];

  const [selectedValues, setSelectedValues] = React.useState(new Set(filterValues));

  React.useEffect(() => {
    setSelectedValues(new Set(filterValues));
  }, [filters]);

  const handleSelect = (value: string) => {
    setSelectedValues((prev) => {
      const newSelectedValues = new Set(prev);
      if (newSelectedValues.has(value)) {
        newSelectedValues.delete(value);
      } else {
        newSelectedValues.add(value);
      }
      const filterValues = Array.from(newSelectedValues);
      setFilters({ [column?.id as string]: filterValues.length ? filterValues : undefined } as typeof filters);
      return newSelectedValues;
    });
  };

  const handleClearFilters = () => {
    setSelectedValues(new Set());
    setFilters({ [column?.id as string]: [] } as typeof filters);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
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
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge variant="secondary" key={option.value} className="rounded-sm px-1 font-normal">
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
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
                      )}
                    >
                      <CheckIcon className={cn('h-4 w-4')} />
                    </div>
                    {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span>{option.label}</span>
                    <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                      {customFacets.get(option.value)}
                    </span>
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
