import { Entity } from "framework-do-dede";

export interface CreateRepository <T extends Entity> {
    create(input: T): Promise<void>
}