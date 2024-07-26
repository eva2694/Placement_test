const fetch = require('jest-fetch-mock');
global.fetch = fetch;

const { asyncUrlProcessor } = require('./asyncUrlProcessor');

describe('asyncUrlProcessor', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  test('processes a list of valid URLs', async () => {
    const urls = [
      'https://dummyjson.com/products',
      'https://dummyjson.com/image',
      'https://dummyjson.com/icon/HASH/SIZE'
    ];
    const mockData1 = { id: 1, name: 'Product' };
    const mockData2 = { id: 2, name: 'Image' };
    const mockData3 = { id: 3, name: 'Icon' };

    fetch.mockResponses(
      [JSON.stringify(mockData1), { status: 200 }],
      [JSON.stringify(mockData2), { status: 200 }],
      [JSON.stringify(mockData3), { status: 200 }]
    );

    const result = [];
    for await (const data of asyncUrlProcessor(urls)) {
      result.push(data);
    }

    expect(result).toEqual([mockData1, mockData2, mockData3]);
    expect(fetch.mock.calls.length).toEqual(3);
  });

  test('handles an invalid URL', async () => {
    const urls = ['https://dummyjson.com/invalid'];
    fetch.mockReject(new Error('Failed to fetch'));

    const result = [];
    try {
      for await (const data of asyncUrlProcessor(urls)) {
        result.push(data);
      }
    } catch (error) {
      expect(error.message).toBe('Failed to fetch');
    }

    expect(fetch.mock.calls.length).toEqual(1);
  });

  test('handles an empty URLs array', async () => {
    const urls = [];
    const result = [];

    for await (const data of asyncUrlProcessor(urls)) {
      result.push(data);
    }

    expect(result).toEqual([]);
    expect(fetch.mock.calls.length).toEqual(0);
  });
});
