import { spawn } from 'child_process';
import path from 'path';

console.log("Spawning background repair task...");
const child = spawn('npx', ['tsx', 'repair-bg-worker.ts'], {
  detached: true,
  stdio: 'ignore'
});
child.unref();
console.log("Done. Worker is running in background.");
process.exit(0);
