export declare class SelectQueryBuilder<Entity> {
  where(condition: string, params?: any): this;
  andWhere(condition: string, params?: any): this;
  orWhere(condition: string, params?: any): this;
  from(target: any, alias?: string): this;
  delete(): DeleteQueryBuilder<Entity>;
  update(target?: any): UpdateQueryBuilder<Entity>;
  getMany(): Promise<Entity[]>;
  getRawMany<T = any>(): Promise<T[]>;
  getRawOne<T = any>(): Promise<T | undefined>;
  execute(): Promise<any>;
}

export declare class DeleteQueryBuilder<Entity> {
  from(target: any, alias?: string): this;
  where(condition: string, params?: any): this;
  execute(): Promise<any>;
}

export declare class UpdateQueryBuilder<Entity> {
  set(values: any): this;
  where(condition: string, params?: any): this;
  execute(): Promise<any>;
}

export declare class Repository<Entity> {
  find(): Promise<Entity[]>;
  save(entity: Entity): Promise<Entity>;
  query<T = any>(sql: string): Promise<T>;
  createQueryBuilder(alias?: string): SelectQueryBuilder<Entity>;
}

// A custom repository that already narrows the raw result: no annotation is
// needed at the call site, and the type-aware check must leave it alone.
export declare class TypedRepository extends Repository<{ id: number }> {
  query(sql: string): Promise<{ id: number }[]>;
}

export declare class EntityManager {
  query<T = any>(sql: string): Promise<T>;
  save(entity: any): Promise<any>;
  getRepository<Entity>(target: any): Repository<Entity>;
  createQueryBuilder(): SelectQueryBuilder<any>;
}

export declare class QueryRunner {
  connect(): Promise<void>;
  release(): Promise<void>;
  manager: EntityManager;
}

export declare class DataSource {
  manager: EntityManager;
  createQueryRunner(): QueryRunner;
  getRepository<Entity>(target: any): Repository<Entity>;
  getManager(): EntityManager;
}

export declare function getManager(): EntityManager;
export declare function getEntityManager(): EntityManager;
