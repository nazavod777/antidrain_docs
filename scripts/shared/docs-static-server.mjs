import fs from "node:fs";
import http from "node:http";
import path from "node:path";

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".xml":
      return "application/xml; charset=utf-8";
    case ".png":
      return "image/png";
    case ".svg":
      return "image/svg+xml";
    case ".ico":
      return "image/x-icon";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}

export function getCleanDocsPath(pathname) {
  const normalizedPath = pathname.replace(/\/+$/u, "") || "/";

  if (/^\/index\.(?:html?|md)$/iu.test(normalizedPath)) {
    return "/";
  }

  const nestedIndexMatch = normalizedPath.match(/^\/(.+)\/index\.(?:html?|md)$/iu);

  if (nestedIndexMatch) {
    return `/${nestedIndexMatch[1].replace(/\/+$/u, "")}`;
  }

  const directExtensionMatch = normalizedPath.match(/^(.*)\.(?:html?|md)$/iu);

  if (!directExtensionMatch) {
    return null;
  }

  return directExtensionMatch[1] || "/";
}

function getRedirectTargetPathname(pathname) {
  const normalizedPath = pathname.replace(/\/+$/u, "") || "/";

  if (normalizedPath === "/") {
    return "/getting-started";
  }

  if (normalizedPath === "/ru") {
    return "/ru/getting-started";
  }

  return null;
}

function resolveRequestPath(rootDir, pathname) {
  if (pathname === "/") {
    return path.join(rootDir, "index.html");
  }

  const directPath = path.join(rootDir, pathname.replace(/^\/+/, ""));

  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return directPath;
  }

  if (!path.extname(directPath)) {
    const htmlPath = `${directPath}.html`;

    if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
      return htmlPath;
    }

    const nestedIndexPath = path.join(directPath, "index.html");

    if (fs.existsSync(nestedIndexPath) && fs.statSync(nestedIndexPath).isFile()) {
      return nestedIndexPath;
    }
  }

  return null;
}

export async function startDocsStaticServer({
  rootDir,
  host = "127.0.0.1",
  port = 0
}) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${host}`);
    const redirectTarget = getRedirectTargetPathname(requestUrl.pathname);

    if (redirectTarget) {
      response.writeHead(308, {
        location: `${redirectTarget}${requestUrl.search}`,
        "cache-control": "no-store"
      });
      response.end();
      return;
    }

    const cleanPath = getCleanDocsPath(requestUrl.pathname);

    if (cleanPath && cleanPath !== requestUrl.pathname) {
      response.writeHead(308, {
        location: `${cleanPath}${requestUrl.search}`,
        "cache-control": "no-store"
      });
      response.end();
      return;
    }

    const filePath = resolveRequestPath(rootDir, requestUrl.pathname);

    if (!filePath) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": getContentType(filePath),
      "cache-control": "no-store"
    });
    fs.createReadStream(filePath).pipe(response);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve(undefined));
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve the docs static server address.");
  }

  return {
    host,
    port: address.port,
    baseUrl: `http://${host}:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(undefined);
        });
      })
  };
}
