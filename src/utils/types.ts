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

// Types that hand out a QueryRunner.
export const QUERY_RUNNER_FACTORY_TYPE_NAMES = new Set([
  'DataSource',
  'Connection',
  'EntityManager',
  'MongoEntityManager',
  'SqljsEntityManager',
]);

export const QUERY_BUILDER_TYPE_NAMES = new Set([
  'QueryBuilder',
  'SelectQueryBuilder',
  'InsertQueryBuilder',
  'UpdateQueryBuilder',
  'DeleteQueryBuilder',
  'SoftDeleteQueryBuilder',
  'RelationQueryBuilder',
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

// TypeScript type flags we need without importing the `typescript` package
// (the plugin has no runtime dependency on it — the checker is only reachable
// through parser services when the user linted with type information).
const TS_TYPE_FLAG_ANY = 1;

function unwrapResultType(checker: any, type: any, depth = 0): any {
  if (!type || depth > 5) {
    return type;
  }

  const name = type.getSymbol?.()?.getName?.() ?? type.symbol?.name;
  if (name === 'Promise' || name === 'Array' || name === 'ReadonlyArray') {
    const args = checker.getTypeArguments?.(type) ?? type.typeArguments ?? [];
    if (args.length > 0) {
      return unwrapResultType(checker, args[0], depth + 1);
    }
  }

  return type;
}

// Whether the value produced by `node` is typed `any` (including `Promise<any>`
// and `any[]`). Returns null when no type information is available.
export function resultTypeIsAny(context: any, node: any): boolean | null {
  const services = getParserServices(context);
  if (!services) {
    return null;
  }

  const tsNode = services.esTreeNodeToTSNodeMap!.get(node);
  if (!tsNode) {
    return null;
  }

  const checker = services.program.getTypeChecker();
  const type = unwrapResultType(checker, checker.getTypeAtLocation(tsNode));
  if (!type) {
    return null;
  }

  return (type.flags & TS_TYPE_FLAG_ANY) !== 0 || type.intrinsicName === 'any';
}

// Whether a candidate report should proceed given the `typeAware` option. When
// type-aware is off, or there is no receiver, or no type information is
// available, it returns `true` (keep the AST-only behavior). When type
// information is available, it returns whether the receiver is one of `allowed`.
export function receiverPassesTypeGate(
  context: any,
  objectNode: any,
  typeAware: boolean,
  allowed: Set<string>,
): boolean {
  if (!typeAware || !objectNode) {
    return true;
  }
  const matched = receiverMatchesTypes(context, objectNode, allowed);
  return matched ?? true;
}
