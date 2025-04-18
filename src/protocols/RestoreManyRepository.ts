import { Entity } from "@/domain/Entity";

export interface RestoreManyRepository<T extends Entity> {
    restoreMany({ filter, pagination }: { filter?: Record<string, any>, pagination?: { offset: number, limit: number }}): Promise<T>
}