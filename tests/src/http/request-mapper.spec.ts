import { HttpRequestMapper } from '@/interface/http/request-mapper';

describe('HttpRequestMapper', () => {
  let mapper: HttpRequestMapper;

  beforeEach(() => {
    mapper = new HttpRequestMapper();
  });

  it('normalizes bracket notation and merges full body when bodyFilter is not restrict', () => {
    const request = mapper.map(
      {
        headers: { trace: 'abc-123' },
        params: { id: '42' },
        query: { active: 'false' },
        body: {
          'user[name]': 'Ana',
          age: '30',
          height: '1.75',
          note: 123
        }
      },
      {
        headers: ['trace|string'],
        params: ['id|integer'],
        query: ['active|boolean'],
        body: ['age|integer', 'height|number']
      }
    );

    expect(request.data).toEqual({
      trace: 'abc-123',
      id: 42,
      active: false,
      user: { name: 'Ana' },
      age: 30,
      height: 1.75,
      note: 123
    });
  });

  it('keeps only filtered body when bodyFilter is restrict', () => {
    const request = mapper.map(
      {
        headers: { source: 'unit-test' },
        params: { id: '5' },
        query: { page: '2' },
        body: {
          age: '20',
          name: 'Ana'
        }
      },
      {
        headers: ['source|string'],
        params: ['id|integer'],
        query: ['page|integer'],
        body: ['age|integer'],
        bodyFilter: 'restrict'
      }
    );

    expect(request.data).toEqual({
      source: 'unit-test',
      id: 5,
      page: 2,
      age: 20
    });
  });

  it('casts values according to declared types', () => {
    const request = mapper.map(
      {
        headers: { flag: true, ref: 123 },
        params: { count: '12a' },
        query: { price: '10.50', active: 'true' },
        body: { name: 77 }
      },
      {
        headers: ['flag|boolean', 'ref|string'],
        params: ['count|integer'],
        query: ['price|number', 'active|boolean'],
        body: ['name|string'],
        bodyFilter: 'restrict'
      }
    );

    expect(request.data).toEqual({
      flag: true,
      ref: '123',
      count: 12,
      price: 10.5,
      active: true,
      name: '77'
    });
  });
});
