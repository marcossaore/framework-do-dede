import { Inject } from '@/decorators';
import 'reflect-metadata';

class ComponentRegistry {
    private static instance: ComponentRegistry;
    private dependencies: Map<string, any> = new Map();

    static getInstance(): ComponentRegistry {
        if (!ComponentRegistry.instance) {
            ComponentRegistry.instance = new ComponentRegistry();
        }
        return ComponentRegistry.instance;
    }

    register(token: string, dependency: any): void {
        this.dependencies.set(token, dependency);
    }

    addDependency(token: string, dependency: any): void {
        if(!this.dependencies.has(token)) throw new Error(`Dependency ${token} not registered`)
        if (!Array.isArray(this.dependencies.get(token))) throw new Error("Dependency must be an array")
        this.dependencies.get(token).push(dependency);
    }

    resolve<T>(token: string): T {
        const dependency = this.dependencies.get(token);
        if (!dependency) {
            throw new Error(`Dependency ${token} not registered`);
        }
        return dependency;
    }

    clear(token: string): void {
        const dependency = this.dependencies.get(token);
        if (!dependency) return
        this.dependencies.set(token, null)
    }

    classLoader<T>(target: new (...args: any[]) => T): T {
        const paramtypes = Reflect.getMetadata('injections', target) || [];
        const args = paramtypes.map((token: string) => ComponentRegistry.getInstance().resolve(token));
        return new target(...args);
    }

    inject(token: string) {
        return Inject(token)
    }
}

export const Registry = ComponentRegistry.getInstance();

