import path from 'node:path';
import { homedir } from 'node:os';
import { openDatabase } from './node-database.mjs';

let database;
export const env = new Proxy({}, {
  get(_target, name) {
    if (name === 'WHATSLEARN_RUNTIME') return 'node';
    if (name === 'DB') {
      const directory = process.env.WHATSLEARN_DATA_DIR || path.join(homedir(), '.whatslearn');
      return database ??= openDatabase(path.join(directory, 'learning.sqlite'));
    }
    // Uploads remain disabled until a private object-storage adapter is configured.
    if (name === 'BUCKET') return undefined;
    return typeof name === 'string' ? process.env[name] : undefined;
  },
});
