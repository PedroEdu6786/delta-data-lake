type PaginateWithTokenFunction<TResult = any> = (token?: string) => Promise<{
  elements: TResult[];
  nextToken?: string;
}>;

type ExtractPaginateWithTokenResult<T> =
  T extends PaginateWithTokenFunction<infer R> ? R : never;

const END = Symbol('END');

const unfold = async function* <TState, TValue>(
  generator: (state: TState) => Promise<[TValue[], TState] | undefined>,
  state: TState,
) {
  do {
    const result = await generator(state);
    if (result === undefined) {
      break;
    }
    const [value, newState] = result;
    yield* value;
    state = newState;
  } while (true);
};

export function unfoldTokens<TFn extends PaginateWithTokenFunction>(
  asyncFn: TFn,
): AsyncGenerator<ExtractPaginateWithTokenResult<TFn>> {
  return unfold<
    typeof END | null | undefined | string,
    ExtractPaginateWithTokenResult<TFn>
  >(
    async (token) => {
      if (!token) {
        return;
      }

      const { elements, nextToken } = await asyncFn(
        token === END ? undefined : token,
      );

      return [elements, nextToken];
    },
    END as typeof END | null | undefined | string,
  );
}
