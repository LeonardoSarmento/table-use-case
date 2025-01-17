import { Button } from '@components/ui/button';
import { DropdownMenuLabel, DropdownMenuSeparator } from '@components/ui/dropdown-menu';
import { DataTableToolbarProps } from '@services/types/tables/DataTableComponents';
import { Filter } from 'lucide-react';
import { DataTableViewOptions } from './data-table-view-options';
import { useFilters } from '@services/hooks/useFilters';
import { SelectedIdsFacetedFilter } from './selected-faceted-filters';
import { DatePickerWithRange } from './data-table-date-selection';
import { IsColumnFiltered } from '@services/utils/utils';
import { RegisteredRouter, RouteIds } from '@tanstack/react-router';
import React from 'react';
import { Filters } from '@services/types/tables/FilterExtension';
import ResetButton from './ResetButton';
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
import { PopoverClose } from '@radix-ui/react-popover';
import { Cross2Icon } from '@radix-ui/react-icons';

function ToolbarFilter<R extends RouteIds<RegisteredRouter['routeTree']>>({
  routeId,
  inputs,
}: {
  isDropdown?: boolean;
  routeId: R;
  inputs?: React.ReactNode[];
}) {
  const { filters } = useFilters(routeId);
  return (
    <>
      <SelectedIdsFacetedFilter routeId={routeId} />
      {inputs && inputs.length <= 3
        ? inputs.map((input, index) =>
            React.isValidElement(input) ? (
              <React.Fragment key={input.key || `input-${index}`}>
                {React.cloneElement(input, { key: input.key || `input-${index}` })}
              </React.Fragment>
            ) : null,
          )
        : inputs && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 space-x-2 data-[state=open]:bg-muted">
                  <Filter className="h-4 w-4" />
                  <span>Colunas</span>
                  <span className="sr-only">Open menu</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="max-w-[225px] min-w-fit gap-y-2 p-2 flex flex-col">
                <div className="flex justify-between">
                  <DropdownMenuLabel>Colunas</DropdownMenuLabel>
                  <PopoverClose>
                    <Cross2Icon />
                  </PopoverClose>
                </div>
                <DropdownMenuSeparator />
                {inputs.map((input, index) =>
                  React.isValidElement(input) ? (
                    <React.Fragment key={input.key || `input-${index}`}>
                      {React.cloneElement(input, { key: input.key || `input-${index}` })}
                    </React.Fragment>
                  ) : null,
                )}
              </PopoverContent>
            </Popover>
          )}
      <DatePickerWithRange routeId={routeId} />
      {IsColumnFiltered(filters as Filters<R>) && <ResetButton routeId={routeId} />}
    </>
  );
}
function DropdownToolbarFilter<R extends RouteIds<RegisteredRouter['routeTree']>>({
  routeId,
  inputs,
}: {
  isDropdown?: boolean;
  routeId: R;
  inputs?: React.ReactNode[];
}) {
  const { filters } = useFilters(routeId);
  return (
    <div className="flex flex-col gap-y-3 p-2">
      <SelectedIdsFacetedFilter routeId={routeId} />
      {inputs && inputs.length > 0
        ? inputs.map((input, index) =>
            React.isValidElement(input) ? (
              <React.Fragment key={`dropdown-menu-item-input-${index}`}>
                {React.cloneElement(input, { key: input.key || `dropdown-menu-item-input-${index}` })}
              </React.Fragment>
            ) : null,
          )
        : null}
      <DatePickerWithRange routeId={routeId} />
      {IsColumnFiltered(filters as Filters<R>) && (
        <>
          <DropdownMenuSeparator />
          <ResetButton routeId={routeId} />
        </>
      )}
    </div>
  );
}

function DropdownMenuToolbarFilter<R extends RouteIds<RegisteredRouter['routeTree']>>({
  buttonText,
  routeId,
  inputs,
}: {
  buttonText?: string;
  inputs?: React.ReactNode[];
  routeId: R;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild className="xl:hidden">
        <Button variant="outline" className="h-8 space-x-2 data-[state=open]:bg-muted">
          <Filter className="h-4 w-4" />
          <span>{buttonText ?? 'Filtros'}</span>
          <span className="sr-only">Open menu</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="min-w-[8rem] max-w-[225px] p-2">
        <div className="flex justify-between">
          <DropdownMenuLabel>{buttonText ?? 'Filtros'}</DropdownMenuLabel>
          <PopoverClose>
            <Cross2Icon />
          </PopoverClose>
        </div>
        <DropdownMenuSeparator />
        <DropdownToolbarFilter routeId={routeId} inputs={inputs} />
      </PopoverContent>
    </Popover>
  );
}

export function DataTableToolbar<TData, R extends RouteIds<RegisteredRouter['routeTree']>>({
  table,
  Action,
  buttonText,
  routeId,
  inputs,
}: DataTableToolbarProps<TData> & {
  Action: React.ReactNode;
  inputs?: React.ReactNode[];
  buttonText?: string;
  routeId: R;
}) {
  return (
    <div className="flex items-center justify-between gap-x-2">
      <div className="flex flex-1 items-start justify-start gap-2 max-xl:hidden">
        <ToolbarFilter routeId={routeId} inputs={inputs} />
      </div>
      <DropdownMenuToolbarFilter buttonText={buttonText} routeId={routeId} inputs={inputs} />
      <div className="flex space-x-3">
        {Action}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
