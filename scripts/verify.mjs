#!/usr/bin/env node
// verify.mjs — structural verification for the dsh-plugin-usage package.
// Run from the repository root:  node scripts/verify.mjs  (or npm run verify)
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
let failed = false
const check = (cond, msg) => {
  if (!cond) {
    failed = true
    console.error('FAIL: ' + msg)
  } else {
    console.log('ok:   ' + msg)
  }
}

// package.json fields
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
check(pkg.name === '@deepseek-ai/dsh-plugin-usage', 'package name')
check(typeof pkg.version === 'string' && /^\d+\.\d+\.\d+$/.test(pkg.version), 'semver version: ' + pkg.version)
check(pkg.type === 'module', 'type: module')
check(pkg.main === 'lib/index.js', 'main -> lib/index.js')
check(pkg.exports['.'], 'exports "."')
check(pkg.exports['./client'] === './lib/client.js', 'exports "./client"')
check(pkg.exports['./cordis.patch.yml'] === './cordis.patch.yml', 'exports "./cordis.patch.yml"')
check(pkg.license === 'MIT', 'MIT license')
check(pkg.dsh && pkg.dsh.bundle && pkg.dsh.bundle.patch === './cordis.patch.yml', 'dsh.bundle.patch')
check(pkg.dsh && pkg.dsh.client && pkg.dsh.client.platform === 'web', 'dsh.client.platform web')

// required files
for (const f of ['lib/index.js', 'lib/client.js', 'lib/types/index.d.ts', 'cordis.patch.yml', 'install.sh', 'README.md', 'README.zh.md', 'LICENSE']) {
  check(existsSync(join(root, f)), 'file exists: ' + f)
}

// cordis.patch.yml shape
const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')
check(patch.includes('ui-usage'), 'patch contains ui-usage id')
check(patch.includes('@deepseek-ai/dsh-plugin-usage'), 'patch contains plugin name')

// host exports
const host = readFileSync(join(root, 'lib/index.js'), 'utf8')
check(host.includes('export { apply }'), 'host exports apply')
check(host.includes('export const inject'), 'host exports inject')

// client shell
const client = readFileSync(join(root, 'lib/client.js'), 'utf8')
check(client.includes('window.__ModuleLoader__.load'), 'client uses ModuleLoader')
check(client.includes('exports.apply'), 'client exports apply')
check(client.includes('exports.inject'), 'client exports inject')

// privacy scan: no machine-specific leftovers
const SENSITIVE = [
  '/Users/', 'C:\\Users\\', '.git-credentials', 'ghp_', 'github_pat_', 'sk-',
  'api_key=', 'Authorization: Bearer', 'private key', 'BEGIN RSA PRIVATE',
]
const sources = ['lib/index.js', 'lib/client.js', 'install.sh', 'cordis.patch.yml', 'package.json', 'README.md', 'README.zh.md']
for (const f of sources) {
  const text = readFileSync(join(root, f), 'utf8')
  for (const s of SENSITIVE) {
    if (!text.includes(s)) continue
    // install.sh legitimately references .git-credentials inside its cleanup
    // `rm -rf` line (removing such files from the copied tree); that is a
    // privacy-positive action, not a leak.
    if (f === 'install.sh' && s === '.git-credentials') {
      const lines = text.split('\n').filter((l) => l.includes(s))
      if (lines.every((l) => l.includes('rm -rf') || l.includes('rm -'))) continue
    }
    failed = true
    console.error('FAIL: privacy marker "' + s + '" found in ' + f)
  }
}
console.log('ok:   privacy scan (no machine-specific / secret markers)')

if (failed) {
  console.error('\nverify failed')
  process.exit(1)
}
console.log('\nverify passed')
