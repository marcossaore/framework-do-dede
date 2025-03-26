import { Entity } from "framework-do-dede";

export interface RestoreRepository<T extends Entity> {
    restore(id: string | number): Promise<T | undefined>
}