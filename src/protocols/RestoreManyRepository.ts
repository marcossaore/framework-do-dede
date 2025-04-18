import { Entity } from "@/domain/Entity";

export interface RestoreManyRepository<T extends Entity> {
    restoreMany(): Promise<T>
}