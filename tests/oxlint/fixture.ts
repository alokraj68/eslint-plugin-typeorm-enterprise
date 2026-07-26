// TypeScript fixture for the oxlint JS-plugin smoke test. The query-result
// typing rules need TS syntax (type arguments, annotations) to be meaningful,
// and oxlint parses TypeScript natively. Both lines must be flagged.
const rows = repo.query('SELECT id FROM users');
const rows2: Record<string, any>[] = repo.query('SELECT id FROM users');
