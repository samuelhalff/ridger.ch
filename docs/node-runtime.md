# Node.js Runtime Guidance

The project is pinned to the Active LTS line of Node.js 20 because it matches Next.js 14's supported range and all of our deployment tooling. `package.json` enforces this with `"engines": { "node": ">=20 <21" }` in combination with `.npmrc`'s `engine-strict=true`.

## Recommended workflow

1. Install Node.js 20.x through your preferred version manager (`nvm`, `asdf`, `fnm`, `volta`, etc.).
2. Run `node --version` to confirm you are on the 20.x line (for example `v20.17.0`).
3. Install dependencies with `npm ci` or `npm install` once the version matches the engine constraint.
4. Keep CI runners on Node.js 20 as well. The deployment scripts and the production server also expect the same runtime.

## Why not Node.js 22?

- Next.js 14.2 only supports Node.js versions up to 20.x. Node.js 22 is outside of that range and triggers the `engine-strict` guard during installation.
- Upgrading to Node.js 22 would require bumping Next.js to a release that advertises compatibility with 22, validating all build outputs, and re-testing the standalone artifact on the VPS.
- Staying on Node.js 20 avoids unnecessary regressions while we stabilise the recent i18n changes.

If you encounter an environment that ships with Node.js 22 by default (e.g. a fresh container), use your version manager to switch down to Node.js 20 before installing dependencies.
