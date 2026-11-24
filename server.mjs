import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const mime = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
]);
const port = Number(process.env.PORT ?? 4173);

createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request");
    return;
  }
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const servedPath = requestedPath.startsWith("/assets/") ? `/public${requestedPath}` : requestedPath;
  const filePath = resolve(root, `.${servedPath}`);
  if (!filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }
  try {
    const data = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mime.get(extname(filePath)) ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(data);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    console.error(`Could not serve ${pathname}:`, error);
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal server error");
  }
}).listen(port, () => console.log(`Matchly is running at http://localhost:${port}`));
