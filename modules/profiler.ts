import { defineNuxtModule } from '@nuxt/kit';
import { writeHeapSnapshot } from 'v8';
import { mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const SNAPSHOTS_DIR = './snapshots';
const MAX_REGULAR = 2;

const cleanOldRegularSnapshots = () => {
  try {
    const files = readdirSync(SNAPSHOTS_DIR)
      .filter(f => f.startsWith('regular-') && f.endsWith('.heapsnapshot'))
      .sort((a, b) => {
        const timeA = parseInt(a.split('-')[1]);
        const timeB = parseInt(b.split('-')[1]);
        return timeB - timeA;
      });

    files.slice(MAX_REGULAR).forEach(file => {
      unlinkSync(join(SNAPSHOTS_DIR, file));
    });
  } catch (err) {
    console.error('Error cleaning old snapshots:', err);
  }
};

export default defineNuxtModule({
  setup() {
    const makeSnapshot = (isInitial = false) => {
      try {
        const type = isInitial ? 'initial' : 'regular';
        const filename = `${type}-${Date.now()}.heapsnapshot`;
        
        mkdirSync(SNAPSHOTS_DIR, { recursive: true });
        const snapshotPath = writeHeapSnapshot(join(SNAPSHOTS_DIR, filename));
        
        if (!isInitial) {
          cleanOldRegularSnapshots();
        }
      } catch (err) {
        console.error('Error creating snapshot:', err);
      }
    };

    setTimeout(() => makeSnapshot(true), 2 * 60 * 1000);
    setInterval(() => makeSnapshot(false), 10 * 60 * 1000);
  }
});
