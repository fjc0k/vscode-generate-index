import tmp from 'tempy'
import { dedent } from 'vtils'
import { generateIndex } from './generateIndex'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { sync as rmrf } from 'rimraf'

let dir: string

beforeAll(() => {
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

afterAll(() => {
  rmrf(dir)
})

test('normal', async () => {
  const generatedContent = await generateIndex(join(dir, 'index.ts'))
  expect(generatedContent).toMatchSnapshot('generated content')
  expect(readFileSync(join(dir, 'index.ts')).toString()).toMatchSnapshot(
    'file content',
  )
})

test('replace', async () => {
  const generatedContent = await generateIndex(join(dir, 'index.ts'), true)
  expect(generatedContent).toMatchSnapshot('generated content')
  expect(readFileSync(join(dir, 'index.ts')).toString()).toMatchSnapshot(
    'file content',
  )
})

test('not found', async () => {
  let err: any
  try {
    await generateIndex(join(dir, 'no-file'))
  } catch (e) {
    err = e
  }
  expect(err).toMatchSnapshot()
})
