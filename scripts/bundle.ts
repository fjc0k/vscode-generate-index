import { command as exec } from 'execa'

async function main() {
  await Promise.all(
    ['cli', 'extension', 'generateIndex'].map(async entry => {
      await exec(
        `microbundle -i src/${entry}.ts -o dist/${entry}.js --no-pkg-main -f cjs --external vscode,fsevents --target node --no-sourcemap --compress`,
        {
          stdio: 'inherit',
        },
      )
    }),
  )
}

main()
