import path from 'node:path';

export const DEFAULT_METHODS = ['query', 'execute', 'raw'];

export const DEFAULT_OPERATIONS = [
  'SELECT',
  'INSERT',
  'UPDATE',
  'DELETE',
  'WITH',
  'ALTER',
  'DROP',
  'CREATE',
  'TRUNCATE',
];

export const SQL_KEYWORD_REGEX = /^(SELECT|INSERT|UPDATE|DELETE|WITH|ALTER|DROP|CREATE|TRUNCATE)\b/i;

export function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getOptionValue(
  options: Record<string, unknown> | undefined,
  key: string,
  defaultValue: string[],
): string[] {
  if (!options || typeof options !== 'object') {
    return defaultValue;
  }

  return normalizeArray((options[key] as unknown) || defaultValue);
}

export interface CalleeInfo {
  methodName: string | null;
  objectName: string | null;
}

export function getCalleeInfo(callee: any): CalleeInfo {
  if (!callee) {
    return { methodName: null, objectName: null };
  }

  if (callee.type === 'Identifier') {
    return { methodName: callee.name, objectName: null };
  }

  if (callee.type === 'MemberExpression' && !callee.computed) {
    const property = callee.property;
    const object = callee.object;
    const methodName = property.type === 'Identifier' ? property.name : null;
    const objectName = object.type === 'Identifier' ? object.name : null;

    return { methodName, objectName };
  }

  if (callee.type === 'MemberExpression' && callee.computed && callee.property.type === 'Literal') {
    return {
      methodName: typeof callee.property.value === 'string' ? callee.property.value : null,
      objectName: callee.object.type === 'Identifier' ? callee.object.name : null,
    };
  }

  return { methodName: null, objectName: null };
}

export function looksLikeSql(text: unknown): boolean {
  return typeof text === 'string' && SQL_KEYWORD_REGEX.test(text.trim());
}

// A string expression assembled at runtime: a template literal with `${...}`
// interpolation, or a `+` concatenation with at least one non-string-literal
// operand. Unlike `looksLikeSql`, this does not require a leading SQL keyword.
export function isDynamicStringExpression(node: any): boolean {
  if (!node) {
    return false;
  }

  if (node.type === 'TemplateLiteral') {
    return node.expressions.length > 0;
  }

  if (node.type === 'BinaryExpression' && node.operator === '+') {
    const operands: any[] = [];
    const walk = (n: any) => {
      if (n.type === 'BinaryExpression' && n.operator === '+') {
        walk(n.left);
        walk(n.right);
      } else {
        operands.push(n);
      }
    };
    walk(node);

    const isStringLiteral = (operand: any) =>
      operand.type === 'Literal' && typeof operand.value === 'string';
    const hasStringLiteral = operands.some(isStringLiteral);
    const hasDynamic = operands.some((operand) => !isStringLiteral(operand));
    return hasStringLiteral && hasDynamic;
  }

  return false;
}

function toPosixPath(filePath: string): string {
  return filePath.replaceAll('\\', '/');
}

function escapeGlobValue(value: string): string {
  return value.replaceAll(/([.+^${}()|[\]\\])/g, String.raw`\$1`);
}

function globToRegExp(pattern: string): RegExp {
  const normalized = toPosixPath(pattern);
  const escaped = escapeGlobValue(normalized)
    .replaceAll('**', '<<<DOUBLE_AST>>>')
    .replaceAll('*', '[^/]*')
    .replaceAll('<<<DOUBLE_AST>>>', '.*')
    .replaceAll('?', '.');

  return new RegExp(`^${escaped}$`, 'i');
}

export function isIgnoredFilename(filename: string | undefined, ignorePatterns: string[]): boolean {
  if (typeof filename !== 'string' || !filename || filename === '<input>') {
    return false;
  }

  const normalizedFilename = toPosixPath(path.relative(process.cwd(), filename));
  return normalizeArray(ignorePatterns).some((pattern) => {
    try {
      const regex = globToRegExp(pattern);
      return regex.test(normalizedFilename) || regex.test(`/${normalizedFilename}`);
    } catch {
      return false;
    }
  });
}

export function getFilename(context: any): string | undefined {
  return typeof context.filename === 'string' ? context.filename : context.getFilename?.();
}
