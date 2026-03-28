import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {
  getCleanDocsPath,
  getRedirectTargetPathname,
  normalizeDocsPathname
} from "../../shared/docs-site-policy.mjs";

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

function isInsideRoot(rootDir, candidatePath) {
  const relativePath = path.relative(rootDir, candidatePath);
  return (
    relativePath === "" ||
    (
      relativePath !== ".." &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath)
    )
  );
}

function isExistingFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function resolveRequestPath(rootDir, pathname) {
  if (pathname === "/") {
    const rootIndexPath = path.resolve(rootDir, "index.html");
    return isExistingFile(rootIndexPath) ? rootIndexPath : null;
  }

  const safePathname = normalizeDocsPathname(pathname).replace(/^\/+/, "");
  const directPath = path.resolve(rootDir, safePathname);

  if (!isInsideRoot(rootDir, directPath)) {
    return null;
  }

  if (isExistingFile(directPath)) {
    return directPath;
  }

  if (!path.extname(directPath)) {
    const htmlPath = path.resolve(rootDir, `${safePathname}.html`);

    if (isInsideRoot(rootDir, htmlPath) && isExistingFile(htmlPath)) {
      return htmlPath;
    }

    const nestedIndexPath = path.resolve(rootDir, safePathname, "index.html");

    if (
      isInsideRoot(rootDir, nestedIndexPath) &&
      isExistingFile(nestedIndexPath)
    ) {
      return nestedIndexPath;
    }
  }

  return null;
}

function resolveNotFoundPage(rootDir) {
  const notFoundPath = path.resolve(rootDir, "404.html");
  return isExistingFile(notFoundPath) ? notFoundPath : null;
}

export async function startDocsStaticServer({
  rootDir,
  host = "127.0.0.1",
  port = 0
}) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", `http://${host}`);
    const normalizedPath = normalizeDocsPathname(requestUrl.pathname);
    const redirectTarget = getRedirectTargetPathname(normalizedPath);

    if (redirectTarget) {
      response.writeHead(308, {
        location: `${redirectTarget}${requestUrl.search}`,
        "cache-control": "no-store"
      });
      response.end();
      return;
    }

    const cleanPath = getCleanDocsPath(normalizedPath);

    if (cleanPath && cleanPath !== normalizedPath) {
      response.writeHead(308, {
        location: `${cleanPath}${requestUrl.search}`,
        "cache-control": "no-store"
      });
      response.end();
      return;
    }

    const filePath = resolveRequestPath(rootDir, normalizedPath);

    if (!filePath) {
      const notFoundFilePath = resolveNotFoundPage(rootDir);

      if (!notFoundFilePath) {
        response.writeHead(404, {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store"
        });
        response.end("Not found");
        return;
      }

      response.writeHead(404, {
        "content-type": getContentType(notFoundFilePath),
        "cache-control": "no-store"
      });

      const notFoundStream = fs.createReadStream(notFoundFilePath);

      notFoundStream.on("error", () => {
        if (!response.headersSent) {
          response.writeHead(500, {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store"
          });
          response.end("Internal error");
          return;
        }

        response.destroy();
      });

      notFoundStream.pipe(response);
      return;
    }

    response.writeHead(200, {
      "content-type": getContentType(filePath),
      "cache-control": "no-store"
    });

    const fileStream = fs.createReadStream(filePath);

    fileStream.on("error", () => {
      if (!response.headersSent) {
        response.writeHead(500, {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store"
        });
        response.end("Internal error");
        return;
      }

      response.destroy();
    });

    fileStream.pipe(response);
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
