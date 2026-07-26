// Builds the static site published to GitHub Pages. Its purpose is to serve
// llms.txt at a stable, fetchable URL — the /llms.txt convention only works
// when the file is reachable over HTTP, not when it sits inside node_modules.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'site');

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const repo = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
copyFileSync(join(root, 'llms.txt'), join(out, 'llms.txt'));

const escape = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(pkg.name)}</title>
<meta name="description" content="${escape(pkg.description)}">
<link rel="llms-txt" href="/llms.txt">
<style>
  :root { color-scheme: light dark; }
  body { max-width: 46rem; margin: 3rem auto; padding: 0 1.25rem;
         font: 16px/1.6 system-ui, sans-serif; }
  code { font-family: ui-monospace, monospace; }
  pre { overflow-x: auto; padding: .75rem 1rem; border-radius: .5rem;
        background: color-mix(in srgb, currentColor 8%, transparent); }
</style>
</head>
<body>
<h1>${escape(pkg.name)}</h1>
<p>${escape(pkg.description)}</p>
<pre><code>npm install --save-dev eslint ${escape(pkg.name)}</code></pre>
<h2>For AI agents</h2>
<p>Machine-readable package summary: <a href="./llms.txt">/llms.txt</a></p>
<h2>Links</h2>
<ul>
  <li><a href="${escape(repo)}#readme">Documentation</a></li>
  <li><a href="${escape(repo)}/tree/main/docs/rules">Rule docs</a></li>
  <li><a href="https://www.npmjs.com/package/${escape(pkg.name)}">npm</a></li>
  <li><a href="${escape(pkg.bugs.url)}">Issues</a></li>
</ul>
</body>
</html>
`;

writeFileSync(join(out, 'index.html'), html);
// Keep Pages from running the output through Jekyll, which would drop dotfiles
// and reformat llms.txt.
writeFileSync(join(out, '.nojekyll'), '');
console.log(`Built site/ (index.html, llms.txt) for ${pkg.name}@${pkg.version}.`);
