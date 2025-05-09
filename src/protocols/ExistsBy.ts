
export type ExistsBy<T> = {
    [K in keyof T & string as `existsBy${Capitalize<K>}`]: (value: T[K]) => boolean;
};