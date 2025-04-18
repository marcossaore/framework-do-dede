import { Entity } from "@/domain/Entity";

export interface RestoreRepository<T extends Entity> {
    restore(id: string | number): Promise<T>
}