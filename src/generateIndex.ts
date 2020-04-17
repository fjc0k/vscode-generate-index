import globby from 'globby'
import { IndexGenerator } from './IndexGenerator'
import { Merge } from 'vtils'
import { pathExists, readFile, writeFile } from 'fs-extra'

export interface GenerateIndexPayload {
  filePath: string
  replaceFile?: boolean
  onWarning?: (msg: string) => any
}

export async function generateIndex(
  {
    filePath,
    replaceFile = false,
    onWarning,
  }: GenerateIndexPayload = {} as any,
): Promise<string | false> {
  if (!(await pathExists(filePath))) {
    throw new Error(`File not found. <${filePath}>`)
  }
  const fileContent = (await readFile(filePath)).toString()
  let generatedFileContent = fileContent
  const generator = new IndexGenerator({
    filePath: filePath,
    fileContent: fileContent,
    onWarning: msg => {
      onWarning?.(msg)
    },
    onGenerate: ({ code, marker }) => {
      generatedFileContent =
        generatedFileContent.substr(0, marker.start) +
        code +
        generatedFileContent.substr(marker.end, generatedFileContent.length)
    },
  })
  const generateResult = await generator.generate()
  if (
    generateResult !== false &&
    replaceFile &&
    generatedFileContent !== fileContent
  ) {
    await writeFile(filePath, generatedFileContent)
  }
  return generateResult === false ? false : generatedFileContent
}

export interface GenerateManyIndexPayload {
  patterns: string | string[]
  cwd?: string
  replaceFile: boolean
  onWarning?: (filePath: string, msg: string) => any
  onSuccess?: (filePath: string) => any
}

export interface GenerateManyIndexResult {
  filePath: string
  generatedFileContent: string
}

export async function generateManyIndex(
  {
    patterns,
    cwd = process.cwd(),
    replaceFile = false,
    onWarning,
    onSuccess,
  }: GenerateManyIndexPayload = {} as any,
): Promise<GenerateManyIndexResult[]> {
  if (!patterns.length) return []
  const filePaths = await globby(patterns, {
    absolute: true,
    cwd: cwd,
    dot: true,
    onlyFiles: true,
    unique: true,
    gitignore: false,
  })
  const result = await Promise.all(
    filePaths.map<
      Promise<
        Merge<GenerateManyIndexResult, { generatedFileContent: string | false }>
      >
    >(async filePath => {
      const generatedFileContent = await generateIndex({
        filePath: filePath,
        replaceFile: replaceFile,
        onWarning: msg => onWarning?.(filePath, msg),
      })
      if (generatedFileContent !== false) {
        onSuccess?.(filePath)
      }
      return {
        filePath: filePath,
        generatedFileContent: generatedFileContent,
      }
    }),
  )
  return result.filter(item => item.generatedFileContent !== false) as any
}
