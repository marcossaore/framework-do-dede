import { Entity } from "framework-do-dede";

export interface UpdateRepository {
    update(input: Entity): Promise<void>
}