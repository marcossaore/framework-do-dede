export abstract class Entity {
    [x: string]: any;

    protected generateGetters() {
        for (const property of Object.keys(this)) {
            if (typeof this[property] === 'function') continue;
            let prefixName = null;

            // @ts-ignore
            if (this.constructor.propertiesConfigs && this.constructor.propertiesConfigs[property] && this.constructor.propertiesConfigs[property].prefix) {
                // @ts-ignore
                prefixName = this.constructor.propertiesConfigs[property].prefix;
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
