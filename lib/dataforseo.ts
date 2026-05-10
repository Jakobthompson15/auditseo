import "server-only";

const BASE = "https://api.dataforseo.com";

function authHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN ?? "";
  const password = process.env.DATAFORSEO_PASSWORD ?? "";
  if (!login || !password) {
    throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD env vars must be set");
  }
  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

// ── HTTP helpers ───────────────────────────────────────────────────────────

export async function dfsPost<T = unknown>(path: string, body: unknown[]): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DataForSEO HTTP ${res.status} on ${path}: ${text.slice(0, 300)}`);
  }
  return extractResult<T>(await res.json(), path);
}

async function dfsGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    next: { revalidate: 86400 }, // Next.js data cache — 24h
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DataForSEO HTTP ${res.status} on ${path}: ${text.slice(0, 300)}`);
  }
  return extractResult<T>(await res.json(), path);
}

function extractResult<T>(json: unknown, path: string): T {
  const j = json as { tasks?: Array<{ status_code: number; status_message: string; result: unknown }> };
  const task = j.tasks?.[0];
  if (!task) throw new Error(`No task in DataForSEO response: ${path}`);
  if (task.status_code !== 20000) {
    throw new Error(`DataForSEO [${task.status_code}]: ${task.status_message}`);
  }
  return (task.result ?? []) as T;
}

// ── Location resolution ────────────────────────────────────────────────────

interface LocationEntry {
  location_code: number;
  location_name: string;      // e.g. "Austin,Texas,United States"
  location_code_parent: number | null;
  country_iso_code: string;   // e.g. "US"
  location_type: string;      // "Country" | "State" | "City" | ...
}

// Module-level cache — survives across requests in the same server instance
let locationsCache: LocationEntry[] | null = null;
let locationsCachedAt = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function fetchLocations(): Promise<LocationEntry[]> {
  const now = Date.now();
  if (locationsCache && now - locationsCachedAt < CACHE_TTL_MS) return locationsCache;
  const result = await dfsGet<LocationEntry[]>("/v3/dataforseo_labs/locations_and_languages");
  locationsCache = Array.isArray(result) ? result : [];
  locationsCachedAt = now;
  return locationsCache;
}

function normalizeInput(s: string): string {
  return s.toLowerCase().trim().replace(/\s*,\s*/g, ",");
}

// State abbreviation → full name (US only)
const STATE_ABBR: Record<string, string> = {
  al:"Alabama", ak:"Alaska", az:"Arizona", ar:"Arkansas", ca:"California",
  co:"Colorado", ct:"Connecticut", de:"Delaware", fl:"Florida", ga:"Georgia",
  hi:"Hawaii", id:"Idaho", il:"Illinois", in:"Indiana", ia:"Iowa",
  ks:"Kansas", ky:"Kentucky", la:"Louisiana", me:"Maine", md:"Maryland",
  ma:"Massachusetts", mi:"Michigan", mn:"Minnesota", ms:"Mississippi", mo:"Missouri",
  mt:"Montana", ne:"Nebraska", nv:"Nevada", nh:"New Hampshire", nj:"New Jersey",
  nm:"New Mexico", ny:"New York", nc:"North Carolina", nd:"North Dakota", oh:"Ohio",
  ok:"Oklahoma", or:"Oregon", pa:"Pennsylvania", ri:"Rhode Island", sc:"South Carolina",
  sd:"South Dakota", tn:"Tennessee", tx:"Texas", ut:"Utah", vt:"Vermont",
  va:"Virginia", wa:"Washington", wv:"West Virginia", wi:"Wisconsin", wy:"Wyoming",
  dc:"District of Columbia",
};

function expandAbbreviations(input: string): string {
  // Turn "Austin, TX" → "Austin, Texas" so it can match DataForSEO names
  return input.replace(/\b([A-Za-z]{2})\b/g, (match) => {
    const full = STATE_ABBR[match.toLowerCase()];
    return full ?? match;
  });
}

/**
 * Resolves a user-entered location string to a DataForSEO location_code.
 *
 * @param input   - Free-text city/state/country (e.g. "Austin", "Austin, TX", "United States")
 * @param cityLevel - true → return the most specific (city) match; false (default) → return country-level
 */
export async function resolveLocationCode(
  input: string,
  cityLevel = false
): Promise<number> {
  const DEFAULT = 2840; // United States
  if (!input.trim()) return DEFAULT;

  let locations: LocationEntry[];
  try {
    locations = await fetchLocations();
  } catch {
    return DEFAULT;
  }

  const expanded = expandAbbreviations(input);
  const normalized = normalizeInput(expanded);

  // 1. Exact match against location_name (case-insensitive)
  let match = locations.find(l => normalizeInput(l.location_name) === normalized);

  // 2. First segment match — user typed just the city name, e.g. "Austin"
  if (!match) {
    match = locations.find(l => {
      const first = l.location_name.split(",")[0].toLowerCase();
      return first === normalized && l.country_iso_code === "US";
    });
  }

  // 3. All user words appear somewhere in location_name
  if (!match) {
    const words = normalized.split(/[\s,]+/).filter(w => w.length > 2);
    match = locations.find(l => {
      const lname = normalizeInput(l.location_name);
      return words.every(w => lname.includes(w));
    });
  }

  if (!match) return DEFAULT;

  // If caller wants city-level, return the matched code directly
  if (cityLevel) return match.location_code;

  // Otherwise return the country-level code for the matched location
  // (Labs competitive analysis works best at country level)
  if (match.location_type === "Country") return match.location_code;

  const countryEntry = locations.find(
    l => l.country_iso_code === match!.country_iso_code && l.location_type === "Country"
  );
  return countryEntry?.location_code ?? DEFAULT;
}
