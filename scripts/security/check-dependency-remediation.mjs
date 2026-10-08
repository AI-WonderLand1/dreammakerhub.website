import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const targets = [
  { file: 'package-lock.json', name: '@modelcontextprotocol/sdk', min: '1.31.0' },
  { file: 'my-agent/package-lock.json', name: '@modelcontextprotocol/sdk', min: '1.31.0' },
  { file: 'package-lock.json', name: 'decode-uri-component', min: '0.5.0' },
]

function compareVersion(version, minimum) {
  const a = version.split('.').map(Number)
  const b = minimum.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

let failures = 0
for (const { file, name, min } of targets) {
  const lock = JSON.parse(readFileSync(resolve(file), 'utf8'))
  const entries = Object.entries(lock.packages || {}).filter(([path]) =>
    path === `node_modules/${name}` || path.endsWith(`/node_modules/${name}`)
  )
  if (entries.length === 0) {
    console.error(`FAIL: ${name} is missing from ${file}`)
    failures++
    continue
  }
  for (const [path, entry] of entries) {
    if (compareVersion(entry.version, min) < 0) {
      console.error(`FAIL: ${file} ${path} remains vulnerable: ${entry.version} < ${min}`)
      failures++
    } else {
      console.log(`PASS: ${file} ${path} = ${entry.version}`)
    }
  }
}
if (failures) process.exitCode = 1
else console.log('Patched SDK and URI-decoder lockfile versions verified.')
