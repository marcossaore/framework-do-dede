import { Entity } from "@/domain/Entity";

export interface UpdateRepository {
    update(input: Entity): Promise<void>
}