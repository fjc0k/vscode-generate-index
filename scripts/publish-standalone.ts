import pkg from '../package.json'
import tmp from 'tempy'
import { copySync, writeFileSync } from 'fs-extra'
import { sync as exec } from 'cross-spawn'
import { join } from 'path'
import { sync as rmrf } from 'rimraf'

const packageInfo: Record<keyof typeof pkg, any> = {
  ...pkg,
  'name': pkg.packageName,
  'main': './out/generateIndex.js',
  'scripts': undefined,
  'contributes': undefined,
  'devDependencies': undefined,
  'engines': undefined,
  'jest': undefined,
  'lint-staged': undefined,
  'activationEvents': undefined,
  'categories': undefined,
  'displayName': undefined,
  'packageName': undefined,
  'publisher': undefined,
  'husky': undefined,
  'icon': undefined,
}

const packageDir = tmp.directory()

writeFileSync(
  join(packageDir, 'package.json'),
  JSON.stringify(packageInfo, null, 2),
)

copySync(join(__dirname, '../LICENSE'), join(packageDir, 'LICENSE'))
copySync(join(__dirname, '../README.md'), join(packageDir, 'README.md'))
copySync(join(__dirname, '../out'), join(packageDir, 'out'))

exec('npm', ['publish'], { cwd: packageDir, stdio: 'inherit' })

rmrf(packageDir)
