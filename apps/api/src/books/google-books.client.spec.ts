import { BadGatewayException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import { GoogleBooksClient } from './google-books.client.js';

// Only getOrThrow is used by the client
const config = {
  getOrThrow: () => 'test-key',
} as unknown as ConfigService;

function jsonResponse(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('GoogleBooksClient', () => {
  let client: GoogleBooksClient;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    // Replace the real fetch: tests never hit Google
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    client = new GoogleBooksClient(config);
    client.retryDelayMs = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns results on the first success', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        totalItems: 1,
        items: [{ id: 'a', volumeInfo: {} }],
      }),
    );

    await expect(client.search('dune')).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a 503 and succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValueOnce(jsonResponse(200, { totalItems: 0 }));

    await expect(client.search('dune')).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries a network error and succeeds', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(jsonResponse(200, { totalItems: 0 }));

    await expect(client.search('dune')).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after 3 attempts with a 502', async () => {
    fetchMock.mockResolvedValue(jsonResponse(503));

    await expect(client.search('dune')).rejects.toThrow(BadGatewayException);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry a 4xx', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429));

    await expect(client.search('dune')).rejects.toThrow(BadGatewayException);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null for a 404 without retrying', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404));

    await expect(client.getById('zzzzzzzzzzzz')).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
