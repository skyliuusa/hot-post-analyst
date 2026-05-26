import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const collectionToKind = {
  postSignals: 'postSignal',
  draftBriefs: 'draftBrief',
  reviewResults: 'reviewResult',
};

function kindForCollection(collection) {
  const kind = collectionToKind[collection];
  if (!kind) {
    throw new Error(`Unknown workspace collection: ${collection}`);
  }
  return kind;
}

function collectionForKind(kind) {
  return Object.entries(collectionToKind).find(([, itemKind]) => itemKind === kind)?.[0];
}

function ensureDatabaseDirectory(databasePath) {
  if (databasePath === ':memory:') return;
  mkdirSync(dirname(databasePath), { recursive: true });
}

export function createWorkspaceRepository(databasePath) {
  ensureDatabaseDirectory(databasePath);
  const database = new DatabaseSync(databasePath);

  database.exec(`
    CREATE TABLE IF NOT EXISTS workspace_items (
      kind TEXT NOT NULL,
      id TEXT NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (kind, id)
    )
  `);

  const saveStatement = database.prepare(`
    INSERT INTO workspace_items (kind, id, payload, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(kind, id) DO UPDATE SET
      payload = excluded.payload,
      updated_at = excluded.updated_at
  `);

  const loadStatement = database.prepare(`
    SELECT kind, payload
    FROM workspace_items
    ORDER BY updated_at DESC, rowid DESC
  `);

  function saveItem(collection, item) {
    const kind = kindForCollection(collection);
    if (!item || typeof item !== 'object' || typeof item.id !== 'string') {
      throw new Error('Workspace item must have a string id');
    }

    saveStatement.run(kind, item.id, JSON.stringify(item), item.updatedAt ?? new Date().toISOString());
  }

  function loadWorkspace() {
    const workspace = {
      postSignals: [],
      draftBriefs: [],
      reviewResults: [],
    };

    for (const row of loadStatement.all()) {
      const collection = collectionForKind(row.kind);
      if (!collection) continue;

      try {
        workspace[collection].push(JSON.parse(row.payload));
      } catch {
        // Ignore corrupt rows so one bad record does not block local startup.
      }
    }

    return workspace;
  }

  function close() {
    database.close();
  }

  return {
    close,
    loadWorkspace,
    saveItem,
  };
}
