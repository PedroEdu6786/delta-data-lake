import { unfoldTokens } from './unfold-tokens';

describe('unfoldTokens', () => {
  it('should unfold paginated results with tokens', async () => {
    const mockData = [
      { elements: ['item1', 'item2'], nextToken: 'token1' },
      { elements: ['item3', 'item4'], nextToken: 'token2' },
      { elements: ['item5'], nextToken: undefined },
    ];

    let callCount = 0;
    const mockFn = jest.fn().mockImplementation(() => {
      return Promise.resolve(mockData[callCount++]);
    });

    const generator = unfoldTokens(mockFn);
    const results: unknown[] = [];

    for await (const item of generator) {
      results.push(item);
    }

    expect(results).toEqual(['item1', 'item2', 'item3', 'item4', 'item5']);
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(mockFn).toHaveBeenNthCalledWith(1, undefined);
    expect(mockFn).toHaveBeenNthCalledWith(2, 'token1');
    expect(mockFn).toHaveBeenNthCalledWith(3, 'token2');
  });

  it('should handle empty results', async () => {
    const mockFn = jest.fn().mockResolvedValue({
      elements: [],
      nextToken: undefined,
    });

    const generator = unfoldTokens(mockFn);
    const results: unknown[] = [];

    for await (const item of generator) {
      results.push(item);
    }

    expect(results).toEqual([]);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle single page results', async () => {
    const mockFn = jest.fn().mockResolvedValue({
      elements: ['only-item'],
      nextToken: undefined,
    });

    const generator = unfoldTokens(mockFn);
    const results: unknown[] = [];

    for await (const item of generator) {
      results.push(item);
    }

    expect(results).toEqual(['only-item']);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle function that returns no nextToken immediately', async () => {
    const mockFn = jest.fn().mockResolvedValue({
      elements: ['item1', 'item2'],
      nextToken: null,
    });

    const generator = unfoldTokens(mockFn);
    const results: unknown[] = [];

    for await (const item of generator) {
      results.push(item);
    }

    expect(results).toEqual(['item1', 'item2']);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
