export type DeleteRepositoryBy<T> = {
    [K in keyof T & string as `deleteBy${Capitalize<K>}`]: (value: T[K]) => Promise<boolean>;
};