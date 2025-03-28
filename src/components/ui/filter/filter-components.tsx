import { useMemo, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";
import { Checkbox } from "../checkbox";
import type { FilterDefinition } from "./filter-panel";

type OptionFilterOption = {
  value: string;
  label: string;
};

export const optionFilterComponent: FilterDefinition<{
  options: OptionFilterOption[];
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
}> = {
  Controller({ value, onValueChange, options }) {
    const [search, setSearch] = useState("");

    return (
      <Command loop>
        <CommandInput
          autoFocus
          placeholder="Search..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandEmpty>No results.</CommandEmpty>
        <CommandList>
          <CommandGroup>
            {options.map((v) => {
              const checked = value === v.value;

              return (
                <CommandItem
                  key={v.value}
                  onSelect={() => {
                    onValueChange(v.value);
                  }}
                  className="group flex items-center justify-between gap-1.5"
                >
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      checked={checked}
                      className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100"
                    />
                    <span>{v.label}</span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    );
  },

  Display({ value, options }) {
    const selectedOption = useMemo(() => {
      return options.find((o) => o.value === value);
    }, [options, value]);

    if (!selectedOption) return null;

    const { label } = selectedOption;
    return (
      <span className="inline-flex items-center gap-1">
        <span>{label}</span>
      </span>
    );
  },
};
