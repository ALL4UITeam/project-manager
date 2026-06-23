"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function YearFilterSelect({
  years,
  value,
  onChange,
  className,
}: {
  years: number[];
  value: number;
  onChange: (year: number) => void;
  className?: string;
}) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(parseInt(v, 10))}
    >
      <SelectTrigger className={className ?? "w-28"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {years.map((y) => (
          <SelectItem key={y} value={String(y)}>
            {y}년
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
