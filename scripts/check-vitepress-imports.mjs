import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const docsRoot = fileURLToPath(new URL("../", import.meta.url));
const themeRoot = path.join(docsRoot, ".vitepress", "theme");
const supportFilePath = path.join(themeRoot, "support", "vitepress-default-theme.ts");
const expectedVersion = "1.6.4";

function fail(message) {
  throw new Error(message);
}

function collectSourceFiles(currentDir, bucket = []) {
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const absolutePath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      collectSourceFiles(absolutePath, bucket);
      continue;
    }

    if (entry.isFile() && /\.(?:ts|vue)$/u.test(entry.name)) {
      bucket.push(absolutePath);
    }
  }

  return bucket;
}

const packageJson = JSON.parse(
  fs.readFileSync(path.join(docsRoot, "package.json"), "utf8")
);

if (packageJson.devDependencies?.vitepress !== expectedVersion) {
  fail(
    `docs-site/package.json must pin vitepress to ${expectedVersion}. ` +
      `Found ${packageJson.devDependencies?.vitepress ?? "undefined"}.`
  );
}

const supportSource = fs.readFileSync(supportFilePath, "utf8");
const internalImports = [...supportSource.matchAll(/from\s+"([^"]+)"/gu)]
  .map((match) => match[1])
  .filter((specifier) => specifier.startsWith("vitepress/dist/client/theme-default/"));

if (internalImports.length === 0) {
  fail("No VitePress internal imports were found in vitepress-default-theme.ts.");
}

for (const specifier of internalImports) {
  try {
    require.resolve(specifier);
  } catch (error) {
    fail(`Broken VitePress internal import: ${specifier}\n${String(error)}`);
  }
}

for (const filePath of collectSourceFiles(themeRoot)) {
  if (filePath === supportFilePath) {
    continue;
  }

  const source = fs.readFileSync(filePath, "utf8");

  if (source.includes("vitepress/dist/client/theme-default/")) {
    fail(
      `Direct VitePress internal import found outside the shared adapter: ` +
        `${path.relative(docsRoot, filePath)}`
    );
  }
}

console.log(`Validated ${internalImports.length} VitePress internal imports`);
