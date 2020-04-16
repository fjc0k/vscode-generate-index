import * as changeCase from 'change-case'
import globby, { GlobbyOptions } from 'globby'
import { castArray, noop } from 'vtils'
import { CodeGenerator, Marker, ParsedPath, Pattern } from './types'
import { dirname, join, parse, relative } from 'path'
import { statSync } from 'fs'

export interface IndexGeneratorOptions {
  filePath: string
  fileContent: string
  onGenerate: (payload: { code: string; marker: Marker }) => any
  onWarning: (msg: string) => any
}

export class IndexGenerator {
  constructor(private options: IndexGeneratorOptions) {}

  public async generate() {
    const { filePath, fileContent, onWarning, onGenerate } = this.options
    const fileDir = dirname(filePath)
    const markers = IndexGenerator.findMarkers(fileContent, onWarning)
    if (markers.length) {
      for (const marker of markers) {
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
      }
    } else {
      onWarning('No @index maker found.')
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
      // eslint-disable-next-line no-inner-declarations
      function setParams(
        localPatterns: Pattern | Pattern[],
        localCodeGenerator: CodeGenerator,
        localGlobbyOptions: GlobbyOptions,
      ) {
        patterns = castArray(localPatterns)
        codeGenerator = localCodeGenerator
        globbyOptions = localGlobbyOptions
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
