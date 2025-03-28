import { type Table, type RowData } from "@tanstack/react-table";
import { type LucideIcon } from "lucide-react";
import React, { useMemo } from "react";
import type { FilterItem } from "./filter-panel";
import { optionFilterComponent } from "./filter-components";

export interface ColumnOption {
  /* The label to display for the option. */
  label: string;
  /* The internal value of the option. */
  value: string;
  /* An optional icon to display next to the label. */
  icon?: React.ReactElement | React.ElementType;
}

export type ElementType<T> = T extends (infer U)[] ? U : T;

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filter: {
      /* The display name of the column. */
      label: string;

      /* The column icon. */
      icon: LucideIcon;

      /* The data type of the column. */
      type: "option";

      /* An optional list of options for the column. */
      /* This is used for columns with type 'option' or 'multiOption'. */
      /* If the options are known ahead of time, they can be defined here. */
      /* Otherwise, they will be dynamically generated based on the data. */
      options?: ColumnOption[];

      /* An optional function to transform columns with type 'option' or 'multiOption'. */
      /* This is used to convert each raw option into a ColumnOption. */
      transformOptionFn?: (
        value: ElementType<NonNullable<TValue>>
      ) => ColumnOption;
    };
  }
}

type DataTableFilterComponents = {
  option: typeof optionFilterComponent;
};

export const dataTableFilterComponents: DataTableFilterComponents = {
  option: optionFilterComponent,
};

export type DataTableFilterItem = FilterItem<DataTableFilterComponents>;

export function useDataTableFilterItems<TData>({
  table,
}: {
  table: Table<TData>;
}) {
  const columns = table
    .getAllColumns()
    .filter((column) => column.getCanFilter())
    .map((column) => {
      const filterDef = column.columnDef.meta?.filter;
      if (!filterDef) return;
      return { column, filterDef };
    })
    //
    .filter(nonNullableFilter);

  const filters: DataTableFilterItem[] = useMemo(
    () =>
      columns.map(({ column, filterDef }) => {
        const options = (() => {
          if (filterDef.options) return filterDef.options;

          return Array.from(column.getFacetedUniqueValues().keys())
            .sort()
            .slice(0, 5000)
            .map((v) => {
              if (filterDef.transformOptionFn) {
                return filterDef.transformOptionFn(v);
              }

              return { label: v, value: v };
            });
        })();

        const value = column?.getFilterValue() as string | undefined;

        return {
          type: "option",
          config: {
            options,
            value,
            onValueChange(value) {
              column?.setFilterValue(value);
            },
          },
          icon: filterDef.icon,
          label: filterDef.label,
          isSet: value !== undefined,
          isEnabled: true,
          remove: () => column?.setFilterValue(undefined),
        } satisfies DataTableFilterItem;
      }),
    [columns]
  );

  return filters;
}

export function nonNullableFilter<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}
