import { Entity, Optional } from "@/domain";

type MaybeOptional<TResult, TOptional extends boolean> = TOptional extends true
    ? Optional<TResult>
    : TResult;

export interface RepositoryCreate<T extends Entity> {
    create(input: T): Promise<void>
}

export interface RepositoryUpdate<T extends Entity> {
    update(input: T): Promise<void>
}

export interface RepositoryRemove {
    remove(id: string | number): Promise<void>
}

export interface RepositoryRestore<T extends Entity, TResult = T, TOptional extends boolean = false> {
    restore(id: string | number): Promise<MaybeOptional<TResult, TOptional>>
}

export type RepositoryRemoveBy<T> = {
    [K in keyof T & string as `removeBy${Capitalize<K>}`]: (value: T[K]) => Promise<void>;
};

export type RepositoryRestoreBy<
    TKeys,
    TResult = TKeys extends Entity ? TKeys : Entity,
    TOptional extends boolean = false
> = {
    [K in keyof TKeys & string as `restoreBy${Capitalize<K>}`]:
        (value: TKeys[K]) => Promise<MaybeOptional<TResult, TOptional>>;
};

export type RepositoryExistsBy<T> = {
    [K in keyof T & string as `existsBy${Capitalize<K>}`]: (value: T[K]) => Promise<boolean>;
};

export type RepositoryNotExistsBy<T> = {
    [K in keyof T & string as `notExistsBy${Capitalize<K>}`]: (value: T[K]) => Promise<boolean>;
};

export interface RepositoryPagination<T> {
    restoreMany({ filter, pagination }: { filter?: Record<string, any>, pagination?: { offset: number, limit: number }}): Promise<T>
}
