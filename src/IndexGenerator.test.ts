import { IndexGenerator } from './IndexGenerator'
import { join } from 'path'
import { readFileSync } from 'fs'

const indexFilePaths = [
  join(__dirname, './__fixtures__/cross/index.txt'),
  join(__dirname, './__fixtures__/scss/index.scss'),
  join(__dirname, './__fixtures__/sort/index.ts'),
  join(__dirname, './__fixtures__/sort/index2.ts'),
  join(__dirname, './__fixtures__/invalid/empty'),
  join(__dirname, './__fixtures__/invalid/error'),
  join(__dirname, './__fixtures__/all_ts_tsx/index.ts'),
  join(__dirname, './__fixtures__/types/index.ts'),
  join(__dirname, './__fixtures__/scripts/index.html'),
  join(__dirname, './__fixtures__/cross_negative/index.txt'),
  join(__dirname, './__fixtures__/re/index.js'),
  join(__dirname, './__fixtures__/re_pattern/index'),
  join(__dirname, './__fixtures__/bug1/index'),
]

test('ok', async () => {
  for (const filePath of indexFilePaths) {
    let fileContent: string = readFileSync(filePath).toString()
    const msgs: string[] = []
    const generator = new IndexGenerator({
      filePath: filePath,
      fileContent: fileContent,
      onWarning: msg => {
        msgs.push(msg)
      },
      onGenerate: ({ code, marker }) => {
        fileContent =
          fileContent.substr(0, marker.start) +
          code +
          fileContent.substr(marker.end, fileContent.length)
      },
    })
    await generator.generate()
    const humanFilePath = filePath.replace(
      join(__dirname, './__fixtures__'),
      '',
    )
    expect(fileContent).toMatchSnapshot(`generated content of ${humanFilePath}`)
    expect(msgs.sort()).toMatchSnapshot(`messages of ${humanFilePath}`)
  }
})
