# Generate Index

Generating file indexes easily.

## Wherever

In any file, simply invoke command `Generate Index` to generate a file list.

- Example 1: `src/index.js`

  ```js
  export { default as module1 } from './module1'
  export { default as module2 } from './module2'
  ```

- Example 2: `utils.ts`

  ```js
  // @index('../utils/*.ts')
  export { default as util1 } from '../utils/util1'
  export { default as util2 } from '../utils/util1'
  ```

- Example 3: `styles/components.scss`

  ```scss
  // @index('./components/*.scss', pp => `@import '${pp.path}';`)
  @import './components/component1';
  @import './components/component2';
  ```

- Example 4: `assets/index.ts`

  ```js
  // @index('./*.{png,jpg,svg}', pp => `export { default as ${pp.name} } from '${pp.path}${pp.ext}'`)
  export { default as image1 } from './image1.png'
  export { default as image2 } from './image2.jpg'
  export { default as image3 } from './image3.svg'
  ```

## Markers

You can use markers (`@index()` and `@endindex`) to tell where the index should be built, instead of replacing the entire file:

```js
// This line will remain in the file.

// @index()

// ... The index will be (re)placed here.  

// @endindex

// This line will remain in the file.
```

## @index()

`index` is a function, used for producing index:

```ts
function index(
  patterns: Patterns,
  codeGenerator: CodeGenerator,
): string {
  // generate index
}
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
  ) => string

  interface ParsedPath {
    /** The relative file path without extension, such as `./api` */
    path: string,
    /** The file name without extension, such as `api` */
    name: string,
    /** The file extension, such as `.js`*/
    ext: string,
  }

  interface ChangeCase {
    // See https://github.com/blakeembrey/change-case#usage
  }
  ```

  See [all changeCase methods](ChangeCase).

## Indentation

You can make an index indented by indenting the start marker, e.g.

```js
module.exports = {
  // @index('./*.js', (pp, cc) => `${cc.constantCase(pp.name)}: require('${pp.path}'),`)
  // @endindex
}
```

The produced index like as:

```js
module.exports = {
  // @index('./*.js', (pp, cc) => `${cc.constantCase(pp.name)}: require('${pp.path}'),`)
  MODULE1: require('./module1'),
  MODULE2: require('./module2'),
  // @endindex
}
```