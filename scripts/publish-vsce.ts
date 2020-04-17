import pkg from '../package.json'
import tmp from 'tempy'
import { copySync, writeFileSync } from 'fs-extra'
import { sync as exec } from 'cross-spawn'
import { join } from 'path'
import { sync as rmrf } from 'rimraf'

const packageInfo: Record<keyof typeof pkg, any> = {
  ...pkg,
  main: './dist/extension.js',
}

const packageDir = tmp.directory()

writeFileSync(
  join(packageDir, 'package.json'),
  JSON.stringify(packageInfo, null, 2),
)

const list = [
  'LICENSE',
  'README.md',
  'CHANGELOG.md',
  'snippets',
  'assets',
  'dist',
]

list.forEach(item => {
  copySync(join(__dirname, `../${item}`), join(packageDir, item))
})

exec('vsce', ['publish'], { cwd: packageDir, stdio: 'inherit' })

rmrf(packageDir)
