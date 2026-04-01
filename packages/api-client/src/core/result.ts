export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

export function mapApiResult<TInput, TOutput>(
  result: ApiResult<TInput>,
  mapper: (value: TInput) => TOutput,
): ApiResult<TOutput> {
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: mapper(result.data),
  };
}
