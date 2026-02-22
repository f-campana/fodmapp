export type TokenPrimitive = string | number | boolean;
export type TokenRecord = Record<string, unknown>;
export type TokenSortDirection = "asc" | "desc";

export interface TokenSortOption {
  key: string;
  label: string;
}

export interface TokenRow {
  id: string;
  path: string;
  value: TokenPrimitive;
  valueText: string;
}

const scaleTokenOrder: Record<string, number> = {
  none: 0,
  auto: 1,
  px: 2,
  xxs: 3,
  xs: 4,
  sm: 5,
  md: 6,
  lg: 7,
  xl: 8,
  "2xl": 9,
  "3xl": 10,
  "4xl": 11,
  "5xl": 12,
  "6xl": 13,
  "7xl": 14,
  "8xl": 15,
  "9xl": 16,
  full: 17,
  base: 18,
};

function isRecord(value: unknown): value is TokenRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTokenPrimitive(value: unknown): value is TokenPrimitive {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function parseFractionLike(segment: string): number | null {
  const match = segment.match(/^(\d+)_(\d+)$/);
  if (!match) {
    return null;
  }

  const whole = Number.parseInt(match[1], 10);
  const fraction = Number.parseInt(match[2], 10);
  if (!Number.isFinite(whole) || !Number.isFinite(fraction)) {
    return null;
  }

  return Number(`${whole}.${fraction}`);
}

function parseNumberLike(segment: string): number | null {
  if (/^-?\d+(\.\d+)?$/.test(segment)) {
    const parsed = Number.parseFloat(segment);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const fraction = parseFractionLike(segment);
  if (fraction !== null) {
    return fraction;
  }

  return null;
}

function parseScaleLike(segment: string): number | null {
  const lowered = segment.toLowerCase();
  if (lowered in scaleTokenOrder) {
    return scaleTokenOrder[lowered];
  }

  const match = lowered.match(/^(\d+)xl$/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1], 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return scaleTokenOrder.xl + parsed - 1;
}

function comparePathSegment(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  const leftNumber = parseNumberLike(left);
  const rightNumber = parseNumberLike(right);
  if (leftNumber !== null && rightNumber !== null) {
    return leftNumber - rightNumber;
  }

  const leftScale = parseScaleLike(left);
  const rightScale = parseScaleLike(right);
  if (leftScale !== null && rightScale !== null) {
    return leftScale - rightScale;
  }

  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function naturalTokenPathCompare(
  leftPath: string,
  rightPath: string,
): number {
  if (leftPath === rightPath) {
    return 0;
  }

  const leftSegments = leftPath.split(".");
  const rightSegments = rightPath.split(".");
  const maxLength = Math.max(leftSegments.length, rightSegments.length);

  for (let index = 0; index < maxLength; index += 1) {
    const left = leftSegments[index];
    const right = rightSegments[index];

    if (left === undefined) {
      return -1;
    }
    if (right === undefined) {
      return 1;
    }

    const compare = comparePathSegment(left, right);
    if (compare !== 0) {
      return compare;
    }
  }

  return 0;
}

function sortObjectKeys(keys: string[]) {
  return [...keys].sort((left, right) => comparePathSegment(left, right));
}

export function asRecord(value: unknown, label: string): TokenRecord {
  if (!isRecord(value)) {
    throw new Error(`Expected object token node at "${label}".`);
  }

  return value;
}

export function tokenPrimitiveToString(value: TokenPrimitive): string {
  return typeof value === "string" ? value : String(value);
}

export function flattenTokenTree(node: unknown, prefix = ""): TokenRow[] {
  if (!isRecord(node)) {
    return [];
  }

  const rows: TokenRow[] = [];

  const walk = (current: unknown, path: string) => {
    if (isTokenPrimitive(current)) {
      rows.push({
        id: path,
        path,
        value: current,
        valueText: tokenPrimitiveToString(current),
      });
      return;
    }

    if (!isRecord(current)) {
      return;
    }

    for (const key of sortObjectKeys(Object.keys(current))) {
      const nextPath = path ? `${path}.${key}` : key;
      walk(current[key], nextPath);
    }
  };

  walk(node, prefix);
  rows.sort((left, right) => naturalTokenPathCompare(left.path, right.path));
  return rows;
}

export function stripPathPrefix(path: string, prefix: string): string {
  return path.startsWith(`${prefix}.`) ? path.slice(prefix.length + 1) : path;
}

export function countTokenLeaves(node: unknown): number {
  return flattenTokenTree(node).length;
}

export function isColorTokenValue(value: string): boolean {
  return (
    value.startsWith("oklch(") ||
    value.startsWith("#") ||
    value.startsWith("rgb(") ||
    value.startsWith("hsl(")
  );
}

export function parseNumberish(value: string): number | null {
  const unitMatch = value.trim().match(/^(-?\d+(?:\.\d+)?)(rem|px|ms|s|em)?$/);
  if (!unitMatch) {
    return null;
  }

  const parsed = Number.parseFloat(unitMatch[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function compareValueText(left: string, right: string): number {
  const leftParsed = parseNumberish(left);
  const rightParsed = parseNumberish(right);

  if (leftParsed !== null && rightParsed !== null) {
    return leftParsed - rightParsed;
  }

  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export function normalizeSearchText(...parts: string[]): string {
  return parts.join(" ").toLowerCase();
}

export function normalizeFilterQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function createSortOptions(
  ...entries: Array<[key: string, label: string]>
): TokenSortOption[] {
  return entries.map(([key, label]) => ({ key, label }));
}

export function countVisibleRows<
  Row extends { path: string; searchText?: string },
>(rows: Row[], query: string): number {
  const normalizedQuery = normalizeFilterQuery(query);
  if (normalizedQuery.length === 0) {
    return rows.length;
  }

  return rows.filter((row) => {
    const haystack = normalizeSearchText(row.path, row.searchText ?? "");
    return haystack.includes(normalizedQuery);
  }).length;
}

export function groupRowsBySegment(
  rows: TokenRow[],
  pathSegmentIndex: number,
): Array<{ id: string; label: string; rows: TokenRow[] }> {
  const grouped = new Map<string, TokenRow[]>();

  for (const row of rows) {
    const segments = row.path.split(".");
    const key = segments[pathSegmentIndex] ?? "misc";
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(row);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => comparePathSegment(left, right))
    .map(([key, groupRows]) => ({
      id: key,
      label: key,
      rows: [...groupRows].sort((left, right) =>
        naturalTokenPathCompare(left.path, right.path),
      ),
    }));
}
