
export interface ExistsById  {
    create(id: number | string): Promise<boolean>
}