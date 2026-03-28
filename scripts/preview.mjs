import { fileURLToPath } from "node:url";
import { startDocsStaticServer } from "./shared/docs-static-server.mjs";

const distDir = fileURLToPath(new URL("../.vitepress/dist/", import.meta.url));

function readCliOption(name, fallbackValue) {
  const args = process.argv.slice(2);
  const optionIndex = args.lastIndexOf(name);

  if (optionIndex === -1) {
    return fallbackValue;
  }

  const nextValue = args[optionIndex + 1];
  return nextValue || fallbackValue;
}

const host = readCliOption("--host", "127.0.0.1");
const port = Number.parseInt(readCliOption("--port", "4175"), 10);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid docs preview port: ${port}`);
}

const server = await startDocsStaticServer({
  rootDir: distDir,
  host,
  port
});

console.log(`Built site served at ${server.baseUrl}/`);

const stopServer = async () => {
  await server.close();
  process.exit(0);
};

process.on("SIGINT", stopServer);
process.on("SIGTERM", stopServer);

await new Promise(() => {});
