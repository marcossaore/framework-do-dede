export class Container {
    private dependencies: Map<string, any> = new Map();

    load(name: string, dependency: any): void {
        this.dependencies.set(name, dependency);
    }

    inject(name: string): any {
        if (!this.dependencies.get(name)) throw new Error(`Dependency not found ${name}`);
        return this.dependencies.get(name);
    }

    remove(name: string): void {
        this.dependencies.delete(name);
    }
}

export let DefaultContainer = new Container();

export function setDefaultContainer(container: Container) {
    DefaultContainer = container;
}

export function Inject(name: string, container: Container = DefaultContainer) {
    return function (target: any, propertyKey: string): void {
        target[propertyKey] = new Proxy({}, {
            get(_: any, propertyKey: string) {
                const dependency = container.inject(name);
                return dependency[propertyKey];
            }
        })
    };
}
