class ComponentRegistry {
    private static instance: ComponentRegistry;
    private dependencies: Map<string, any> = new Map();

    static getInstance(): ComponentRegistry {
        if (!this.instance) {
            this.instance = new ComponentRegistry();
        }
        return this.instance;
    }

    load(name: string, dependency: any): void {
        this.dependencies.set(name, dependency);
    }

    inject(name: string) {
        if (!this.dependencies.get(name)) throw new Error(`Dependency not found ${name}`);
        return this.dependencies.get(name);
    }
}

export const Registry = ComponentRegistry.getInstance();


export function Inject(name: string) {
    return function (target: any, propertyKey: string): void {
        target[propertyKey] = new Proxy({}, {
            get(_: any, propertyKey: string) {
                const dependency = Registry.inject(name);
                return dependency[propertyKey];
            }
        })
    };
}