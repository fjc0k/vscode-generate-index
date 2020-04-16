import * as changeCase from 'change-case'
import * as fs from 'fs'
import * as p from 'path'
import * as vscode from 'vscode'
import globby, { GlobbyOptions } from 'globby'
import { castArray, noop } from 'vtils'

type ChangeCase = typeof changeCase

interface ParsedPath {
  /** The relative file path without extension, such as `./api` */
  path: string
  /** The file name without extension, such as `api` */
  name: string
  /** The file extension, such as `.js`*/
  ext: string
}

type Pattern = string

type CodeGenerator = (
  parsedPath: ParsedPath,
  changeCase: ChangeCase,
  extraInfo: {
    total: number
    index: number
    /** @deprecated */
    first: boolean
    /** @deprecated */
    last: boolean
    isFirst: boolean
    isLast: boolean
    isDir: boolean
    isFile: boolean
  },
) => string

interface Marker {
  indent: string
  start: number
  end: number
  patterns: Pattern[]
  codeGenerator: CodeGenerator
  globbyOptions: GlobbyOptions
}

export default class Generator {
  constructor(private document: vscode.TextDocument) {}

  async generateIndex() {
    const currentFile = this.document.uri.fsPath
    const currentDir = p.dirname(currentFile)
    const markers = this.findMarkers()
    if (markers.length) {
      const edit = new vscode.WorkspaceEdit()
      for (const marker of markers) {
        const paths = await globby(marker.patterns, {
          dot: true,
          onlyFiles: false,
          gitignore: false, // TODO: fix https://github.com/sindresorhus/globby/issues/133
          ...(marker.globbyOptions || {}),
          cwd: currentDir,
          absolute: true,
        })
        paths.sort(
          new Intl.Collator(['en', 'co'], {
            sensitivity: 'base',
            numeric: true,
          }).compare,
        )
        const codes = paths
          .filter(path => path !== currentFile)
          .map((path, index, paths) => {
            const pp = p.parse(path)
            const parsedPath: ParsedPath = {
              // eslint-disable-next-line @typescript-eslint/no-use-before-define
              path: getRelativePath(currentDir, p.join(pp.dir, pp.name)),
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
                return fs.statSync(path).isDirectory()
              },
              get isFile() {
                return fs.statSync(path).isFile()
              },
            })
            return marker.indent + code
          })
        edit.replace(
          this.document.uri,
          new vscode.Range(
            this.document.positionAt(marker.start),
            this.document.positionAt(marker.end),
          ),
          `${marker.start === 0 ? '' : '\n'}${codes.join('\n')}\n`,
        )
      }
      await vscode.workspace.applyEdit(edit)
    } else {
      vscode.window.showInformationMessage('No @index maker found.')
    }
  }

  findMarkers(): Marker[] {
    const markers: Marker[] = []

    const text = this.document.getText()
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
        vscode.window.showWarningMessage(
          `[SKIP] Invalid patterns or code generator. (${startMatch[0].trim()})`,
        )
      }
      startFrom = end + (endMatch ? endMatch![0].length : 0)
    }

    markers.sort((a, b) => b.start - a.start)

    return markers
  }
}

function normalizePath(path: string): string {
  return path.replace(/[/\\]+/g, '/')
}

function getRelativePath(from: string, to: string): string {
  const relativePath = normalizePath(p.relative(from, to))
  return relativePath.startsWith('../') ? relativePath : `./${relativePath}`
}
