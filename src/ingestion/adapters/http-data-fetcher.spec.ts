import { HttpDataFetcher } from './http-data-fetcher';

jest.mock('axios');
jest.mock('stream-json', () => ({
  parser: jest.fn(),
}));
jest.mock('stream-json/streamers/StreamArray', () => ({
  streamArray: jest.fn(),
}));

import axios from 'axios';
import { Readable } from 'stream';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

const mockedParser = jest.mocked(parser);
const mockedStreamArray = jest.mocked(streamArray);

describe('HttpDataFetcher', () => {
  let fetcher: HttpDataFetcher;

  beforeEach(() => {
    fetcher = new HttpDataFetcher();
    jest.clearAllMocks();
  });

  function setupMockStream(items: Record<string, unknown>[]): void {
    const readable = new Readable({
      objectMode: true,
      read() {
        for (const item of items) {
          this.push({ value: item });
        }
        this.push(null);
      },
    });

    // Add missing stream properties for destroy checks
    Object.defineProperty(readable, 'destroyed', {
      get: () => false,
      configurable: true,
    });

    const mockPipe = jest.fn().mockReturnThis();
    const mockInputStream = {
      pipe: mockPipe,
      on: jest.fn().mockReturnThis(),
      destroyed: false,
      destroy: jest.fn(),
    } as unknown as Readable;

    const mockParserStream = {
      pipe: jest.fn().mockReturnValue(readable),
      on: jest.fn().mockReturnThis(),
    };

    mockPipe.mockReturnValueOnce(mockParserStream);

    (axios.get as jest.Mock).mockResolvedValue({ data: mockInputStream });
    mockedParser.mockReturnValue({ on: jest.fn().mockReturnThis() } as unknown as ReturnType<typeof parser>);
    mockedStreamArray.mockReturnValue({} as unknown as ReturnType<typeof streamArray>);
  }

  it('should yield batches of the configured size', async () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ id: i }));
    setupMockStream(items);

    const batches: Record<string, unknown>[][] = [];
    for await (const batch of fetcher.fetch(
      'https://example.com/data.json',
      2,
    )) {
      batches.push(batch);
    }

    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(2);
    expect(batches[1]).toHaveLength(2);
    expect(batches[2]).toHaveLength(1);
  });

  it('should yield final batch with remaining items', async () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    setupMockStream(items);

    const batches: Record<string, unknown>[][] = [];
    for await (const batch of fetcher.fetch(
      'https://example.com/data.json',
      5,
    )) {
      batches.push(batch);
    }

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(3);
  });

  it('should yield no batches for empty stream', async () => {
    setupMockStream([]);

    const batches: Record<string, unknown>[][] = [];
    for await (const batch of fetcher.fetch(
      'https://example.com/data.json',
      10,
    )) {
      batches.push(batch);
    }

    expect(batches).toHaveLength(0);
  });

  it('should call axios with the correct url, responseType, signal, and timeout', async () => {
    setupMockStream([]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of fetcher.fetch('https://example.com/data.json')) {
      // consume
    }

    expect(axios.get).toHaveBeenCalledWith('https://example.com/data.json', {
      responseType: 'stream',
      signal: expect.any(AbortSignal),
      timeout: 30_000,
    });
  });

  it('should propagate HTTP errors', async () => {
    (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    const generator = fetcher.fetch('https://example.com/data.json');

    await expect(generator.next()).rejects.toThrow('Network error');
  });

  it('should skip non-object values in stream', async () => {
    const readable = new Readable({
      objectMode: true,
      read() {
        this.push({ value: 'not-an-object' });
        this.push({ value: { id: 1 } });
        this.push({ value: 42 });
        this.push({ value: { id: 2 } });
        this.push(null);
      },
    });

    const mockPipe = jest.fn().mockReturnThis();
    const mockInputStream = {
      pipe: mockPipe,
      on: jest.fn().mockReturnThis(),
      destroyed: false,
      destroy: jest.fn(),
    } as unknown as Readable;

    const mockParserStream = {
      pipe: jest.fn().mockReturnValue(readable),
      on: jest.fn().mockReturnThis(),
    };

    mockPipe.mockReturnValueOnce(mockParserStream);

    (axios.get as jest.Mock).mockResolvedValue({ data: mockInputStream });
    mockedParser.mockReturnValue({ on: jest.fn().mockReturnThis() } as unknown as ReturnType<typeof parser>);
    mockedStreamArray.mockReturnValue({} as unknown as ReturnType<typeof streamArray>);

    const batches: Record<string, unknown>[][] = [];
    for await (const batch of fetcher.fetch(
      'https://example.com/data.json',
      10,
    )) {
      batches.push(batch);
    }

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(2);
    expect(batches[0][0]).toEqual({ id: 1 });
    expect(batches[0][1]).toEqual({ id: 2 });
  });
});
