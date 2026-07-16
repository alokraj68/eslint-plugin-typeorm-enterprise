// Optional type-aware helpers. These only do anything when the file is linted
// with type information available (typescript-eslint parser + a project /
// projectService). When there is no type information, every helper returns
// `null` so rules can fall back to their AST-only behavior. Under oxlint, which
// has no type-aware support, these always return `null`.

// TypeORM classes whose instances expose the methods our rules care about.
export const TYPEORM_TYPE_NAMES = new Set([
  'Repository',
  'MongoRepository',
  'TreeRepository',
  'AbstractRepository',
  'EntityManager',
  'MongoEntityManager',
  'SqljsEntityManager',
  'QueryBuilder',
  'SelectQueryBuilder',
  'InsertQueryBuilder',
  'UpdateQueryBuilder',
  'DeleteQueryBuilder',
  'SoftDeleteQueryBuilder',
  'RelationQueryBuilder',
  'DataSource',
  'Connection',
  'QueryRunner',
]);

export const ENTITY_MANAGER_TYPE_NAMES = new Set([
  'EntityManager',
  'MongoEntityManager',
  'SqljsEntityManager',
]);

interface ParserServices {
  program?: any;
  esTreeNodeToTSNodeMap?: { get(node: any): any };
}

export function getParserServices(context: any): ParserServices | null {
  const services: ParserServices | undefined =
    context.sourceCode?.parserServices ?? context.parserServices;
  if (!services || !services.program || !services.esTreeNodeToTSNodeMap) {
    return null;
  }
  return services;
}

function symbolIsFromTypeOrm(symbol: any, allowed: Set<string>): boolean {
  const name = symbol?.getName?.() ?? symbol?.name;
  if (!name || !allowed.has(name)) {
    return false;
  }
  const declarations = symbol.getDeclarations?.() ?? [];
  if (declarations.length === 0) {
    return true;
  }
  return declarations.some((decl: any) => {
    const fileName = decl.getSourceFile?.().fileName ?? '';
    return fileName.includes('typeorm');
  });
}

function typeMatches(checker: any, type: any, allowed: Set<string>): boolean {
  const seen = new Set<any>();
  const stack = [type];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current)) {
      continue;
    }
    seen.add(current);

    const symbol = current.getSymbol?.() ?? current.symbol;
    if (symbol && symbolIsFromTypeOrm(symbol, allowed)) {
      return true;
    }

    for (const base of current.getBaseTypes?.() ?? []) {
      stack.push(base);
    }
    for (const member of current.types ?? []) {
      stack.push(member);
    }
  }

  return false;
}

// Returns true/false when type information is available, or null when it is not
// (so the caller can fall back to AST-only checks).
export function receiverMatchesTypes(
  context: any,
  node: any,
  allowed: Set<string>,
): boolean | null {
  const services = getParserServices(context);
  if (!services) {
    return null;
  }

  const tsNode = services.esTreeNodeToTSNodeMap!.get(node);
  if (!tsNode) {
    return null;
  }

  const checker = services.program.getTypeChecker();
  const type = checker.getTypeAtLocation(tsNode);
  return typeMatches(checker, type, allowed);
}
