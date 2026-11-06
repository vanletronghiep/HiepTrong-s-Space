import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const portIndex = process.argv.indexOf('--port');
const port = portIndex < 0 ? 4137 : Number(process.argv[portIndex + 1]);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.md': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};
const allowed = ['/review/phase01/', '/brand/', '/earth/', '/src/design/tokens.css'];
const server = http.createServer(async (request, response) => {
  try {
    let route = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (route === '/') route = '/review/phase01/view.html';
    if (route === '/vendor/starfield-engine.js') {
      const source = await fs.readFile(
        path.join(root, 'src/features/home/starfield/starfield-engine.ts'),
        'utf8',
      );
      response.writeHead(200, { 'Content-Type': mime['.js'], 'Cache-Control': 'no-store' });
      return response.end(
        ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        }).outputText,
      );
    }
    let file;
    if (route === '/vendor/inter-latin.woff2') {
      const css = await fs.readFile(path.join(root, '.next/static/css/app/layout.css'), 'utf8');
      const face = css.match(
        /\/\* latin \*\/\s*@font-face\s*\{[^}]*font-family:\s*'Inter';[^}]*src:\s*url\(\/_next\/static\/media\/([^/)]+\.woff2)\)/,
      );
      if (!face) {
        response.writeHead(404);
        return response.end('Run npm run dev once to prepare the existing Inter font.');
      }
      file = path.join(root, '.next/static/media', face[1]);
    } else if (route === '/sources/img/img0.png') {
      file = path.join(root, 'sources/img/img0.png');
    } else if (route === '/public/earth/ATTRIBUTION.md') {
      file = path.join(root, 'public/earth/ATTRIBUTION.md');
    } else if (route === '/vendor/three.module.js' || route === '/vendor/three.core.js') {
      file = path.join(root, 'node_modules/three/build', path.basename(route));
    } else {
      if (!allowed.some((prefix) => route.startsWith(prefix))) {
        response.writeHead(404);
        return response.end('Not found');
      }
      const relative =
        route.startsWith('/brand/') || route.startsWith('/earth/')
          ? `public${route}`
          : route.slice(1);
      file = path.resolve(root, relative.endsWith('/') ? `${relative}index.html` : relative);
      const permittedRoots = [
        path.join(root, 'public/brand') + path.sep,
        path.join(root, 'public/earth') + path.sep,
        path.join(root, 'review/phase01') + path.sep,
      ];
      if (
        !permittedRoots.some((prefix) => file.startsWith(prefix)) &&
        file !== path.join(root, 'src/design/tokens.css')
      ) {
        response.writeHead(403);
        return response.end('Forbidden');
      }
    }
    const data = await fs.readFile(file);
    response.writeHead(200, {
      'Content-Type': mime[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(data);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500);
    response.end(error.code === 'ENOENT' ? 'Not found' : 'Review server error');
  }
});
server.listen(port, '127.0.0.1', () => process.stdout.write(`Local: http://127.0.0.1:${port}/\n`));
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.close(() => process.exit(0)));
