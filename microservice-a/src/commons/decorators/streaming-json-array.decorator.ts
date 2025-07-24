import { SetMetadata } from '@nestjs/common';

export const STREAMING_JSON_ARRAY_KEY = 'streaming_json_array';
export const StreamingJsonArray = () =>
  SetMetadata(STREAMING_JSON_ARRAY_KEY, true);
