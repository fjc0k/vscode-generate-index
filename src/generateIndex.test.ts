import tmp from 'tempy'
import { basename, join } from 'path'
import { dedent } from 'vtils'
import { generateIndex, generateManyIndex } from './generateIndex'
import { readFileSync, removeSync, writeFileSync } from 'fs-extra'

let dir: string

beforeEach(() => {
  dir = tmp.directory()
  writeFileSync(
    join(dir, 'index.ts'),
    dedent`
      // @index('./*', f => \`export * from '\${f.path}'\`)
      // @endindex
    `,
  )
  writeFileSync(join(dir, 'x.ts'), '')
  writeFileSync(join(dir, '1.ts'), '')
  writeFileSync(join(dir, '国家.ts'), '')
  writeFileSync(join(dir, '_8.ts'), '')
})

afterEach(() => {
  removeSync(dir)
})

test('normal', async () => {
  const generatedContent = await generateIndex({
    filePath: join(dir, 'index.ts'),
  })
  expect(generatedContent).toMatchSnapshot('generated content')
  expect(readFileSync(join(dir, 'index.ts')).toString()).toMatchSnapshot(
    'file content',
  )
})

test('replace', async () => {
  const generatedContent = await generateIndex({
    filePath: join(dir, 'index.ts'),
    replaceFile: true,
  })
  expect(generatedContent).toMatchSnapshot('generated content')
  expect(readFileSync(join(dir, 'index.ts')).toString()).toMatchSnapshot(
    'file content',
  )
})

test('not found', async () => {
  let err: any
  try {
    await generateIndex({
      filePath: join(dir, 'no-file'),
    })
  } catch (e) {
    err = e
  }
  expect(err).toBeInstanceOf(Error)
  expect(String(err)).toMatch(/File not found.*no-file/)
})

test('many', async () => {
  const successMsgs: string[] = []
  const warningMsgs: string[] = []
  const res = await generateManyIndex({
    patterns: [dir],
    replaceFile: true,
    onSuccess: filePath => {
      successMsgs.push(basename(filePath))
    },
    onWarning: (filePath, msg) => {
      warningMsgs.push(`${basename(filePath)}: ${msg}`)
    },
  })
  expect(res.length).toEqual(1)
  expect(res[0].filePath).toMatch(/index\.ts/)
  expect(res[0].generatedFileContent).toMatchSnapshot(
    'res[0].generatedFileContent',
  )
  expect(successMsgs.sort()).toMatchSnapshot('successMsgs')
  expect(warningMsgs.sort()).toMatchSnapshot('warningMsgs')
})
