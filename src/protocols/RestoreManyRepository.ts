export interface RestoreManyRepository<T> {
    restoreMany({ filter, pagination }: { filter?: Record<string, any>, pagination?: { offset: number, limit: number }}): Promise<T>
}