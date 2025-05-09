export interface RestoreRepository<T> {
    restore(id: string | number): Promise<T>
}