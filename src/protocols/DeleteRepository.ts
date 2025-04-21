export interface DeleteRepository{
    delete(id: string | number): Promise<void>
}