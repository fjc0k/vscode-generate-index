import fs from 'fs-extra'
import path from 'path'
import pkg from '../package.json'
import { pick } from 'vtils'

async function main() {
  const pkgDir = path.join(__dirname, '../packages/vscode')
  await fs.ensureDir(pkgDir)
  await fs.emptyDir(pkgDir)

  // create package.json
  const pkgJsonFile = path.join(pkgDir, 'package.json')
  await fs.writeJSON(
    pkgJsonFile,
    {
      ...pick(pkg, [
        'name',
        'displayName',
        'version',
        'description',
        'categories',
        'repository',
        'license',
        'publisher',
        'contributes',
        'activationEvents',
        'engines',
        'icon',
      ]),
      main: './dist/extension.js',
    } as typeof pkg,
    {
      spaces: 2,
    },
  )

  // copy files
  const rootDir = path.join(__dirname, '..')
  await Promise.all(
    [
      'README.md',
      'CHANGELOG.md',
      'LICENSE',
      'dist/extension.js',
      'snippets',
      'assets',
    ].map(async file => {
      const srcFile = path.join(rootDir, file)
      const pkgFile = path.join(pkgDir, file)
      await fs.copy(srcFile, pkgFile)
    }),
  )
}

main()
