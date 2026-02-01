import { CacheGateway } from '@/application';
import { Container } from '@/infra/di/registry';

describe('CacheGateway', () => {
  it('injects cache on class decorator using default cache property', async () => {
    const container = new Container();
    const cache = {
      get: jest.fn().mockResolvedValue('value'),
      set: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(true)
    };
    container.load('MyCache', cache);

    @CacheGateway('MyCache', container)
    class CachedService {
      declare cache: { get: (key: string) => Promise<string> }
      async read(key: string) {
        return this.cache.get(key);
      }
    }

    const service = new CachedService();
    const value = await service.read('abc');

    expect(cache.get).toHaveBeenCalledWith('abc');
    expect(value).toBe('value');
  });

  it('injects cache on property decorator', () => {
    const container = new Container();
    const cache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn()
    };
    container.load('MyCache', cache);

    class CachedService {
      @CacheGateway('MyCache', container)
      readonly cacheGateway!: { set: (key: string, value: unknown) => void };
    }

    const service = new CachedService();
    service.cacheGateway.set('key', 'value');

    expect(cache.set).toHaveBeenCalledWith('key', 'value');
  });

  it('throws when dependency does not match cache contract', () => {
    const container = new Container();
    container.load('BadCache', {});

    @CacheGateway('BadCache', container)
    class CachedService {
      declare cache: { get: (key: string) => unknown }
      async read(key: string) {
        return this.cache.get(key);
      }
    }

    const service = new CachedService();
    expect(() => service.cache.get('abc')).toThrow('BadCache is not a valid CacheGateway');
  });
});
