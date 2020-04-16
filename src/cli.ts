#!/usr/bin/env node
import globby from 'globby'
import yargs from 'yargs'
import { generateIndex } from './generateIndex'
import { IndexGenerator } from './IndexGenerator'

const argv = yargs
  .usage('Usage: $0 <pattern> [<pattern> ...] [options]')
  .help('help', 'Show help')
  .alias('help', 'h')
  .option('cwd', {
    type: 'string',
    describe: 'Current working directory',
    default: process.cwd(),
  })
  // Show help if no args
  // ref: https://github.com/yargs/yargs/issues/895
  .demandCommand(1, '').argv

const filePaths = !argv._.length
  ? []
  : globby.sync(argv._, {
      absolute: true,
      cwd: argv.cwd,
      dot: true,
      onlyFiles: true,
      unique: true,
      gitignore: false,
    })

for (const filePath of filePaths) {
  generateIndex(filePath, true).then(() => {
    console.log(`✔️ ${IndexGenerator.getRelativePath(argv.cwd, filePath)}`)
  })
}
