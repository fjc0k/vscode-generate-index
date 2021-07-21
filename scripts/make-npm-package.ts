import fs from 'fs-extra'
import globby from 'globby'
import path from 'path'
import pkg from '../package.json'
import { pick } from 'vtils'

async function main() {
  const pkgDir = path.join(__dirname, '../packages/npm')
  await fs.ensureDir(pkgDir)
  await fs.emptyDir(pkgDir)

  // create package.json
  const pkgJsonFile = path.join(pkgDir, 'package.json')
  await fs.writeJSON(
    pkgJsonFile,
    {
      ...pick(pkg, ['version', 'description', 'repository', 'license']),
      name: pkg.packageName,
      main: './dist/generateIndex.js',
      bin: {
        'vgis': './dist/cli.js',
        'vscode-generate-index-standalone': './dist/cli.js',
      },
      files: ['dist'],
      optionalDependencies: {
        fsevents: require('chokidar/package.json').optionalDependencies
          .fsevents,
      } as any,
    } as typeof pkg & {
      optionalDependencies?: Record<string, string>
    },
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
      'dist/generateIndex.js',
      'dist/cli.js',
      'dist/*.d.ts',
    ].map(async file => {
      const srcFile = path.join(rootDir, file)
      const srcFiles = await globby(srcFile, {
        onlyFiles: false,
        absolute: true,
        dot: true,
      })
      await Promise.all(
        srcFiles.map(async srcFile => {
          const pkgFile = srcFile.replace(rootDir, pkgDir)
          await fs.copy(srcFile, pkgFile)
        }),
      )
    }),
  )
}

main()
