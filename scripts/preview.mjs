import { fileURLToPath } from "node:url";
import { readServerCliOptions } from "./shared/cli-options.mjs";
import { startDocsStaticServer } from "./shared/docs-static-server.mjs";

const distDir = fileURLToPath(new URL("../.vitepress/dist/", import.meta.url));
const { host, port } = readServerCliOptions();

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
