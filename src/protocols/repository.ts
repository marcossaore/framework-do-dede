import { Optional } from "@/domain";
import { RepositoryModel } from "@/protocols/model";

export interface RepositoryCreate<T extends RepositoryModel> {
    create(input: T): Promise<void>
}

export interface RepositoryUpdate<T extends RepositoryModel> {
    update(input: T): Promise<void>
}

export interface RepositoryRemove {
    remove(id: string | number): Promise<void>
}

export interface RepositoryRestore<T extends RepositoryModel> {
    restore(id: string | number): Promise<Optional<T>>
}

export type RepositoryRemoveBy<T> = {
    [K in keyof T & string as `removeBy${Capitalize<K>}`]: (value: T[K]) => Promise<void>;
};

export type RepositoryRestoreBy<T> = {
    [K in keyof T & string as `restoreBy${Capitalize<K>}`]: (value: T[K]) => Promise<Optional<T>>;
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
