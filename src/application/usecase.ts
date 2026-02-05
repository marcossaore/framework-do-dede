import { Input } from "./controller";

export const USE_CASE_DECORATORS = Symbol('USE_CASE_DECORATORS');

export abstract class UseCase<UseCaseInput, UseCaseOutput, UseCaseContext = any> {
	protected readonly data?: UseCaseInput;
	protected readonly context?: UseCaseContext;
	protected readonly beforeHook: HookManager;
	protected readonly afterHook: HookManager;

	constructor(input?: Input<UseCaseInput>) {
		this.data = input?.data || undefined;
		if (input?.context) {
			this.context = input.context;
		}
		this.beforeHook = new HookManager(this as any, 'before');
		this.afterHook = new HookManager(this as any, 'after');
	}

	abstract execute(): Promise<UseCaseOutput>
}

type UseCaseConstructor = new (...args: any[]) => UseCase<any, any>;

type HookConstructor = new () => Hook<any, any>;
type HookPosition = 'before' | 'after';

interface HookOptions {
	runOnError?: boolean;
}

interface DecorateUseCaseOptions {
	useCase: UseCaseConstructor | UseCaseConstructor[];
	params?: Record<string, any>;
}

interface HookMetadata {
	hookClass: HookConstructor;
	position: HookPosition;
	runOnError?: boolean;
}

interface HookEntry {
	metadata: HookMetadata;
	instance: Hook<any, any>;
	setPayload(payload: unknown): void;
}

const USE_CASE_HOOKS = Symbol('USE_CASE_HOOKS');
const USE_CASE_HOOKS_WRAPPED = Symbol('USE_CASE_HOOKS_WRAPPED');

function getHookMetadata(target: any): HookMetadata[] {
	return (target as any)[USE_CASE_HOOKS] ?? [];
}

function registerHook(target: any, metadata: HookMetadata) {
	const existing = getHookMetadata(target);
	if (existing.some((entry: HookMetadata) => entry.position === metadata.position)) {
		throw new Error(`Only one ${metadata.position} hook can be registered per use case`);
	}
	(target as any)[USE_CASE_HOOKS] = [...existing, metadata];
}

function wrapUseCaseWithHooks<T extends UseCaseConstructor>(target: T): T {
	if ((target as any)[USE_CASE_HOOKS_WRAPPED]) {
		return target;
	}

	class HookedUseCase extends target {
		async execute(): Promise<any> {
			const beforeHook = (this as any).beforeHook as HookManager;
			const afterHook = (this as any).afterHook as HookManager;
			await beforeHook.notifyBefore();

			let result: any;
			let originalError: unknown;
			try {
				result = await super.execute();
			} catch (error) {
				originalError = error;
			}

			await afterHook.notifyAfter(!!originalError);

			if (originalError) {
				throw originalError;
			}
			return result;
		}
	}

	(HookedUseCase as any)[USE_CASE_HOOKS_WRAPPED] = true;
	(HookedUseCase as any)[USE_CASE_HOOKS] = getHookMetadata(target);

	return HookedUseCase as T;
}

export abstract class Hook<Payload = any, Context = any> {
	protected payload?: Payload;
	protected context?: Context;

	setPayload(payload: Payload, context?: Context) {
		this.payload = payload;
		if (context !== undefined) {
			this.context = context;
		}
	}

	async notify(): Promise<void> {
		await this.use(this.payload as Payload, this.context);
	}

	abstract use(payload: Payload, context?: Context): Promise<void> | void;
}

export abstract class AfterHook<Payload = any, Context = any> extends Hook<Payload, Context> {}

export abstract class BeforeHook<Payload = any, Context = any> extends Hook<Payload, Context> {}

class HookManager {
	private readonly entry?: HookEntry;
	private readonly owner: UseCase<any, any>;
	private readonly position: HookPosition;

	constructor(owner: UseCase<any, any>, position: HookPosition) {
		this.owner = owner;
		this.position = position;
		this.entry = this.buildEntry();
	}

	use(payload: unknown) {
		this.entry?.setPayload(payload);
	}

	async notifyBefore() {
		if (this.position === 'before' && this.entry?.metadata.position === 'before') {
			await this.entry.instance.notify();
		}
	}

	async notifyAfter(onError: boolean) {
		if (!this.entry || this.position !== 'after' || this.entry.metadata.position !== 'after') {
			return;
		}
		if (onError && !this.entry.metadata.runOnError) {
			return;
		}
		await this.entry.instance.notify();
	}

	private buildEntry(): HookEntry | undefined {
		const metadata = getHookMetadata((this.owner as any).constructor);
		const entry = metadata.find((item) => item.position === this.position);
		if (!entry) {
			return undefined;
		}
		const instance = new entry.hookClass();
		return {
			metadata: entry,
			instance,
			setPayload: (payload: unknown) => {
				instance.setPayload(payload as any, (this.owner as any).context);
			},
		};
	}
}

function buildUseCaseInstances(
	owner: any,
	options: DecorateUseCaseOptions,
): UseCase<any, any>[] {
	const useCases = Array.isArray(options.useCase)
		? options.useCase
		: [options.useCase];

	if (useCases.length === 0) {
		return [];
	}

	return useCases.map((UseCaseClass) => {
		return new UseCaseClass({
			data: owner?.data,
			context: {
				...(owner?.context ?? {}),
				options: options.params || {},
			},
		});
	});
}

export function DecorateUseCase(options: DecorateUseCaseOptions) {
	return <T extends UseCaseConstructor>(target: T) => {
		const stateKey = Symbol('decoratorUseCases');
		return class extends target {
			constructor(...args: any[]) {
				super(...args);

				(this as any)[stateKey] = {
					useCases: buildUseCaseInstances(this, options),
					original: target.prototype.execute,
				};
			}

			async execute(): Promise<any> {
				const state = (this as any)[stateKey] as {
					useCases: UseCase<any, any>[];
					original: () => Promise<any>;
				};
				
				for (const useCase of state.useCases) {
					await useCase.execute();
				}
				return await state.original.call(this);
			}
		} as T;
	};
}

export function HookBefore(hookClass: HookConstructor) {
	return <T extends UseCaseConstructor>(target: T) => {
		registerHook(target, { hookClass, position: 'before' });
		return wrapUseCaseWithHooks(target);
	};
}

export function HookAfter(hookClass: HookConstructor, options: HookOptions = {}) {
	return <T extends UseCaseConstructor>(target: T) => {
		registerHook(target, { hookClass, position: 'after', runOnError: options.runOnError });
		return wrapUseCaseWithHooks(target);
	};
}
