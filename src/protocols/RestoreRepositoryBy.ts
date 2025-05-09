export type RestoreRepositoryBy<T> = {
    [K in keyof T & string as `restoreBy${Capitalize<K>}`]: (value: T[K]) => boolean;
};