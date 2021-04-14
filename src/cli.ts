#!/usr/bin/env node
import yargs from 'yargs'
import { generateManyIndex } from './generateIndex'
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
  .option('watch', {
    alias: 'w',
    type: 'array',
    describe: 'Watch paths',
  })
  .option('debug', {
    type: 'boolean',
    describe: 'Debug mode',
    default: false,
  })
  // Show help if no args
  // ref: https://github.com/yargs/yargs/issues/895
  .demandCommand(1, '').argv

generateManyIndex({
  patterns: argv._.map(String),
  replaceFile: true,
  cwd: argv.cwd,
  watch: argv.watch as any,
  onSuccess: filePath => {
    console.log(`✔️ ${IndexGenerator.getRelativePath(argv.cwd, filePath)}`)
  },
  onWarning: (filePath, msg) => {
    if (argv.debug) {
      console.warn(
        `⚠️ ${msg} <${IndexGenerator.getRelativePath(argv.cwd, filePath)}>`,
      )
    }
  },
}).catch(err => {
  throw err
})
