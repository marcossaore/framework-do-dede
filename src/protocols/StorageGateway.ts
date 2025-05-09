export interface StorageGateway {
    save (file: File, path: string): Promise<void>
    get (key: string): Promise<string>
    delete (key: string): Promise<boolean>
  }