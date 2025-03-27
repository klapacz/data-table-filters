import { type LucideIcon, ArrowRight, Filter, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { Button } from "../button";
import { Separator } from "../separator";
import { cn } from "@/lib/utils";

export type BaseFilterMeta = Record<string, unknown>;

export type FilterController<TMeta extends BaseFilterMeta> = {
  Display: React.FC<TMeta>;
  Controller: React.FC<TMeta>;
};

export type FilterRegistry<TType extends string = string> = {
  [K in TType]: FilterController<any>;
};

type FilterItemBaseFields = {
  label: string;
  icon: LucideIcon;
  isEnabled: boolean;
  isSet: boolean;
  remove: (() => void) | false;
};

export type FilterItem<TRegistry extends FilterRegistry> =
  FilterItemBaseFields & FilterItemControllerFields<TRegistry>;

type FilterItemControllerFields<TRegistry extends FilterRegistry> = {
  [K in keyof TRegistry]: {
    type: K;
    meta: TRegistry[K] extends FilterController<infer M> ? M : never;
  };
}[keyof TRegistry];

type FiltersProps<TRegistry extends FilterRegistry> = {
  registry: TRegistry;
  filters: FilterItem<TRegistry>[];
};

export function FilterContainer<TRegistry extends FilterRegistry>({
  filters,
  registry,
}: FiltersProps<TRegistry>) {
  return (
    <div className="flex w-full items-start justify-between gap-2">
      <div className="flex h-full w-full items-stretch gap-2">
        <TableFilter filters={filters} registry={registry} />
        <PropertyFilterList filters={filters} registry={registry} />
      </div>
    </div>
  );
}

export function TableFilter<TRegistry extends FilterRegistry>({
  filters,
  registry,
}: FiltersProps<TRegistry>) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [selectedFilterLabel, setSelectedFilterLabel] = useState<
    string | undefined
  >(undefined);
  const selectedFilter = useMemo(() => {
    if (!selectedFilterLabel) return undefined;
    return filters.find((filter) => filter.label === selectedFilterLabel);
  }, [selectedFilterLabel, filters]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedFilterLabel && inputRef) {
      inputRef.current?.focus();
      setValue("");
    }
  }, [selectedFilterLabel]);

  useEffect(() => {
    if (!open) setTimeout(() => setValue(""), 150);
  }, [open]);

  const hasFilters = useMemo(() => {
    for (const filter of filters) {
      if (filter.isSet) {
        return true;
      }
    }
  }, [filters]);

  const content = useMemo(() => {
    if (selectedFilter) {
      const Component = registry[selectedFilter.type]?.Controller;

      if (!Component) return null;

      return <Component {...selectedFilter.meta} />;
    }

    return (
      <Command loop>
        <CommandInput
          value={value}
          onValueChange={setValue}
          ref={inputRef}
          placeholder="Search..."
        />
        <CommandEmpty>No results.</CommandEmpty>
        <CommandList className="max-h-fit">
          <CommandGroup>
            {filters.map((filter) => (
              <TableFilterMenuItem
                key={filter.label}
                filter={filter}
                setFilter={setSelectedFilterLabel}
              />
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    );
  }, [selectedFilter, value, filters, registry]);

  return (
    <Popover
      open={open}
      onOpenChange={async (value) => {
        setOpen(value);
        if (!value) setTimeout(() => setSelectedFilterLabel(undefined), 100);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("h-7", hasFilters && "w-fit")}>
          <Filter className="size-4" />
          {!hasFilters && <span>Filter</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

export function TableFilterMenuItem<TRegistry extends FilterRegistry>({
  filter,
  setFilter,
}: {
  filter: FilterItem<TRegistry>;
  setFilter: (value: string) => void;
}) {
  return (
    <CommandItem
      onSelect={() => setFilter(filter.label)}
      className="group"
      disabled={!filter.isEnabled}
    >
      <div className="flex w-full items-center justify-between">
        <div className="inline-flex items-center gap-1.5">
          <filter.icon strokeWidth={2.25} className="size-4" />
          <span>{filter.label}</span>
        </div>
        <ArrowRight className="size-4 opacity-0 group-aria-selected:opacity-100" />
      </div>
    </CommandItem>
  );
}

export function PropertyFilterList<TRegistry extends FilterRegistry>({
  filters,
  registry,
}: FiltersProps<TRegistry>) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {filters.map((filter) => {
        // Skip if no filter value
        if (!filter.isSet) return null;

        return (
          <PropertyFilterListItem
            registry={registry}
            filter={filter}
            key={filter.label}
          />
        );
      })}
    </div>
  );
}

// Generic render function for a filter with type-safe value
export function PropertyFilterListItem<TRegistry extends FilterRegistry>({
  filter,
  registry,
}: {
  filter: FilterItem<TRegistry>;
  registry: TRegistry;
}) {
  return (
    <div
      key={`filter-${filter.label}`}
      className="flex h-7 items-center rounded-2xl border border-border bg-background shadow-xs"
    >
      <PropertyFilterSubject filter={filter} />
      <Separator orientation="vertical" />
      <PropertyFilterValueController filter={filter} registry={registry} />
      {filter.remove !== false ? (
        <>
          <Separator orientation="vertical" />
          <Button
            variant="ghost"
            className="rounded-none rounded-r-2xl text-xs w-7 h-full"
            onClick={() => filter.remove && filter.remove()}
          >
            <X className="size-4 -translate-x-0.5" />
          </Button>
        </>
      ) : null}
    </div>
  );
}

/****** Property Filter Subject ******/

export function PropertyFilterSubject<TRegistry extends FilterRegistry>({
  filter,
}: {
  filter: FilterItem<TRegistry>;
}) {
  return (
    <span className="flex select-none items-center gap-1 whitespace-nowrap px-2 font-medium">
      {filter.icon ? <filter.icon className="size-4 stroke-[2.25px]" /> : null}
      <span>{filter.label}</span>
    </span>
  );
}

/****** Property Filter Value ******/

export function PropertyFilterValueController<
  TRegistry extends FilterRegistry
>({
  filter,
  registry,
}: {
  filter: FilterItem<TRegistry>;
  registry: TRegistry;
}) {
  const Display = registry[filter.type]?.Display;
  const Controller = registry[filter.type]?.Controller;

  if (!Controller || !Display) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="m-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs"
        >
          <Display {...filter.meta} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
      >
        <Controller {...filter.meta} />
      </PopoverContent>
    </Popover>
  );
}
