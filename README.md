# Generate Index [![Test](https://github.com/fjc0k/vscode-generate-index/actions/workflows/test.yml/badge.svg)](https://github.com/fjc0k/vscode-generate-index/actions/workflows/test.yml)

Generating file indexes easily.

---

<!-- TOC depthFrom:2 -->

- [Usage](#usage)
- [@index()](#index)
- [Indentation](#indentation)
- [Standalone version](#standalone-version)
  - [Install](#install)
  - [Usage](#usage-1)
    - [CLI](#cli)
    - [API](#api)
- [License](#license)

<!-- /TOC -->

## Usage

In any file, simply invoke command `Generate Index` to generate a file list.

> To display the command palette, use the following keyboard shortcut, based on your installed operating system:
>
> - MacOS: `Command+Shift+P`
> - Windows: `Ctrl+Shift+P`

- Example 1: `src/components/index.js`

  ```js
  // @index('./**/*.jsx', f => `export * from '${f.path}'`)
  export * from './Button'
  export * from './Card'
  export * from './Modal'
  export * from './Modal/Alert'
  // @endindex
  ```

- Example 2: `src/styles/components.scss`

  ```scss
  // @index(['../components/**/*.scss', '!../components/**/_*.scss'], f => `@import '${f.path}';`)
  @import '../components/Button';
  @import '../components/Card';
  @import '../components/Modal';
  @import '../components/Modal/Alert';
  // @endindex
  ```

- Example 3: `src/assets/index.ts`

  ```js
  // @index('./*.{png,jpg,svg}', (f, _) => `export { default as img${_.pascalCase(f.name)} } from '${f.path}${f.ext}'`)
  export { default as imgHomeBanner } from './home-banner.png'
  export { default as imgPlaceholder } from './placeholder.jpg'
  export { default as imgDivider } from './divider.svg'
  // @endindex

  // @index('./*.{mp3,aac,m4a}', (f, _) => `export { default as audio${_.pascalCase(f.name)} } from '${f.path}${f.ext}'`)
  export { default as audioSailing } from './sailing.mp3'
  export { default as audioSummerWine } from './summer-wine.aac'
  export { default as audioThankYou } from './thank-you.m4a'
  // @endindex
  ```

- Example 4: exports all `./*.tsx?` and `./*/index.tsx?` files.

  ```js
  // @index(['./*.{ts,tsx}', './*/index.{ts,tsx}'], f => `export * from '${f.path.replace(/\/index$/, '')}'`)
  export * from './components'
  export * from './types'
  export * from './utils'
  // @endindex
  ```

- Example 5: produces the type of the `IconName`

  <!-- prettier-ignore -->
  ```js
  export type IconName =
    // @index(['./icons/*.svg'], (f, _, e) => `'${f.name}'${e.isLast ? '' : ' |'}`)
    'arrow' |
    'home' |
    'pass' |
    'picture' |
    'user'
    // @endindex
  ```

- Example 6: imports all scripts

  <!-- prettier-ignore -->
  ```html
  <html>
    <head>
      <!-- @index('./*.js', f => `<script type="text/javascript" src="${f.path}${f.ext}"></script>`) -->
      <script type="text/javascript" src="./jssdk.js"></script>
      <script type="text/javascript" src="./polyfill.js"></script>
      <!-- @endindex -->
    </head>
    <body>
      ...
    </body>
  </html>
  ```

## @index()

`index` is a function, used for producing index:

```ts
function index(
  patterns: Patterns,
  codeGenerator: CodeGenerator,
  globbyOptions?: GlobbyOptions,
): string {}
```

- **Patterns**

  ```ts
  type Patterns = string | string[]
  ```

  See supported `minimatch` [patterns](https://github.com/isaacs/minimatch#usage).

- **CodeGenerator**

  ```ts
  type CodeGenerator = (
    parsedPath: ParsedPath,
    changeCase: ChangeCase,
    extraInfo: ExtraInfo,
  ) => string

  interface ParsedPath {
    /** The relative file path without extension, such as `./api` */
    path: string
    /** The file name without extension, such as `api` */
    name: string
    /** The file extension, such as `.js`*/
    ext: string
  }

  interface ChangeCase {
    // See https://github.com/blakeembrey/change-case#usage
  }

  interface ExtraInfo {
    /** total number of items */
    total: number
    /** index of current item */
    index: number
    /** if current item is the first */
    isFirst: boolean
    /** if current item is the last */
    isLast: boolean
    /** if current item is a directory */
    isDir: boolean
    /** if current item is a file */
    isFile: boolean
  }
  ```

  See [all changeCase methods](https://github.com/blakeembrey/change-case#usage).

- **GlobbyOptions**

  See [https://github.com/sindresorhus/globby#options](https://github.com/sindresorhus/globby#options).

## Indentation

You can make an index indented by indenting the start marker, e.g.

```js
module.exports = {
  // @index('./*.js', (f, _) => `${_.constantCase(f.name)}: require('${f.path}'),`)
  // @endindex
}
```

The produced index like as:

```js
module.exports = {
  // @index('./*.js', (f, _) => `${_.constantCase(f.name)}: require('${f.path}'),`)
  MODULE1: require('./module1'),
  MODULE2: require('./module2'),
  // @endindex
}
```

## Standalone version

There is a standalone version here that allows you to use this feature without the help of VSCode.

### Install

```bash
# npm
npm i vscode-generate-index-standalone -D

# yarn
yarn add vscode-generate-index-standalone -D

# pnpm
pnpm add vscode-generate-index-standalone -D
```

### Usage

#### CLI

```bash
# npm
npx vscode-generate-index-standalone src/ scripts/

# yarn
yarn vscode-generate-index-standalone src/ scripts/

# pnpm
pnpx vscode-generate-index-standalone src/ scripts/
```

#### API

```js
import { generateIndex, generateManyIndex } from 'vscode-generate-index-standalone'
import { join } from 'path'

const generateResult = await generateIndex({
  filePath: join(__dirname, '../src/index.ts'),
  replaceFile: true,
}

const generateManyResult = await generateManyIndex({
  patterns: ['../src/**/index.ts', '!**/ignore/index.ts'],
  cwd: __dirname,
  replaceFile: true,
})
```

## License

Jay Fong (c) MIT
