import {
  buildApiUrl as buildSharedApiUrl,
  resolveApiBase as resolveSharedApiBase,
} from "@fodmapp/api-client";

import { getClientRuntimeEnv } from "../env.client";

export function resolveApiBase(
  apiBase: string | null = getClientRuntimeEnv().apiBaseUrl,
): string | null {
  return resolveSharedApiBase(apiBase);
}

export function buildApiUrl(
  path: string,
  apiBase: string | null = getClientRuntimeEnv().apiBaseUrl,
): string | null {
  return buildSharedApiUrl(path, apiBase);
}
