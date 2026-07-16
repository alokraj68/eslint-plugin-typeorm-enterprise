# Security Policy

## Supported Versions

Security fixes are released for the latest published minor version.

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |
| < 1.0   | ❌        |

## Reporting a Vulnerability

Please do not open a public issue for security vulnerabilities.

Instead, report privately through GitHub's
[security advisory form](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/security/advisories/new).

Include:

- A description of the issue and its impact.
- Steps to reproduce (a minimal ESLint config and code sample is ideal).
- The plugin version, ESLint version, and Node.js version.

You can expect an initial acknowledgement within 72 hours. Once the issue is
confirmed, a fix and coordinated disclosure will be arranged. Reporters are
credited in the release notes unless anonymity is requested.

## Scope

This is a static analysis (lint) tool. It inspects source code and never
executes it. The most relevant concern is a rule producing incorrect results
(a false negative that lets raw SQL through, or a false positive that blocks
safe code). Reports of either are welcome through the process above.
