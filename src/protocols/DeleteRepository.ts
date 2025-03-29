import { Entity } from "@/domain/Entity";

export interface DeleteRepository <T extends Entity> {
    delete(input: T): Promise<void>
}