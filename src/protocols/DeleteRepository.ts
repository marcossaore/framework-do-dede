import { Entity } from "framework-do-dede";

export interface DeleteRepository <T extends Entity> {
    delete(input: T): Promise<void>
}