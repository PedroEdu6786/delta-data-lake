import { Response } from 'express';

export class StreamingResponseHelper {
  static async streamJsonArray<T>(
    res: Response,
    dataStream: AsyncGenerator<T, void>,
  ): Promise<void> {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.write('[');

    let isFirst = true;

    try {
      for await (const item of dataStream) {
        if (!isFirst) res.write(',');
        res.write(JSON.stringify(item));
        isFirst = false;
      }

      res.write(']');
      res.end();
    } catch (err) {
      res.write(']');
      res.end();
      throw err;
    }
  }
}
