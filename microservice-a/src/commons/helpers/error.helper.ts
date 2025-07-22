export function isError(error: unknown): error is Error {
  return (
    !!error &&
    typeof error === 'object' &&
    'name' in error &&
    'message' in error
  );
}

export function getErrorMessage(error: unknown): string {
  return error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
    ? error.message
    : 'Unknown error';
}
