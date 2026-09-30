// Minimal TypeScript loader for node:test on Node 20 (CI runtime).
// Node 20 cannot import .ts files natively (type stripping landed in 22.6),
// so tests that exercise the real src/lib/*.ts modules register this hook:
//   node --import ./scripts/lib/register-ts.mjs --test <file>
// It transpiles with the project's own `typescript` devDependency (no type
// checking — `npm run typecheck` covers that) and resolves extensionless
// relative imports to .ts files, mirroring the Next.js bundler.
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL &&
    context.parentURL.endsWith(".ts") &&
    !/\.[cm]?[jt]sx?$|\.json$/.test(specifier)
  ) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);
    if (existsSync(fileURLToPath(candidate))) {
      return { url: candidate.href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("file:") && url.endsWith(".ts")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    const { outputText } = ts.transpileModule(source, {
      fileName: fileURLToPath(url),
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        verbatimModuleSyntax: false,
      },
    });
    return { format: "module", source: outputText, shortCircuit: true };
  }
  return nextLoad(url, context);
}

