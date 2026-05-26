import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorkspaceRepository } from './workspaceRepository.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const collections = new Set(['postSignals', 'draftBriefs', 'reviewResults']);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(message);
}

async function readJsonBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw new Error('Request body is too large');
    }
  }
  return JSON.parse(body || '{}');
}

function resolveStaticPath(staticRoot, urlPath) {
  const decodedPath = decodeURIComponent(urlPath);
  const candidatePath = decodedPath === '/' ? '/index.html' : decodedPath;
  const resolvedPath = normalize(join(staticRoot, candidatePath));
  const root = resolve(staticRoot);

  if (!resolve(resolvedPath).startsWith(root)) {
    return null;
  }

  if (existsSync(resolvedPath) && statSync(resolvedPath).isFile()) {
    return resolvedPath;
  }

  const fallback = join(staticRoot, 'index.html');
  return existsSync(fallback) ? fallback : null;
}

function serveStatic(response, staticRoot, urlPath) {
  const filePath = resolveStaticPath(staticRoot, urlPath);
  if (!filePath) {
    sendText(response, 404, 'Build output not found. Run npm run build first.');
    return;
  }

  response.writeHead(200, {
    'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
  });
  createReadStream(filePath).pipe(response);
}

export function createLocalServer({ repository, staticRoot = join(projectRoot, 'dist') } = {}) {
  const workspaceRepository = repository ?? createWorkspaceRepository(join(projectRoot, 'data', 'hot-post-analyst.sqlite'));

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');

      if (request.method === 'GET' && url.pathname === '/api/workspace') {
        sendJson(response, 200, workspaceRepository.loadWorkspace());
        return;
      }

      const saveMatch = url.pathname.match(/^\/api\/workspace\/([^/]+)\/([^/]+)$/);
      if (request.method === 'PUT' && saveMatch) {
        const [, collection, routeId] = saveMatch;
        if (!collections.has(collection)) {
          sendText(response, 404, 'Unknown workspace collection');
          return;
        }

        const item = await readJsonBody(request);
        if (!item || typeof item !== 'object' || item.id !== routeId) {
          sendText(response, 400, 'Payload id must match route id');
          return;
        }

        workspaceRepository.saveItem(collection, item);
        sendJson(response, 200, { ok: true });
        return;
      }

      if (url.pathname.startsWith('/api/')) {
        sendText(response, 404, 'Not found');
        return;
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        sendText(response, 405, 'Method not allowed');
        return;
      }

      serveStatic(response, staticRoot, url.pathname);
    } catch (error) {
      sendText(response, 500, error instanceof Error ? error.message : 'Internal server error');
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const host = process.env.HOST ?? '127.0.0.1';
  const port = Number(process.env.PORT ?? '4173');
  const server = createLocalServer();

  server.listen(port, host, () => {
    console.log(`Hot Post Analyst local server: http://${host}:${port}`);
  });
}
