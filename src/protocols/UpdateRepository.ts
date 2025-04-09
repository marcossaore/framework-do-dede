import { Entity } from "@/domain/Entity";

export interface UpdateRepository <T extends Entity> {
    update(input: T): Promise<void>
}