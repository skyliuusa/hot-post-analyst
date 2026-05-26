import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createLocalServer } from './index.mjs';
import { createWorkspaceRepository } from './workspaceRepository.mjs';

let tempDir;
let runningServer;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'hpa-server-'));
});

afterEach(async () => {
  if (runningServer) {
    await new Promise((resolve) => runningServer.close(resolve));
    runningServer = undefined;
  }
  rmSync(tempDir, { recursive: true, force: true });
});

async function startTestServer(repository) {
  const server = createLocalServer({
    repository,
    staticRoot: join(tempDir, 'dist'),
  });
  await new Promise((resolve) => {
    runningServer = server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = runningServer.address();
  return `http://127.0.0.1:${port}`;
}

describe('local persistence API', () => {
  it('stores workspace items and returns the hydrated workspace', async () => {
    const repository = createWorkspaceRepository(join(tempDir, 'workspace.sqlite'));
    const baseUrl = await startTestServer(repository);

    const saveResponse = await fetch(`${baseUrl}/api/workspace/postSignals/post-1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'post-1', title: 'Saved through API', updatedAt: '2026-05-22T00:00:00.000Z' }),
    });

    assert.equal(saveResponse.status, 200);
    assert.deepEqual(await saveResponse.json(), { ok: true });

    const workspaceResponse = await fetch(`${baseUrl}/api/workspace`);

    assert.equal(workspaceResponse.status, 200);
    assert.deepEqual(await workspaceResponse.json(), {
      postSignals: [{ id: 'post-1', title: 'Saved through API', updatedAt: '2026-05-22T00:00:00.000Z' }],
      draftBriefs: [],
      reviewResults: [],
    });
  });

  it('rejects mismatched route and payload ids', async () => {
    const repository = createWorkspaceRepository(join(tempDir, 'workspace.sqlite'));
    const baseUrl = await startTestServer(repository);

    const response = await fetch(`${baseUrl}/api/workspace/postSignals/post-1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'post-2', title: 'Wrong id' }),
    });

    assert.equal(response.status, 400);
    assert.match(await response.text(), /payload id must match route id/i);
  });
});
