"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { fetchKoreanHolidaysForYears } from "@/lib/korean-holidays";

export function useKoreanHolidays(years: number[]) {
  const yearKey = useMemo(
    () => [...new Set(years)].sort((a, b) => a - b).join(","),
    [years]
  );

  const [holidays, setHolidays] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const uniqueYears = yearKey.split(",").map(Number).filter(Boolean);

    setLoading(true);
    setError(null);

    fetchKoreanHolidaysForYears(uniqueYears)
      .then((map) => {
        if (!cancelled) {
          setHolidays(map);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "공휴일 정보를 불러오지 못했습니다"
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [yearKey]);

  const getHoliday = (date: Date) => holidays.get(format(date, "yyyy-MM-dd"));

  return { holidays, loading, error, getHoliday };
}
