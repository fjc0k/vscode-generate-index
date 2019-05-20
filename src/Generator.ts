import * as p from 'path'
import * as changeCase from 'change-case'
import * as vscode from 'vscode'
import { castArray, noop } from 'vtils'
import globby from 'globby'

type ChangeCase = typeof changeCase

interface ParsedPath {
  /** The relative file path without extension, such as `./api` */
  path: string,
  /** The file name without extension, such as `api` */
  name: string,
  /** The file extension, such as `.js`*/
  ext: string,
}

type Pattern = string

type CodeGenerator = (
  parsedPath: ParsedPath,
  changeCase: ChangeCase,
  extraInfo: {
    total: number,
    index: number,
    first: boolean,
    last: boolean,
  },
) => string

interface Marker {
  indent: string,
  start: number,
  end: number,
  patterns: Pattern[],
  codeGenerator: CodeGenerator,
}

export default class Generator {
  constructor(
    private document: vscode.TextDocument,
  ) {}

  async generateIndex() {
    const currentFile = this.document.uri.fsPath
    const currentDir = p.dirname(currentFile)
    const markers = this.findMarkers()
    if (markers.length) {
      const edit = new vscode.WorkspaceEdit()
      for (const marker of markers) {
        const paths = await globby(
          marker.patterns,
          {
            cwd: currentDir,
            absolute: true,
            onlyFiles: false,
          },
        )
        paths.sort(
          new Intl.Collator(
            ['en', 'co'],
            {
              sensitivity: 'base',
              numeric: true,
            },
          ).compare,
        )
        const codes = paths
          .filter(path => path !== currentFile)
          .map((path, index, paths) => {
            const pp = p.parse(path)
            const parsedPath: ParsedPath = {
              path: getRelativePath(currentDir, p.join(pp.dir, pp.name)),
              name: pp.name,
              ext: pp.ext,
            }
            const code = marker.codeGenerator(
              parsedPath,
              changeCase,
              {
                total: paths.length,
                index: index,
                first: index === 0,
                last: index === paths.length - 1,
              },
            )
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
      const startMatch = part.match(/([^\r\n]*)@index\(([^\r\n]+)\)[^\r\n]*(?=[\r\n]|$)/)
      if (!startMatch) break
      const endMatch = part.match(/[^\r\n]*@endindex/)
      const start = startFrom + startMatch.index! + startMatch[0].length
      const end = !endMatch ? text.length : startFrom + endMatch.index!
      const indent = startMatch[1].match(/^\s*/)![0]
      let patterns: Pattern[] = []
      let codeGenerator: CodeGenerator = noop
      // eslint-disable-next-line no-inner-declarations
      function setParams(
        localPatterns: Pattern | Pattern[],
        localCodeGenerator: CodeGenerator,
      ) {
        patterns = castArray(localPatterns)
        codeGenerator = localCodeGenerator
      }
      try {
        eval(`${setParams.name}(${startMatch[2]})`)
        markers.push({
          indent: indent,
          start: start,
          end: end,
          patterns: patterns,
          codeGenerator: codeGenerator,
        })
      } catch (e) {
        vscode.window.showWarningMessage(
          `[SKIP] Invalid patterns or code generator. (${startMatch[0].trim()})`,
        )
      }
      startFrom = end + (endMatch ? endMatch![0].length : 0)
    }

    markers.sort(
      (a, b) => b.start - a.start,
    )

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
