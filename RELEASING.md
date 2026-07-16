# Releasing

`dev` is the integration branch. `main` is always a fast-forward of `dev`, so
the two never diverge and there is no reverse sync.

## Rules

- All work and all version bumps happen on `dev`. The pre-commit hook bumps the
  patch version on every `dev` commit (and only on `dev`).
- `main` never gets its own commits. It only ever fast-forwards to `dev`.
- Pushing to `main` triggers the publish workflow, which publishes to npm via
  Trusted Publishing (OIDC) when the version is new.

## Cutting a release

1. Make sure `dev` is green (`npm run ci`) and the version is what you want to
   publish (bump manually if you need a minor/major: `npm version minor
   --no-git-tag-version` on `dev`, commit, push).
2. Fast-forward `main` to `dev` and push:

   ```bash
   git checkout main
   git merge --ff-only dev
   git push origin main
   git checkout dev
   ```

   (The push to `main` is an admin fast-forward; branch protection allows it for
   the owner. Because it is a fast-forward, `main` and `dev` stay identical.)

3. The publish workflow runs on `main`, republishes only if the version is new,
   and creates the GitHub release.

## Why fast-forward instead of a merge PR

A merge-commit PR adds a commit to `main` that isn't on `dev`, which makes `dev`
look "behind" and forces a reverse fast-forward every time. Fast-forwarding
`main` to `dev` keeps both branches pointing at the same commit — no divergence,
no reverse sync, ever.
