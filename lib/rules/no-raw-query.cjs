'use strict';
const path = require('node:path');

const DEFAULT_METHODS = ['query', 'execute', 'raw'];
const DEFAULT_OPERATIONS = [
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
const SQL_KEYWORD_REGEX = /^(SELECT|INSERT|UPDATE|DELETE|WITH|ALTER|DROP|CREATE|TRUNCATE)\b/i;

function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getOptionValue(options, key, defaultValue) {
  if (!options || typeof options !== 'object') {
    return defaultValue;
  }

  return normalizeArray(options[key] || defaultValue);
}

function isStaticSqlArgument(node) {
  if (!node) {
    return false;
  }

  if (node.type === 'Literal' && typeof node.value === 'string') {
    return true;
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis.every((quasi) => typeof quasi.value.cooked === 'string');
  }

  return false;
}

function extractSqlArgumentText(node) {
  if (node.type === 'Literal') {
    return String(node.value);
  }

  if (node.type === 'TemplateLiteral') {
    return node.quasis.map((quasi) => quasi.value.cooked || '').join('');
  }

  return '';
}

function getFirstSqlOperation(text) {
  if (typeof text !== 'string') {
    return null;
  }

  const match = new RegExp(SQL_KEYWORD_REGEX).exec(text.trim());
  return match ? match[1].toUpperCase() : null;
}

function getCalleeInfo(callee) {
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

function toPosixPath(filePath) {
  return filePath.replaceAll('\\', '/');
}

function escapeGlobValue(value) {
  return value.replaceAll(/([.+^${}()|[\]\\])/g, '\\$1');
}

function globToRegExp(pattern) {
  const normalized = toPosixPath(pattern);
  const escaped = escapeGlobValue(normalized)
    .replaceAll('**', '<<<DOUBLE_AST>>>')
    .replaceAll('*', '[^/]*')
    .replaceAll('<<<DOUBLE_AST>>>', '.*')
    .replaceAll('?', '.');

  return new RegExp(`^${escaped}$`, 'i');
}

function isIgnoredFilename(filename, ignorePatterns) {
  if (typeof filename !== 'string' || !filename || filename === '<input>') {
    return false;
  }

  const normalizedFilename = toPosixPath(path.relative(process.cwd(), filename));
  return normalizeArray(ignorePatterns).some((pattern) => {
    try {
      const regex = globToRegExp(pattern);
      return regex.test(normalizedFilename) || regex.test(`/${normalizedFilename}`);
    } catch (_) {
      return false;
    }
  });
}

function create(context) {
  const options = context.options?.[0] ? context.options[0] : {};
  const restrictedOperations = getOptionValue(options, 'restrictedOperations', DEFAULT_OPERATIONS);
  const allowedOperations = getOptionValue(options, 'allowedOperations', []);
  const restrictedMethods = new Set(getOptionValue(options, 'restrictedMethods', DEFAULT_METHODS).map((method) => method.toLowerCase()));
  const allowedObjectNames = getOptionValue(options, 'allowedObjectNames', []);
  const ignorePatterns = getOptionValue(options, 'ignorePatterns', []);

  const activeOperations = restrictedOperations.filter((operation) => !allowedOperations.includes(operation));
  const blockedOperations = new Set(activeOperations.map((operation) => operation.toUpperCase()));

  return {
    CallExpression(node) {
      if (isIgnoredFilename(context.getFilename(), ignorePatterns)) {
        return;
      }

      const calleeInfo = getCalleeInfo(node.callee);
      if (!calleeInfo.methodName) {
        return;
      }

      const methodName = calleeInfo.methodName.toLowerCase();
      if (!restrictedMethods.has(methodName)) {
        return;
      }

      if (calleeInfo.objectName && allowedObjectNames.includes(calleeInfo.objectName)) {
        return;
      }

      const firstArg = node.arguments[0];
      if (!isStaticSqlArgument(firstArg)) {
        return;
      }

      const sqlText = extractSqlArgumentText(firstArg);
      const operation = getFirstSqlOperation(sqlText);
      if (!operation || !blockedOperations.has(operation)) {
        return;
      }

      context.report({
        node: firstArg,
        messageId: 'forbidden',
        data: {
          operation,
        },
      });
    },
  };
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw SQL execution through TypeORM query helpers and raw SQL methods.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/your-user/eslint-plugin-typeorm-enterprise/blob/main/README.md#rule-typeorm-enterprise-no-raw-query',
    },
    schema: [
      {
        type: 'object',
        properties: {
          restrictedOperations: {
            type: 'array',
            items: { type: 'string' },
          },
          allowedOperations: {
            type: 'array',
            items: { type: 'string' },
          },
          restrictedMethods: {
            type: 'array',
            items: { type: 'string' },
          },
          allowedObjectNames: {
            type: 'array',
            items: { type: 'string' },
          },
          ignorePatterns: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbidden: 'Raw SQL operation "{{operation}}" is not allowed. Use TypeORM QueryBuilder or Repository APIs instead.',
    },
  },
  create,
};
