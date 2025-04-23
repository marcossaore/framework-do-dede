export abstract class StorageGateway {
    public save (file: File, path: string): Promise<void> {
      throw new Error(this.constructor.name + ' save method not implemented')
    }

    public get (key: string): Promise<void> {
        throw new Error(this.constructor.name + ' get method not implemented')
    }

    public delete (key: string): Promise<void> {
        throw new Error(this.constructor.name + ' delete method not implemented')
    }
  }