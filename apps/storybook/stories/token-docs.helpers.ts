export type TokenPrimitive = string | number | boolean;
export type TokenRecord = Record<string, unknown>;

export interface FlatTokenRow {
  path: string;
  value: TokenPrimitive;
}

function isRecord(value: unknown): value is TokenRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTokenPrimitive(value: unknown): value is TokenPrimitive {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

export function asRecord(value: unknown, label: string): TokenRecord {
  if (!isRecord(value)) {
    throw new Error(`Expected object token node at "${label}".`);
  }

  return value;
}

export function flattenTokenTree(node: unknown, prefix = ""): FlatTokenRow[] {
  if (!isRecord(node)) {
    return [];
  }

  const rows: FlatTokenRow[] = [];

  const walk = (current: unknown, path: string) => {
    if (isTokenPrimitive(current)) {
      rows.push({ path, value: current });
      return;
    }

    if (!isRecord(current)) {
      return;
    }

    const keys = Object.keys(current).sort((left, right) => left.localeCompare(right));
    for (const key of keys) {
      const nextPath = path ? `${path}.${key}` : key;
      walk(current[key], nextPath);
    }
  };

  walk(node, prefix);
  rows.sort((left, right) => left.path.localeCompare(right.path));
  return rows;
}

export function tokenValueToString(value: TokenPrimitive): string {
  return typeof value === "string" ? value : String(value);
}

export function stripPathPrefix(path: string, prefix: string): string {
  return path.startsWith(`${prefix}.`) ? path.slice(prefix.length + 1) : path;
}

export function parseScalarNumber(value: string | number): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = value.trim();
  if (normalized.endsWith("rem") || normalized.endsWith("px") || normalized.endsWith("ms")) {
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
