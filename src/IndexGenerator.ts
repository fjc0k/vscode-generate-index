import * as changeCase from 'change-case'
import globby, { GlobbyOptions } from 'globby'
import { castArray, isRegExp, noop } from 'vtils'
import {
  CodeGenerator,
  CodeGeneratorRe,
  Marker,
  ParsedPath,
  Pattern,
} from './types'
import { dirname, join, parse, relative } from 'path'
import { readFile, statSync } from 'fs-extra'

export interface IndexGeneratorOptions {
  filePath: string
  fileContent: string
  onGenerate: (payload: { code: string; marker: Marker }) => any
  onWarning: (msg: string) => any
}

export class IndexGenerator {
  constructor(private options: IndexGeneratorOptions) {}

  public async generate(): Promise<false | void> {
    const { filePath, fileContent, onWarning, onGenerate } = this.options
    const fileDir = dirname(filePath)
    const markers = IndexGenerator.findMarkers(fileContent, onWarning)
    if (markers.length) {
      for (const marker of markers) {
        if (!marker.isRe) {
          const paths = await globby(marker.patterns, {
            dot: true,
            onlyFiles: false,
            // TODO: fix https://github.com/sindresorhus/globby/issues/133
            gitignore: false,
            ...(marker.globbyOptions || {}),
            cwd: fileDir,
            absolute: true,
          })
          paths.sort(
            new Intl.Collator(['en', 'co'], {
              sensitivity: 'base',
              numeric: true,
            }).compare,
          )
          const codes = paths
            .filter(path => path !== filePath)
            .map((path, index, paths) => {
              const pp = parse(path)
              const parsedPath: ParsedPath = {
                path: IndexGenerator.getRelativePath(
                  fileDir,
                  join(pp.dir, pp.name),
                ),
                name: pp.name,
                ext: pp.ext,
              }
              const code = marker.codeGenerator(parsedPath, changeCase, {
                get total() {
                  return paths.length
                },
                get index() {
                  return index
                },
                get first() {
                  return index === 0
                },
                get last() {
                  return index === paths.length - 1
                },
                get isFirst() {
                  return index === 0
                },
                get isLast() {
                  return index === paths.length - 1
                },
                get isDir() {
                  return statSync(path).isDirectory()
                },
                get isFile() {
                  return statSync(path).isFile()
                },
              })
              return marker.indent + code
            })
          await onGenerate({
            marker: marker,
            code: `${marker.start === 0 ? '' : '\n'}${codes.join('\n')}\n`,
          })
        } else {
          const sourceContent = await readFile(
            join(fileDir, marker.fileRe),
            'utf-8',
          )
          const region = sourceContent.match(marker.regionRe)?.[0] || ''
          // @ts-ignore
          const matches = [...(region.matchAll(marker.matchRe) || [])]
          const codes = matches.map((match, index, { length }) => {
            const code = marker.codeGeneratorRe(match, changeCase, {
              get total() {
                return length
              },
              get index() {
                return index
              },
              get isFirst() {
                return index === 0
              },
              get isLast() {
                return index === length - 1
              },
            })
            return marker.indent + code
          })
          await onGenerate({
            marker: marker,
            code: `${marker.start === 0 ? '' : '\n'}${codes.join('\n')}\n`,
          })
        }
      }
    } else {
      onWarning('No @index maker found.')
      return false
    }
  }

  public static findMarkers(
    text: string,
    onInvalid?: (msg: string) => any,
  ): Marker[] {
    const markers: Marker[] = []

    const textSize = text.length
    let startFrom = 0
    while (startFrom < textSize) {
      const part = text.substr(startFrom)
      const startMatch = part.match(
        /([^\r\n]*)@index\(([^\r\n]+)\)[^\r\n]*(?=[\r\n]|$)/,
      )
      if (!startMatch) break
      const endMatch = part.match(/[^\r\n]*@endindex/)
      const start = startFrom + startMatch.index! + startMatch[0].length
      const end = !endMatch ? text.length : startFrom + endMatch.index!
      const indent = startMatch[1].match(/^\s*/)![0]
      let patterns: Pattern[] = []
      let codeGenerator: CodeGenerator = noop
      let globbyOptions: GlobbyOptions = {}
      let isRe = false
      let fileRe = ''
      let codeGeneratorRe: CodeGeneratorRe = noop
      let regionRe = /1/
      let matchRe = /1/
      // eslint-disable-next-line no-inner-declarations
      function setParams(...args: any[]) {
        if (isRegExp(args[1])) {
          // eslint-disable-next-line prefer-const
          let [_file, _regionRe, _matchRe, _codeGeneratorRe]: [
            Pattern,
            RegExp,
            RegExp,
            CodeGeneratorRe,
          ] = args as any
          if (_codeGeneratorRe == null) {
            _codeGeneratorRe = _matchRe as any
            _matchRe = _regionRe as any
            _regionRe = /^.+$/s as any
          }
          if (typeof _file !== 'string') {
            throw new TypeError('Invalid file')
          }
          isRe = true
          fileRe = _file
          regionRe = _regionRe
          matchRe = _matchRe
          codeGeneratorRe = _codeGeneratorRe
        } else {
          const [_patterns, _codeGenerator, _globbyOptions]: [
            Pattern | Pattern[],
            CodeGenerator,
            GlobbyOptions,
          ] = args as any
          if (_patterns == null) {
            throw new TypeError('Invalid patterns')
          }
          patterns = castArray(_patterns)
          codeGenerator = _codeGenerator
          globbyOptions = _globbyOptions
        }
      }
      try {
        eval(`${setParams.name}(${startMatch[2]})`)
        markers.push({
          indent: indent,
          start: start,
          end: end,
          patterns: patterns,
          codeGenerator: codeGenerator,
          globbyOptions: globbyOptions,
          isRe: isRe,
          fileRe: fileRe,
          regionRe: regionRe,
          matchRe: matchRe,
          codeGeneratorRe: codeGeneratorRe,
        })
      } catch (e) {
        onInvalid?.(
          `[SKIP] Invalid patterns or code generator. (${startMatch[0].trim()})`,
        )
      }
      startFrom = end + (endMatch ? endMatch![0].length : 0)
    }

    markers.sort((a, b) => b.start - a.start)

    return markers
  }

  public static normalizePath(path: string): string {
    return path.replace(/[/\\]+/g, '/')
  }

  public static getRelativePath(from: string, to: string): string {
    const relativePath = IndexGenerator.normalizePath(relative(from, to))
    return relativePath.startsWith('../') ? relativePath : `./${relativePath}`
  }
}
