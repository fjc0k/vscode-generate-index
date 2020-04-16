import { existsSync, readFileSync, writeFileSync } from 'fs'
import { IndexGenerator } from './IndexGenerator'

export async function generateIndex(
  filePath: string,
  replaceFile = false,
  onWarning?: (msg: string) => any,
): Promise<string> {
  if (!existsSync(filePath)) {
    throw new Error('File not found.')
  }
  let fileContent = readFileSync(filePath).toString()
  const generator = new IndexGenerator({
    filePath: filePath,
    fileContent: fileContent,
    onWarning: msg => {
      onWarning?.(msg)
    },
    onGenerate: ({ code, marker }) => {
      fileContent =
        fileContent.substr(0, marker.start) +
        code +
        fileContent.substr(marker.end, fileContent.length)
    },
  })
  await generator.generate()
  if (replaceFile) {
    writeFileSync(filePath, fileContent)
  }
  return fileContent
}
