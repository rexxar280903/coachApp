import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { transform } from 'esbuild';

test('compiled Vercel entry loads in native Node ESM and handles requests', async () => {
  const workspace = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
  const runtimeDir = await mkdtemp(join(workspace, '.vercel-runtime-'));
  try {
    await writeFile(join(runtimeDir, 'package.json'), '{"type":"module"}');
    for (const source of ['api/portal-receipt-images', 'server/portalReceiptImages']) {
      await mkdir(dirname(join(runtimeDir, source)), { recursive: true });
      const result = await transform(await readFile(join(workspace, `${source}.ts`), 'utf8'), {
        loader: 'ts', format: 'esm', target: 'node22',
      });
      await writeFile(join(runtimeDir, `${source}.js`), result.code);
    }
    // No tsx loader or bundler: exercise the same relative imports used by Node
    // after Vercel compiles TypeScript, so extensionless imports cannot be masked.
    const output = execFileSync(process.execPath, ['--input-type=module', '--eval', `
      import handler from './api/portal-receipt-images.js';
      const headers = {};
      const response = {
        setHeader(name, value) { headers[name] = value; },
        end(body) { console.log(JSON.stringify({status:this.statusCode,headers,body:JSON.parse(body)})); }
      };
      await handler({method:'GET',headers:{}}, response);
    `], { cwd: runtimeDir, env: { ...process.env, NODE_OPTIONS: '' }, encoding: 'utf8', timeout: 15000 });
    const response = JSON.parse(output);
    assert.equal(response.status, 405);
    assert.equal(response.headers.Allow, 'POST');
    assert.equal(response.headers['Cache-Control'], 'no-store');
    assert.deepEqual(response.body, { error: 'Gunakan POST.' });
  } finally {
    assert.equal(dirname(runtimeDir), workspace);
    assert.ok(runtimeDir.startsWith(join(workspace, '.vercel-runtime-')));
    await rm(runtimeDir, { recursive: true, force: true });
  }
});
