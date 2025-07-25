import { Response } from 'express';
import { StreamingResponseHelper } from './streaming-response.helper';

describe('StreamingResponseHelper', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      setHeader: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
  });

  describe('streamJsonArray', () => {
    it('should stream empty array correctly', async () => {
      async function* emptyGenerator() {
        // Empty generator
      }

      await StreamingResponseHelper.streamJsonArray(
        mockResponse as Response,
        emptyGenerator(),
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Transfer-Encoding',
        'chunked',
      );
      expect(mockResponse.write).toHaveBeenCalledWith('[');
      expect(mockResponse.write).toHaveBeenCalledWith(']');
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should stream single item correctly', async () => {
      // eslint-disable-next-line @typescript-eslint/require-await
      async function* singleItemGenerator() {
        yield { id: 1, name: 'test' };
      }

      await StreamingResponseHelper.streamJsonArray(
        mockResponse as Response,
        singleItemGenerator(),
      );

      expect(mockResponse.write).toHaveBeenCalledWith('[');
      expect(mockResponse.write).toHaveBeenCalledWith('{"id":1,"name":"test"}');
      expect(mockResponse.write).toHaveBeenCalledWith(']');
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should stream multiple items with correct comma separation', async () => {
      // eslint-disable-next-line @typescript-eslint/require-await
      async function* multipleItemsGenerator() {
        yield { id: 1 };
        yield { id: 2 };
        yield { id: 3 };
      }

      await StreamingResponseHelper.streamJsonArray(
        mockResponse as Response,
        multipleItemsGenerator(),
      );

      expect(mockResponse.write).toHaveBeenCalledWith('[');
      expect(mockResponse.write).toHaveBeenCalledWith('{"id":1}');
      expect(mockResponse.write).toHaveBeenCalledWith(',');
      expect(mockResponse.write).toHaveBeenCalledWith('{"id":2}');
      expect(mockResponse.write).toHaveBeenCalledWith(',');
      expect(mockResponse.write).toHaveBeenCalledWith('{"id":3}');
      expect(mockResponse.write).toHaveBeenCalledWith(']');
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should handle generator error and still close array', async () => {
      // eslint-disable-next-line @typescript-eslint/require-await
      async function* errorGenerator() {
        yield { id: 1 };
        throw new Error('Generator error');
      }

      await expect(
        StreamingResponseHelper.streamJsonArray(
          mockResponse as Response,
          errorGenerator(),
        ),
      ).rejects.toThrow('Generator error');

      expect(mockResponse.write).toHaveBeenCalledWith('[');
      expect(mockResponse.write).toHaveBeenCalledWith('{"id":1}');
      expect(mockResponse.write).toHaveBeenCalledWith(']');
      expect(mockResponse.end).toHaveBeenCalled();
    });

    it('should handle complex objects correctly', async () => {
      // eslint-disable-next-line @typescript-eslint/require-await
      async function* complexGenerator() {
        yield {
          id: 1,
          nested: { value: 'test' },
          array: [1, 2, 3],
          nullValue: null,
        };
      }

      await StreamingResponseHelper.streamJsonArray(
        mockResponse as Response,
        complexGenerator(),
      );

      expect(mockResponse.write).toHaveBeenCalledWith(
        '{"id":1,"nested":{"value":"test"},"array":[1,2,3],"nullValue":null}',
      );
    });
  });
});
