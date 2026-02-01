import { Entity } from "@/domain";
import { Model } from "@/infra/model/model";

export interface RepositoryModel<E extends Entity, M> {
    model: Model<E, M>
}

export interface RepositoryCreate<E extends Entity, M> extends RepositoryModel<E, M> {
    create(input: E): Promise<void>
}

export interface RepositoryUpdate<E extends Entity, M> extends RepositoryModel<E, M> {
    update(input: E): Promise<void>
}

export interface RepositoryRemove {
    remove(id: string | number): Promise<void>
}

export interface RepositoryRestore<E extends Entity, M> extends RepositoryModel<E, M> {
    restore(id: string | number): Promise<E>
}

export type RepositoryRemoveBy<E> = {
    [K in keyof E & string as `removeBy${Capitalize<K>}`]: (value: E[K]) => Promise<void>;
};

export type RepositoryRestoreBy<E> = {
    [K in keyof E & string as `restoreBy${Capitalize<K>}`]: (value: E[K]) => Promise<any>;
};

export type RepositoryExistsBy<E> = {
    [K in keyof E & string as `existsBy${Capitalize<K>}`]: (value: E[K]) => Promise<boolean>;
};

export type RepositoryNotExistsBy<E> = {
    [K in keyof E & string as `notExistsBy${Capitalize<K>}`]: (value: E[K]) => Promise<boolean>;
};

export interface RepositoryPagination<E extends Entity, M> extends RepositoryModel<E, M> {
    restoreMany({ filter, pagination }: { filter?: Record<string, any>, pagination?: { offset: number, limit: number }}): Promise<E[]>
}
