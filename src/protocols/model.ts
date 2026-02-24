export abstract class RepositoryModel<TEntity = any> {
  abstract fromModel(input: Record<string, any> | null | undefined): this;
  abstract toModel(ignoreId?: boolean, namedId?: string): Record<string, any>;
  abstract fromEntity(entity: TEntity): this;
  abstract toEntity(): TEntity;
}
