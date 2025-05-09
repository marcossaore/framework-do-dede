export type RestoreRepositoryBy<T, V> = {
    [K in keyof T & string as `restoreBy${Capitalize<K>}`]: (value: T[K]) => Promise<V>;
};