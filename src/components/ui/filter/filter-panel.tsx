import { type LucideIcon, ArrowRight, Filter } from "lucide-react";
import { X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export type FilterConfig = Record<string, unknown>;

export type FilterDefinition<TConfig extends FilterConfig> = {
  Display: React.FC<TConfig>;
  Controller: React.FC<TConfig>;
};

export type FilterComponents<TType extends string = string> = {
  [K in TType]: FilterDefinition<any>;
};

type FilterItemBase = {
  label: string;
  icon: LucideIcon;
  isEnabled: boolean;
  isSet: boolean;
  remove: (() => void) | false;
};

type FilterItemTypeConfig<TComponents extends FilterComponents> = {
  [K in keyof TComponents]: {
    type: K;
    config: TComponents[K] extends FilterDefinition<infer TConfig>
      ? TConfig
      : never;
  };
}[keyof TComponents];

export type FilterItem<TComponents extends FilterComponents> = FilterItemBase &
  FilterItemTypeConfig<TComponents>;

type FilterPanelProps<TComponents extends FilterComponents> = {
  components: TComponents;
  items: FilterItem<TComponents>[];
};

export function FilterPanel<TComponents extends FilterComponents>({
  items,
  components,
}: FilterPanelProps<TComponents>) {
  return (
    <div className="flex w-full items-start justify-between gap-2">
      <div className="flex h-full w-full items-stretch gap-2">
        <FilterSelector items={items} components={components} />
        <FilterChips items={items} components={components} />
      </div>
    </div>
  );
}

export function FilterSelector<TComponents extends FilterComponents>({
  items,
  components,
}: FilterPanelProps<TComponents>) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [selectedFilterLabel, setSelectedFilterLabel] = useState<
    string | undefined
  >(undefined);
  const selectedFilter = useMemo(() => {
    if (!selectedFilterLabel) return undefined;
    return items.find((item) => item.label === selectedFilterLabel);
  }, [selectedFilterLabel, items]);
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
    for (const item of items) {
      if (item.isSet) {
        return true;
      }
    }
  }, [items]);

  const content = useMemo(() => {
    if (selectedFilter) {
      const Component = components[selectedFilter.type]?.Controller;

      if (!Component) return null;

      return <Component {...selectedFilter.config} />;
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
            {items.map((item) => (
              <FilterSelectorMenuItem
                key={item.label}
                item={item}
                setFilter={setSelectedFilterLabel}
              />
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    );
  }, [selectedFilter, value, items, components]);

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

export function FilterSelectorMenuItem<TComponents extends FilterComponents>({
  item,
  setFilter,
}: {
  item: FilterItem<TComponents>;
  setFilter: (value: string) => void;
}) {
  return (
    <CommandItem
      onSelect={() => setFilter(item.label)}
      className="group"
      disabled={!item.isEnabled}
    >
      <div className="flex w-full items-center justify-between">
        <div className="inline-flex items-center gap-1.5">
          <item.icon strokeWidth={2.25} className="size-4" />
          <span>{item.label}</span>
        </div>
        <ArrowRight className="size-4 opacity-0 group-aria-selected:opacity-100" />
      </div>
    </CommandItem>
  );
}

export function FilterChips<TComponents extends FilterComponents>({
  items,
  components,
}: FilterPanelProps<TComponents>) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {items.map((item) => {
        // Skip if no item value
        if (!item.isSet) return null;

        return (
          <FilterChip components={components} item={item} key={item.label} />
        );
      })}
    </div>
  );
}

export function FilterChip<TComponents extends FilterComponents>({
  item,
  components,
}: {
  item: FilterItem<TComponents>;
  components: TComponents;
}) {
  return (
    <div
      key={`item-${item.label}`}
      className="flex h-7 items-center rounded-2xl border border-border bg-background shadow-xs"
    >
      <FilterChipLabel item={item} />
      <Separator orientation="vertical" />
      <FilterChipValue item={item} components={components} />
      {item.remove !== false ? (
        <>
          <Separator orientation="vertical" />
          <Button
            variant="ghost"
            className="rounded-none rounded-r-2xl text-xs w-7 h-full"
            onClick={() => item.remove && item.remove()}
          >
            <X className="size-4 -translate-x-0.5" />
          </Button>
        </>
      ) : null}
    </div>
  );
}

export function FilterChipLabel<TComponents extends FilterComponents>({
  item,
}: {
  item: FilterItem<TComponents>;
}) {
  return (
    <span className="flex select-none items-center gap-1 whitespace-nowrap px-2 font-medium">
      {item.icon ? <item.icon className="size-4 stroke-[2.25px]" /> : null}
      <span>{item.label}</span>
    </span>
  );
}

export function FilterChipValue<TComponents extends FilterComponents>({
  item,
  components,
}: {
  item: FilterItem<TComponents>;
  components: TComponents;
}) {
  const itemComponents = components[item.type];

  if (!itemComponents) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="m-0 h-full w-fit whitespace-nowrap rounded-none p-0 px-2 text-xs"
        >
          <itemComponents.Display {...item.config} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-fit p-0 origin-(--radix-popover-content-transform-origin)"
      >
        <itemComponents.Controller {...item.config} />
      </PopoverContent>
    </Popover>
  );
}
