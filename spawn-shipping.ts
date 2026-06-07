import { spawn } from 'child_process';

console.log("Spawning shipping background task...");
const child = spawn('npx', ['tsx', 'populate-bg.ts'], {
  detached: true,
  stdio: 'ignore'
});
child.unref();
console.log("Done.");
process.exit(0);
