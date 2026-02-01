import { EventDispatcher } from '@/application';
import { Container } from '@/infra/di/registry';

describe('EventDispatcher', () => {
  it('injects dispatcher on class decorator using default dispatcher property', async () => {
    const container = new Container();
    const dispatcher = {
      dispatch: jest.fn().mockResolvedValue(undefined)
    };
    container.load('MyDispatcher', dispatcher);

    @EventDispatcher('MyDispatcher', container)
    class BackgroundService {
      declare eventDispatcher: { dispatch: (event: { name: string }) => Promise<void> }
      async run() {
        await this.eventDispatcher.dispatch({ name: 'jobs.create' });
      }
    }

    const service = new BackgroundService();
    await service.run();

    expect(dispatcher.dispatch).toHaveBeenCalledWith({ name: 'jobs.create' });
  });

  it('injects dispatcher on property decorator', () => {
    const container = new Container();
    const dispatcher = {
      dispatch: jest.fn()
    };
    container.load('MyDispatcher', dispatcher);

    class BackgroundService {
      @EventDispatcher('MyDispatcher', container)
      readonly dispatcher!: { dispatch: (event: { name: string }) => void };
    }

    const service = new BackgroundService();
    service.dispatcher.dispatch({ name: 'jobs.sync' });

    expect(dispatcher.dispatch).toHaveBeenCalledWith({ name: 'jobs.sync' });
  });

  it('throws when dependency does not match dispatcher contract', () => {
    const container = new Container();
    container.load('BadDispatcher', {});

    @EventDispatcher('BadDispatcher', container)
    class BackgroundService {
      declare eventDispatcher: { dispatch: (event: { name: string }) => void }
    }

    const service = new BackgroundService();
    expect(() => service.eventDispatcher.dispatch({ name: 'jobs.fail' })).toThrow('BadDispatcher is not a valid EventDispatcher');
  });
});
