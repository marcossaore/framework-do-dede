import {
  DecorateUseCase,
  UseCase,
  HookAfter,
  HookBefore,
  AfterHook,
  BeforeHook,
} from "@/application";

// Mock UseCases para teste
class MockUseCaseA extends UseCase<{ value: string }, string> {
  async execute(): Promise<string> {
    console.log('MockUseCaseA executed with data:', this.data);
    return `A: ${this.data?.value || 'no-data'}`;
  }
}

class MockUseCaseB extends UseCase<{ value: string }, string> {
  async execute(): Promise<string> {
    console.log('MockUseCaseB executed with data:', this.data);
    return `B: ${this.data?.value || 'no-data'}`;
  }
}

class MockUseCaseWithContext extends UseCase<{ value: string }, string, { userId: string }> {
  async execute(): Promise<string> {
    console.log('MockUseCaseWithContext executed with context:', this.context);
    return `Context: ${this.context?.userId || 'no-user'}`;
  }
}

// UseCase base para ser decorado
class OriginalUseCase extends UseCase<{ value: string }, string> {
  async execute(): Promise<string> {
    console.log('OriginalUseCase executed with data:', this.data);
    return `Original: ${this.data?.value || 'no-data'}`;
  }
}

describe('DecorateUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should execute single use case before original method', async () => {
    @DecorateUseCase({
      useCase: MockUseCaseA
    })
    class DecoratedUseCase extends OriginalUseCase {}

    const useCase = new DecoratedUseCase({
      data: { value: 'test-value' }
    });

    const result = await useCase.execute();

    expect(result).toBe('Original: test-value');
    // Verifica se o MockUseCaseA foi executado através dos logs
    expect(console.log).toHaveBeenCalledWith(
      'MockUseCaseA executed with data:',
      { value: 'test-value' }
    );
    expect(console.log).toHaveBeenCalledWith(
      'OriginalUseCase executed with data:',
      { value: 'test-value' }
    );
  });

  it('should execute multiple use cases in order before original method', async () => {
    @DecorateUseCase({
      useCase: [MockUseCaseA, MockUseCaseB]
    })
    class DecoratedUseCase extends OriginalUseCase {}

    const useCase = new DecoratedUseCase({
      data: { value: 'test-value' }
    });

    const result = await useCase.execute();

    expect(result).toBe('Original: test-value');
    
    // Verifica a ordem de execução
    const calls = (console.log as jest.Mock).mock.calls;
    expect(calls[0][0]).toBe('MockUseCaseA executed with data:');
    expect(calls[1][0]).toBe('MockUseCaseB executed with data:');
    expect(calls[2][0]).toBe('OriginalUseCase executed with data:');
  });

  it('should pass context to decorated use cases', async () => {
    @DecorateUseCase({
      useCase: MockUseCaseWithContext,
      params: { userId: 'test-user-123' }
    })
    class DecoratedUseCase extends OriginalUseCase {}

    const useCase = new DecoratedUseCase({
      data: { value: 'test-value' },
      context: { userId: 'original-user' }
    });

    const result = await useCase.execute();

    expect(result).toBe('Original: test-value');
    expect(console.log).toHaveBeenCalledWith(
      'MockUseCaseWithContext executed with context:',
      { 
        userId: 'original-user',
        options: { userId: 'test-user-123' }
      }
    );
  });

  it('should work with use case that has no input data', async () => {
    class NoInputUseCase extends UseCase<void, string> {
      async execute(): Promise<string> {
        console.log('NoInputUseCase executed');
        return 'no-input-result';
      }
    }

    @DecorateUseCase({
      useCase: NoInputUseCase
    })
    class DecoratedUseCase extends OriginalUseCase {}

    const useCase = new DecoratedUseCase({
      data: { value: 'test-value' }
    });

    const result = await useCase.execute();

    expect(result).toBe('Original: test-value');
    expect(console.log).toHaveBeenCalledWith('NoInputUseCase executed');
  });

  it('should preserve the original method context', async () => {
    class ContextSensitiveUseCase extends UseCase<{ value: string }, string> {
      private internalState = 'internal-state';

      async execute(): Promise<string> {
        return `Result with ${this.internalState} and ${this.data?.value}`;
      }
    }

    @DecorateUseCase({
      useCase: MockUseCaseA
    })
    class DecoratedUseCase extends ContextSensitiveUseCase {}

    const useCase = new DecoratedUseCase({
      data: { value: 'test-value' }
    });

    const result = await useCase.execute();

    expect(result).toBe('Result with internal-state and test-value');
  });

  it('should handle empty use case array', async () => {
    @DecorateUseCase({
      useCase: []
    })
    class DecoratedUseCase extends OriginalUseCase {}

    const useCase = new DecoratedUseCase({
      data: { value: 'test-value' }
    });

    const result = await useCase.execute();

    expect(result).toBe('Original: test-value');
  });

  it('should work with async use cases', async () => {
    class AsyncUseCase extends UseCase<{ value: string }, string> {
      async execute(): Promise<string> {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(`Async: ${this.data?.value}`);
          }, 10);
        });
      }
    }

    @DecorateUseCase({
      useCase: AsyncUseCase
    })
    class DecoratedUseCase extends OriginalUseCase {}

    const useCase = new DecoratedUseCase({
      data: { value: 'test-value' }
    });

    const result = await useCase.execute();

    expect(result).toBe('Original: test-value');
  });
});

describe('HookBefore/HookAfter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should run HookBefore before the method and HookAfter after it', async () => {
    class SaveBefore extends BeforeHook<void> {
      async use() {
        console.log('SaveBefore executed');
      }
    }

    class SaveAfter extends AfterHook<void> {
      async use() {
        console.log('SaveAfter executed');
      }
    }

    @HookBefore(SaveBefore)
    @HookAfter(SaveAfter)
    class HookedUseCase extends UseCase<void, string> {
      async execute(): Promise<string> {
        console.log('HookedUseCase executed');
        return 'ok';
      }
    }

    const useCase = new HookedUseCase();
    const result = await useCase.execute();

    expect(result).toBe('ok');
    const calls = (console.log as jest.Mock).mock.calls;
    expect(calls[0][0]).toBe('SaveBefore executed');
    expect(calls[1][0]).toBe('HookedUseCase executed');
    expect(calls[2][0]).toBe('SaveAfter executed');
  });

  it('should pass payload when hooks.use is called', async () => {
    class SavePhoto extends AfterHook<{ id: string }> {
      async use(payload: { id: string }) {
        console.log('SavePhoto payload:', payload);
      }
    }

    @HookAfter(SavePhoto)
    class CreatePhotoUseCase extends UseCase<void, { id: string }> {
      async execute(): Promise<{ id: string }> {
        const product = { id: 'photo-1' };
        this.afterHook.use(product);
        return product;
      }
    }

    const useCase = new CreatePhotoUseCase();
    const result = await useCase.execute();

    expect(result).toEqual({ id: 'photo-1' });
    expect(console.log).toHaveBeenCalledWith('SavePhoto payload:', { id: 'photo-1' });
  });

  it('should not run HookAfter on error by default', async () => {
    class SaveAfter extends AfterHook<void> {
      async use() {
        console.log('SaveAfter executed');
      }
    }

    @HookAfter(SaveAfter)
    class FailingUseCase extends UseCase<void, void> {
      async execute(): Promise<void> {
        throw new Error('boom');
      }
    }

    const useCase = new FailingUseCase();
    await expect(useCase.execute()).rejects.toThrow('boom');
    expect(console.log).not.toHaveBeenCalledWith('SaveAfter executed');
  });

  it('should run HookAfter on error when runOnError is true', async () => {
    class SaveAfter extends AfterHook<void> {
      async use() {
        console.log('SaveAfter executed');
      }
    }

    @HookAfter(SaveAfter, { runOnError: true })
    class FailingUseCase extends UseCase<void, void> {
      async execute(): Promise<void> {
        throw new Error('boom');
      }
    }

    const useCase = new FailingUseCase();
    await expect(useCase.execute()).rejects.toThrow('boom');
    expect(console.log).toHaveBeenCalledWith('SaveAfter executed');
  });
});
