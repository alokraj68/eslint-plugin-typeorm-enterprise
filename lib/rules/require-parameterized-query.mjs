import path from 'node:path';

const DEFAULT_METHODS = ['query', 'execute', 'raw'];
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

function looksLikeSql(text) {
  return typeof text === 'string' && SQL_KEYWORD_REGEX.test(text.trim());
}

// A template literal with interpolated expressions, e.g.
//   query(`SELECT * FROM users WHERE id = ${id}`)
// The static skeleton is inspected to decide whether it is SQL.
function inspectTemplateLiteral(node) {
  if (node.type !== 'TemplateLiteral' || node.expressions.length === 0) {
    return false;
  }

  const skeleton = node.quasis.map((quasi) => quasi.value.cooked || '').join('');
  return looksLikeSql(skeleton);
}

// Flatten a `+` concatenation chain into its operands.
function flattenConcatenation(node) {
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    return [...flattenConcatenation(node.left), ...flattenConcatenation(node.right)];
  }

  return [node];
}

// A `+` concatenation that mixes a SQL string literal with a dynamic value,
// e.g. query('SELECT * FROM users WHERE id = ' + userId)
function inspectConcatenation(node) {
  if (node.type !== 'BinaryExpression' || node.operator !== '+') {
    return false;
  }

  const operands = flattenConcatenation(node);
  const isStringLiteral = (operand) => operand.type === 'Literal' && typeof operand.value === 'string';

  const hasDynamic = operands.some((operand) => !isStringLiteral(operand));
  if (!hasDynamic) {
    return false;
  }

  const staticText = operands
    .map((operand) => (isStringLiteral(operand) ? operand.value : ''))
    .join('');

  return looksLikeSql(staticText);
}

function isDynamicSqlArgument(node) {
  if (!node) {
    return false;
  }

  return inspectTemplateLiteral(node) || inspectConcatenation(node);
}

function toPosixPath(filePath) {
  return filePath.replaceAll('\\', '/');
}

function escapeGlobValue(value) {
  return value.replaceAll(/([.+^${}()|[\]\\])/g, String.raw`\$1`);
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
  const restrictedMethods = new Set(getOptionValue(options, 'restrictedMethods', DEFAULT_METHODS).map((method) => method.toLowerCase()));
  const allowedObjectNames = getOptionValue(options, 'allowedObjectNames', []);
  const ignorePatterns = getOptionValue(options, 'ignorePatterns', []);

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
      if (!isDynamicSqlArgument(firstArg)) {
        return;
      }

      context.report({
        node: firstArg,
        messageId: 'parameterize',
      });
    },
  };
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require parameterized queries instead of interpolated or concatenated raw SQL.',
      category: 'Possible Errors',
      recommended: true,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/README.md#rule-typeorm-enterprise-require-parameterized-query',
    },
    schema: [
      {
        type: 'object',
        properties: {
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
      parameterize: 'SQL is built with string interpolation or concatenation, which risks SQL injection. Use parameterized queries (bound parameters) or the TypeORM QueryBuilder instead.',
    },
  },
  create,
};

export default rule;
export { rule };
