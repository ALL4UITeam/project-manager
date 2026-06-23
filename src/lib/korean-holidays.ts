export type KoreanHoliday = {
  date: string;
  localName: string;
  name: string;
};

const CACHE_PREFIX = "kr-holidays-";
const memoryCache = new Map<number, Map<string, string>>();

async function fetchYearFromApi(year: number): Promise<Map<string, string>> {
  const res = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/KR`
  );
  if (!res.ok) {
    throw new Error(`공휴일 API 오류 (${year}): ${res.status}`);
  }
  const data = (await res.json()) as KoreanHoliday[];
  const map = new Map<string, string>();
  for (const item of data) {
    map.set(item.date, item.localName);
  }
  return map;
}

function readSessionCache(year: number): Map<string, string> | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${year}`);
    if (!raw) return null;
    const entries = JSON.parse(raw) as [string, string][];
    return new Map(entries);
  } catch {
    return null;
  }
}

function writeSessionCache(year: number, map: Map<string, string>) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      `${CACHE_PREFIX}${year}`,
      JSON.stringify([...map.entries()])
    );
  } catch {
    /* quota exceeded etc. */
  }
}

export async function fetchKoreanHolidaysForYear(
  year: number
): Promise<Map<string, string>> {
  if (memoryCache.has(year)) {
    return memoryCache.get(year)!;
  }

  const session = readSessionCache(year);
  if (session) {
    memoryCache.set(year, session);
    return session;
  }

  const map = await fetchYearFromApi(year);
  memoryCache.set(year, map);
  writeSessionCache(year, map);
  return map;
}

export async function fetchKoreanHolidaysForYears(
  years: number[]
): Promise<Map<string, string>> {
  const unique = [...new Set(years)];
  const maps = await Promise.all(unique.map(fetchKoreanHolidaysForYear));
  const merged = new Map<string, string>();
  for (const map of maps) {
    for (const [date, name] of map) {
      merged.set(date, name);
    }
  }
  return merged;
}
