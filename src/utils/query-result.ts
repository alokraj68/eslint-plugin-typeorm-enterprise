// Shared helpers for the two "strictly typed query result" rules:
// `require-typed-query-result` (result has no type at all) and
// `no-untyped-record-escape-hatch` (result is typed, but with an escape hatch
// like `any` or `Record<string, any>`).

import { TYPEORM_TYPE_NAMES, receiverMatchesTypes } from './types.js';

// TypeORM methods whose result is raw data rather than a mapped entity, so the
// caller is the only place a row shape can be declared.
export const DEFAULT_RESULT_METHODS = [
  'query',
  'getRawMany',
  'getRawOne',
  'getRawAndEntities',
  'execute',
];

// Fallback receiver names used when no type information is available.
export const DEFAULT_RECEIVER_NAMES = [
  'manager',
  'entityManager',
  'em',
  'repo',
  'repository',
  'qb',
  'queryBuilder',
  'dataSource',
  'ds',
  'connection',
  'queryRunner',
];

export function getCalledMethodName(node: any): string | null {
  const callee = node?.callee;
  if (callee?.type !== 'MemberExpression' || callee.computed) {
    return null;
  }
  return callee.property.type === 'Identifier' ? callee.property.name : null;
}

// Whether the call looks like it runs on a TypeORM receiver. With `typeAware`
// and type information available the receiver's TypeScript type decides;
// otherwise it falls back to the receiver-name list.
export function isTypeOrmReceiver(
  context: any,
  node: any,
  typeAware: boolean,
  receiverNames: Set<string>,
): boolean {
  const object = node?.callee?.object;
  if (!object) {
    return false;
  }

  if (typeAware) {
    const matched = receiverMatchesTypes(context, object, TYPEORM_TYPE_NAMES);
    if (matched !== null) {
      return matched;
    }
  }

  // Name-based fallback: `repo.query(...)` or a chain rooted at a known name,
  // e.g. `repo.createQueryBuilder().getRawMany()`.
  let current = object;
  for (let depth = 0; current && depth < 10; depth += 1) {
    if (current.type === 'Identifier') {
      return receiverNames.has(current.name);
    }
    if (current.type === 'CallExpression') {
      current = current.callee;
    } else if (current.type === 'MemberExpression') {
      // `this.repo.query(...)` / `service.manager.query(...)`: the property
      // name identifies the receiver just as well as a bare identifier.
      if (
        !current.computed &&
        current.property.type === 'Identifier' &&
        receiverNames.has(current.property.name)
      ) {
        return true;
      }
      current = current.object;
    } else if (current.type === 'AwaitExpression' || current.type === 'TSNonNullExpression') {
      current = current.expression;
    } else {
      return false;
    }
  }

  return false;
}

// TS-ESTree renamed call type arguments; support both spellings.
export function getCallTypeArguments(node: any): any[] {
  const container = node?.typeArguments ?? node?.typeParameters;
  return container?.params ?? [];
}

export type ResultTypeKind = 'typeArguments' | 'annotation' | 'assertion' | 'discarded' | 'none';

export interface ResultTypeInfo {
  kind: ResultTypeKind;
  // The declared type node, when there is one.
  typeNode: any | null;
  // Node to report on.
  reportNode: any;
}

function unwrapParent(node: any): { node: any; parent: any } {
  let current = node;
  let parent = current?.parent;
  while (
    parent &&
    (parent.type === 'AwaitExpression' ||
      parent.type === 'TSNonNullExpression' ||
      parent.type === 'ChainExpression')
  ) {
    current = parent;
    parent = current.parent;
  }
  return { node: current, parent };
}

function enclosingFunctionReturnType(node: any): any | null {
  let current = node;
  while (current) {
    if (
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression'
    ) {
      return current.returnType?.typeAnnotation ?? null;
    }
    current = current.parent;
  }
  return null;
}

// Where, if anywhere, the caller declared the shape of this query result.
export function getResultTypeInfo(node: any): ResultTypeInfo {
  const typeArguments = getCallTypeArguments(node);
  if (typeArguments.length > 0) {
    return { kind: 'typeArguments', typeNode: typeArguments[0], reportNode: typeArguments[0] };
  }

  const { node: expression, parent } = unwrapParent(node);

  if (!parent || parent.type === 'ExpressionStatement') {
    // Result is thrown away — there is no shape to declare.
    return { kind: 'discarded', typeNode: null, reportNode: node };
  }

  if (parent.type === 'TSAsExpression' || parent.type === 'TSSatisfiesExpression') {
    return {
      kind: 'assertion',
      typeNode: parent.typeAnnotation,
      reportNode: parent.typeAnnotation,
    };
  }

  if (parent.type === 'VariableDeclarator' && parent.init === expression) {
    const annotation = parent.id?.typeAnnotation?.typeAnnotation ?? null;
    if (annotation) {
      return { kind: 'annotation', typeNode: annotation, reportNode: annotation };
    }
    return { kind: 'none', typeNode: null, reportNode: node };
  }

  if (parent.type === 'ReturnStatement' || parent.type === 'ArrowFunctionExpression') {
    const returnType = enclosingFunctionReturnType(parent);
    if (returnType) {
      return { kind: 'annotation', typeNode: returnType, reportNode: returnType };
    }
  }

  return { kind: 'none', typeNode: null, reportNode: node };
}

const LOOSE_KEYWORDS = new Set(['TSAnyKeyword', 'TSObjectKeyword']);
const LOOSE_CONTAINERS = new Set(['Record', 'Map', 'WeakMap', 'Dictionary']);
const TRANSPARENT_CONTAINERS = new Set(['Promise', 'Array', 'ReadonlyArray']);

export interface LooseTypeOptions {
  // Treat `unknown` (and `Record<string, unknown>`) as an acceptable type.
  allowUnknown: boolean;
  // Extra type names treated as an escape hatch, e.g. `JsonObject`.
  extraLooseTypes: Set<string>;
}

// Whether a declared type node is an escape hatch that defeats strict typing:
// `any`, `object`, `{}`, `Record<string, any>`, `Map<string, any>`, or the same
// wrapped in `Promise<...>` / arrays / a union.
export function isLooseTypeNode(typeNode: any, options: LooseTypeOptions, depth = 0): boolean {
  if (!typeNode || depth > 6) {
    return false;
  }

  if (LOOSE_KEYWORDS.has(typeNode.type)) {
    return true;
  }

  if (typeNode.type === 'TSUnknownKeyword') {
    return !options.allowUnknown;
  }

  if (typeNode.type === 'TSTypeLiteral') {
    // `{}` accepts anything; a literal with members is a real shape.
    return (typeNode.members?.length ?? 0) === 0;
  }

  if (typeNode.type === 'TSArrayType') {
    return isLooseTypeNode(typeNode.elementType, options, depth + 1);
  }

  if (typeNode.type === 'TSUnionType' || typeNode.type === 'TSIntersectionType') {
    return (typeNode.types ?? []).some((member: any) =>
      isLooseTypeNode(member, options, depth + 1),
    );
  }

  if (typeNode.type === 'TSTypeReference') {
    const name = typeNode.typeName?.type === 'Identifier' ? typeNode.typeName.name : null;
    if (!name) {
      return false;
    }

    if (options.extraLooseTypes.has(name)) {
      return true;
    }

    const args = typeNode.typeArguments?.params ?? typeNode.typeParameters?.params ?? [];

    if (TRANSPARENT_CONTAINERS.has(name)) {
      return args.length > 0 ? isLooseTypeNode(args[0], options, depth + 1) : false;
    }

    if (LOOSE_CONTAINERS.has(name)) {
      // The value type is what matters: `Record<string, string>` is a real
      // shape, `Record<string, any>` is not. A bare `Record` is loose too.
      const valueType = args.length > 1 ? args[1] : null;
      return valueType ? isLooseTypeNode(valueType, options, depth + 1) : true;
    }
  }

  return false;
}
