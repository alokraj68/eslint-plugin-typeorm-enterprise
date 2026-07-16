export declare class SelectQueryBuilder<Entity> {
  where(condition: string, params?: any): this;
  andWhere(condition: string, params?: any): this;
  orWhere(condition: string, params?: any): this;
  from(target: any, alias?: string): this;
  delete(): DeleteQueryBuilder<Entity>;
  update(target?: any): UpdateQueryBuilder<Entity>;
  getMany(): Promise<Entity[]>;
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
  query(sql: string): Promise<any>;
  createQueryBuilder(alias?: string): SelectQueryBuilder<Entity>;
}

export declare class EntityManager {
  query(sql: string): Promise<any>;
  save(entity: any): Promise<any>;
  getRepository<Entity>(target: any): Repository<Entity>;
  createQueryBuilder(): SelectQueryBuilder<any>;
}

export declare class DataSource {
  manager: EntityManager;
  getRepository<Entity>(target: any): Repository<Entity>;
  getManager(): EntityManager;
}

export declare function getManager(): EntityManager;
export declare function getEntityManager(): EntityManager;
