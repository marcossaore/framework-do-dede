import { Entity } from "@/domain/Entity";

export interface CreateRepository <T extends Entity> {
    create(input: T): Promise<void>
}