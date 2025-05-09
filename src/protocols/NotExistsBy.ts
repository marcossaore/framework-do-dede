
export type NotExistsBy<T> = {
    [K in keyof T & string as `notExistsBy${Capitalize<K>}`]: (value: T[K]) => Promise<boolean>;
};