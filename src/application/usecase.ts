import { Input } from "./controller";

export const USE_CASE_DECORATORS = Symbol('USE_CASE_DECORATORS');

export abstract class UseCase<UseCaseInput, UseCaseOutput, UseCaseContext = any> {
	protected readonly data?: UseCaseInput;
	protected readonly context?: UseCaseContext;

	constructor(input?: Input<UseCaseInput>) {
		this.data = input?.data || undefined;
		if (input?.context) {
			this.context = input.context;
		}
	}

	abstract execute(): Promise<UseCaseOutput>
}

type UseCaseConstructor = new (...args: any[]) => UseCase<any, any>;

interface DecorateUseCaseOptions {
	useCase: UseCaseConstructor | UseCaseConstructor[];
	params?: Record<string, any>;
}

interface DecoratedUseCase {
	_decoratorUseCases: UseCase<any, any>[];
	_originalMethod: () => Promise<any>;
}

export function DecorateUseCase(options: DecorateUseCaseOptions) {
	return <T extends UseCaseConstructor>(target: T) => {
		return class extends target {
			constructor(...args: any[]) {
				super(...args);

				const useCases = Array.isArray(options.useCase)
					? options.useCase
					: [options.useCase];

				const self = this as any as DecoratedUseCase;
				
				self._decoratorUseCases = useCases.map((UseCaseClass) => {
					return new UseCaseClass({
						data: (this as any).data,
						context: { 
							...(this as any).context, 
							options: options.params || {} 
						},
					});
				});

				self._originalMethod = target.prototype.execute;
			}

			async execute(): Promise<any> {
				const self = this as any as DecoratedUseCase;
				
				for (const useCase of self._decoratorUseCases) {
					await useCase.execute();
				}
				return await self._originalMethod.call(this);
			}
		} as T;
	};
}