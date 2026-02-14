export abstract class Entity {
    [x: string]: any;

    protected generateGetters() {
        // @ts-ignore
        const propertiesConfigs = (this.constructor.propertiesConfigs || {}) as Record<string, any>;
        const properties = new Set<string>([...Object.keys(this), ...Object.keys(propertiesConfigs)]);

        for (const property of properties) {
            if (typeof this[property] === 'function') continue;
            let prefixName = null;

            // @ts-ignore
            if (propertiesConfigs[property] && propertiesConfigs[property].prefix) {
                prefixName = propertiesConfigs[property].prefix;
            } else {
                const isBoolean = this[property] ? typeof this[property] === 'boolean' : false;
                prefixName = isBoolean ? 'is' : 'get';
            }
            let getterName = null;
            if (property[0]) {
                getterName = `${prefixName}${property[0].toUpperCase()}${property.slice(1)}`;
                if (this[getterName]) continue;
                this[getterName] = () => this[property];
            }
        }
    }
}
