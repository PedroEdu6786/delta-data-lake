type PaginateWithTokenFunction<TResult = unknown> = (
  token?: string,
) => Promise<{
  elements: TResult[];
  nextToken?: string;
}>;

type ExtractPaginateWithTokenResult<T> =
  T extends PaginateWithTokenFunction<infer R> ? R : never;

export async function unfoldTokens<TFn extends PaginateWithTokenFunction>(
  asyncFn: TFn,
): Promise<ExtractPaginateWithTokenResult<TFn>[]> {
  const allElements: ExtractPaginateWithTokenResult<TFn>[] = [];
  let nextToken: string | undefined = undefined;

  do {
    const { elements, nextToken: token } = await asyncFn(nextToken);
    allElements.push(...(elements as ExtractPaginateWithTokenResult<TFn>[]));
    nextToken = token;
  } while (nextToken);

  return allElements;
}
