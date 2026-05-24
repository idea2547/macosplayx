/**
 * OpenNext Cloudflare build/deploy with IPv4-first DNS.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'node_modules', '@opennextjs', 'cloudflare', 'dist', 'cli', 'index.js');

const IPV4_FIRST = '--dns-result-order=ipv4first';

function mergedNodeOptions() {
  const cur = (process.env.NODE_OPTIONS || '').trim();
  if (cur.includes('dns-result-order')) return cur || undefined;
  return [cur, IPV4_FIRST].filter(Boolean).join(' ').trim();
}

function run(subcommand) {
  const env = { ...process.env };
  const opts = mergedNodeOptions();
  if (opts) env.NODE_OPTIONS = opts;

  const r = spawnSync(process.execPath, [cli, subcommand], {
    cwd: root,
    stdio: 'inherit',
    env,
  });
  return r.status ?? 1;
}

const deployOnly = process.argv.includes('--deploy-only');

if (deployOnly) {
  process.exit(run('deploy'));
}

// Clean previous build
try {
  const fs = await import('node:fs');
  const dir = path.join(root, '.open-next');
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
} catch {}

const code = run('build');
if (code !== 0) process.exit(code);

process.exit(run('deploy'));
