
export interface ExistsById  {
    existsById(id: number | string): Promise<boolean>
}