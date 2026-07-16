export declare class Repository<Entity> {
  find(): Promise<Entity[]>;
  save(entity: Entity): Promise<Entity>;
  query(sql: string): Promise<any>;
}

export declare class EntityManager {
  query(sql: string): Promise<any>;
  save(entity: any): Promise<any>;
  getRepository<Entity>(target: any): Repository<Entity>;
}

export declare class DataSource {
  manager: EntityManager;
  getRepository<Entity>(target: any): Repository<Entity>;
  getManager(): EntityManager;
}

export declare function getManager(): EntityManager;
export declare function getEntityManager(): EntityManager;
